"use client";

import { useState } from "react";

interface ProductAIWidgetProps {
  productId: string;
  productTitle: string;
  productDescription: string;
  category: string;
}

interface Faq {
  question: string;
  answer: string;
}

const MOCK_BULLETS: string[] = [
  "Alta qualidade e durabilidade comprovadas",
  "Ótimo custo-benefício em relação à categoria",
  "Bem avaliado por outros clientes",
];

const MOCK_FAQS: Faq[] = [
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
    answer: "Sim, trocas podem ser solicitadas em até 30 dias após a compra.",
  },
];

export default function ProductAIWidget({
  productId,
  productTitle,
  productDescription,
  category,
}: ProductAIWidgetProps) {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bullets, setBullets] = useState<string[]>(MOCK_BULLETS);
  const [faqs, setFaqs] = useState<Faq[]>(MOCK_FAQS);

function handleRegenerate() {
  console.log({
    productId,
    productTitle,
    productDescription,
    category,
  });
}

  return (
    <section>
      <h2>Conteúdo gerado por IA</h2>

      {loading && <p>Carregando...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
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

      <button type="button" onClick={handleRegenerate}>
        Regenerar
      </button>
    </section>
  );
}
