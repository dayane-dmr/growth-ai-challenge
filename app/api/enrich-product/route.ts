import { NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  EnrichProductRequest,
  EnrichProductResponse,
  Faq,
} from "@/types/enrich-product";

type EnrichProductCache = Map<string, EnrichProductResponse>;

declare global {
  var enrichProductCache: EnrichProductCache | undefined;
}

function getCache(): EnrichProductCache {
  if (!globalThis.enrichProductCache) {
    globalThis.enrichProductCache = new Map<string, EnrichProductResponse>();
  }

  return globalThis.enrichProductCache;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

class MissingApiKeyError extends Error {}
class EnrichmentValidationError extends Error {}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!isNonEmptyString(apiKey)) {
    throw new MissingApiKeyError("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

function isFaq(value: unknown): value is Faq {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const { question, answer } = value as Record<string, unknown>;

  return isNonEmptyString(question) && isNonEmptyString(answer);
}

function isEnrichProductResponse(
  value: unknown
): value is EnrichProductResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const { bullets, faqs } = value as Record<string, unknown>;

  const hasValidBullets =
    Array.isArray(bullets) &&
    bullets.length >= 2 &&
    bullets.length <= 3 &&
    bullets.every(isNonEmptyString);

  const hasValidFaqs =
    Array.isArray(faqs) && faqs.length === 3 && faqs.every(isFaq);

  return hasValidBullets && hasValidFaqs;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    bullets: {
      type: "array",
      items: { type: "string", minLength: 1 },
      minItems: 2,
      maxItems: 3,
    },
    faqs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string", minLength: 1 },
          answer: { type: "string", minLength: 1 },
        },
        required: ["question", "answer"],
        additionalProperties: false,
      },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: ["bullets", "faqs"],
  additionalProperties: false,
} as const;

function buildPrompt(product: EnrichProductRequest): string {
  return `Você é um redator de e-commerce. Gere conteúdo em português do Brasil para a página do produto abaixo, usando apenas as informações fornecidas.

Título: ${product.productTitle}
Categoria: ${product.category}
Descrição: ${product.productDescription}

Regras obrigatórias:
- Responda sempre em português do Brasil.
- Gere de 2 a 3 benefícios objetivos do produto, baseados exclusivamente no título, categoria e descrição fornecidos.
- Gere exatamente 3 perguntas frequentes com respostas, coerentes com as informações fornecidas.
- Não invente características, especificações ou funcionalidades que não estejam na descrição.
- Não faça promessas médicas, garantias comerciais ou qualquer afirmação que não esteja explicitamente fornecida acima.
- Responda apenas com o JSON estruturado solicitado, sem texto adicional.`;
}

async function generateEnrichment(
  product: EnrichProductRequest
): Promise<EnrichProductResponse> {
  const client = getClient();

  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: buildPrompt(product),
    text: {
      format: {
        type: "json_schema",
        name: "product_enrichment",
        schema: RESPONSE_SCHEMA,
        strict: true,
      },
    },
  });

  let parsed: unknown;

  try {
    parsed = JSON.parse(response.output_text);
  } catch {
    throw new EnrichmentValidationError("OpenAI returned invalid JSON.");
  }

  if (!isEnrichProductResponse(parsed)) {
    throw new EnrichmentValidationError(
      "OpenAI returned content in an unexpected format."
    );
  }

  return parsed;
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const bypassCache = searchParams.get("regenerate") === "true";

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { message: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const { productId, productTitle, productDescription, category } =
    body as Record<string, unknown>;

  if (!isNonEmptyString(productId)) {
    return NextResponse.json(
      { message: "productId is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  if (!isNonEmptyString(productTitle)) {
    return NextResponse.json(
      { message: "productTitle is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  if (!isNonEmptyString(productDescription)) {
    return NextResponse.json(
      {
        message:
          "productDescription is required and must be a non-empty string.",
      },
      { status: 400 }
    );
  }

  if (!isNonEmptyString(category)) {
    return NextResponse.json(
      { message: "category is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  const cache = getCache();

  if (!bypassCache) {
    const cached = cache.get(productId);

    if (cached) {
      return NextResponse.json(cached);
    }
  }

  try {
    const enrichment = await generateEnrichment({
      productId,
      productTitle,
      productDescription,
      category,
    });

    cache.set(productId, enrichment);

    return NextResponse.json(enrichment);
  } catch (error) {
    console.error(error);

    if (error instanceof MissingApiKeyError) {
      return NextResponse.json(
        { message: "AI service is not configured." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Failed to generate product enrichment." },
      { status: 500 }
    );
  }
}
