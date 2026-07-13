import Image from "next/image";
import Link from "next/link";

import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />

      <section className={styles.container}>
        <Image
          src="/images/logo.png"
          alt="logo-dyn-shop"
          width={180}
          height={180}
          className={styles.logo}
        />

        <span className={styles.badge}>Página não encontrada</span>

        <h1 className={styles.title}>404</h1>

        <p className={styles.subtitle}>
          Não encontramos a página que você está procurando.
        </p>

        <p className={styles.description}>
          O endereço pode estar incorreto ou a página pode ter sido removida
          do catálogo.
        </p>

        <div className={styles.card}>
          <span className={styles.errorCode}>Erro 404</span>

          <p className={styles.cardMessage}>
            A página que você tentou acessar não existe ou não está mais
            disponível.
          </p>

          <Link className={styles.button} href="/">
            <span>Voltar ao catálogo</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
