import { notFound } from "next/navigation";
import products from "@/data/products.json";
import type { Product } from "@/types/product";
import ProductAIWidget from "@/components/ProductAIWidget";

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
    <div>
      <h1>{product.title}</h1>
      <p>{product.category}</p>
      <p>{product.description}</p>
      <ProductAIWidget
        productId={product.id}
        productTitle={product.title}
        productDescription={product.description}
        category={product.category}
      />
    </div>
  );
}
