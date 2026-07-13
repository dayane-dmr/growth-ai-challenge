export interface EnrichProductRequest {
  productId: string;
  productTitle: string;
  productDescription: string;
  category: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface EnrichProductResponse {
  bullets: string[];
  faqs: Faq[];
}
