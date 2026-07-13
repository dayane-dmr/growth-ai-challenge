"use client";

import { useCallback, useEffect, useState } from "react";
import type { EnrichProductResponse, Faq } from "@/types/enrich-product";

interface ProductAIWidgetProps {
  productId: string;
  productTitle: string;
  productDescription: string;
  category: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();

    if (
      typeof data === "object" &&
      data !== null &&
      typeof (data as Record<string, unknown>).message === "string"
    ) {
      return (data as Record<string, unknown>).message as string;
    }
  } catch {
    return "Não foi possível carregar o conteúdo gerado por IA.";
  }

  return "Não foi possível carregar o conteúdo gerado por IA.";
}

export default function ProductAIWidget({
  productId,
  productTitle,
  productDescription,
  category,
}: ProductAIWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bullets, setBullets] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  const fetchEnrichment = useCallback(
    async (regenerate?: boolean) => {
      setError(null);
      setLoading(true);

      try {
        const url = regenerate
          ? "/api/enrich-product?regenerate=true"
          : "/api/enrich-product";

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            productTitle,
            productDescription,
            category,
          }),
        });

        if (!response.ok) {
          setError(await getErrorMessage(response));
          return;
        }

        const data: unknown = await response.json();

        if (!isEnrichProductResponse(data)) {
          setError("Não foi possível carregar o conteúdo gerado por IA.");
          return;
        }

        setBullets(data.bullets);
        setFaqs(data.faqs);
      } catch {
        setError("Não foi possível carregar o conteúdo gerado por IA.");
      } finally {
        setLoading(false);
      }
    },
    [productId, productTitle, productDescription, category]
  );

  useEffect(() => {
    void fetchEnrichment();
  }, [fetchEnrichment]);

  const hasContent = bullets.length > 0 || faqs.length > 0;

  return (
    <section>
      <h2>Conteúdo gerado por IA</h2>

      {loading && <p>Carregando conteúdo gerado por IA...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && !hasContent && <p>Nenhum conteúdo disponível.</p>}

      {!loading && !error && hasContent && (
        <>
          <ul>
            {bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>

          <section>
            <h3>Perguntas frequentes</h3>
            <dl>
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <dt>{faq.question}</dt>
                  <dd>{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}

      <button
        type="button"
        onClick={() => void fetchEnrichment(true)}
        disabled={loading}
      >
        Regenerar
      </button>
    </section>
  );
}
