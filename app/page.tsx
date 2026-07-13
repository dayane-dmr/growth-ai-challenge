import Link from "next/link";
import products from "@/data/products.json";
import type { Product } from "@/types/product";

export default function Home() {
  const productList: Product[] = products;

  return (
    <div>
      <h1>Produtos</h1>
      <ul>
        {productList.map((product) => (
          <li key={product.id}>
            <h2>{product.title}</h2>
            <p>{product.category}</p>
            <p>{product.description}</p>
            <Link href={`/product/${product.id}`}>Ver detalhes</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
