import { notFound } from "next/navigation";
import products from "@/data/products.json";
import type { Product } from "@/types/product";
import ProductAIWidget from "@/components/ProductAIWidget";

import styles from "./page.module.css";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const productList: Product[] = products;
  const product = productList.find((item) => item.id === id);

  if (!product) {
    notFound();
  }

  return (
    <>
      <div className={styles.productCard}>
        <span className={styles.category}>{product.category}</span>

        <h1>{product.title}</h1>

        <p>{product.description}</p>

        <div className={styles.tags}>
          <span>Produto #{product.id}</span>
          <span>Catálogo DYN</span>
        </div>
      </div>

      <ProductAIWidget
        productId={product.id}
        productTitle={product.title}
        productDescription={product.description}
        category={product.category}
      />
    </>
  );
}
