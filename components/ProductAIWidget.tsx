"use client";

import { useCallback, useEffect, useState } from "react";
import type { EnrichProductResponse, Faq } from "@/types/enrich-product";

import styles from "./ProductAIWidget.module.css";



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
  <section className={styles.widget}>
    <div className={styles.widgetHeader}>
      <div>
        <span className={styles.eyebrow}>Assistente de produto</span>
        <h2>Conteúdo gerado por IA</h2>
      </div>

      <span className={styles.status}>
        <span />
        IA ativa
      </span>
    </div>

    {loading && (
      <div className={styles.loading}>
        <span className={styles.spinner} />
        <div>
          <strong>Gerando conteúdo</strong>
          <p>A inteligência artificial está analisando o produto.</p>
        </div>
      </div>
    )}

    {!loading && error && (
      <div className={styles.error} role="alert">
        <strong>Não foi possível gerar o conteúdo.</strong>
        <span>{error}</span>
      </div>
    )}

    {!loading && !error && !hasContent && (
      <div className={styles.empty}>
        <p>Nenhum conteúdo disponível.</p>
      </div>
    )}

    {!loading && !error && hasContent && (
      <div className={styles.content}>
        <section className={styles.benefitsSection}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionLabel}>Benefícios</span>
            <span className={styles.sectionCount}>{bullets.length}</span>
          </div>

          <ul className={styles.benefits}>
            {bullets.map((bullet) => (
              <li key={bullet}>
                <span className={styles.bulletIcon}>✓</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.faqSection}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionLabel}>Dúvidas comuns</span>
              <h3>Perguntas frequentes</h3>
            </div>

            <span className={styles.sectionCount}>{faqs.length}</span>
          </div>

          <dl className={styles.faqList}>
            {faqs.map((faq) => (
              <div className={styles.faqItem} key={faq.question}>
                <dt>{faq.question}</dt>
                <dd>{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    )}

    <button
      className={styles.button}
      type="button"
      onClick={() => void fetchEnrichment(true)}
      disabled={loading}
    >
      <span>{loading ? "Gerando..." : "Regenerar conteúdo"}</span>
      {!loading && <span aria-hidden="true">↻</span>}
    </button>
  </section>
);
}
