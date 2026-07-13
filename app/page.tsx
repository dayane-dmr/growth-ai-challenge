import Link from "next/link";
import products from "@/data/products.json";
import type { Product } from "@/types/product";

import styles from "./page.module.css";
import Image from "next/image";

export default function Home() {
  const productList: Product[] = products;

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />

      <section className={styles.container}>
        <header className={styles.hero}>
          <Image
            src="/images/logo.png"
            alt="logo-dyn-shop"
            width={340}
            height={340}
            className={styles.logo}
          />

          <h1>
            Produtos melhores com
            <span> conteúdo inteligente</span>
          </h1>

          <p>
            Explore o catálogo e gere benefícios e perguntas frequentes
            personalizadas com inteligência artificial.
          </p>
        </header>

        <section className={styles.catalog}>
          <div className={styles.catalogHeader}>
            <div>
              <span className={styles.sectionLabel}>Catálogo</span>
              <h2>Produtos disponíveis</h2>
            </div>

            <span className={styles.productCount}>
              {productList.length} produtos
            </span>
          </div>

          <ul className={styles.grid}>
            {productList.map((product, index) => (
              <li className={styles.card} key={product.id}>
                <div className={styles.cardTop}>
                  <span className={styles.category}>{product.category}</span>

                  <span className={styles.number}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className={styles.cardContent}>
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.aiLabel}>
                    <span className={styles.aiDot} />
                    Enriquecimento com IA
                  </span>

                  <Link className={styles.link} href={`/product/${product.id}`}>
                    Ver produto
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
