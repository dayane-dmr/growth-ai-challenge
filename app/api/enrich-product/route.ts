import { NextResponse } from "next/server";
import type { EnrichProductResponse } from "@/types/enrich-product";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function buildMockResponse(): EnrichProductResponse {
  return {
    bullets: [
      "Alta qualidade e durabilidade comprovadas",
      "Ótimo custo-benefício em relação à categoria",
      "Bem avaliado por outros clientes",
    ],
    faqs: [
      {
        question: "Qual o prazo de entrega?",
        answer:
          "O prazo de entrega varia conforme a região, em média de 3 a 7 dias úteis.",
      },
      {
        question: "O produto possui garantia?",
        answer:
          "Sim, o produto possui garantia de 90 dias contra defeitos de fabricação.",
      },
      {
        question: "É possível trocar o produto?",
        answer:
          "Sim, trocas podem ser solicitadas em até 30 dias após a compra.",
      },
    ],
  };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
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

  return NextResponse.json(buildMockResponse());
}
