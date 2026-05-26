import Link from "next/link";
import { notFound } from "next/navigation";
import { findProduct, formatNaira, products } from "../../market-data";
import styles from "../../portal.module.css";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = findProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>OI</span>
          <div>
            <strong>Omo Iya Exchange</strong>
            <span>Secure Digital Marketplace</span>
          </div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/">Marketplace</Link>
          <Link href="/checkout">Checkout</Link>
          <Link href="/login">Sign in</Link>
        </nav>
      </header>

      <section className={styles.twoColumn}>
        <img className={styles.productImage} src={product.image} alt={product.name} />
        <aside className={styles.card}>
          <span className={styles.badge}>{product.badge}</span>
          <h1 className={styles.headline}>{product.name}</h1>
          <p className={styles.lead}>{product.description}</p>
          <p className={styles.price}>{formatNaira(product.price)}</p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span>Category</span>
              <strong>{product.category}</strong>
            </div>
            <div className={styles.stat}>
              <span>Country</span>
              <strong>{product.country}</strong>
            </div>
            <div className={styles.stat}>
              <span>Available</span>
              <strong>{product.availability}</strong>
            </div>
          </div>
          <div className={styles.metaGrid}>
            <span>{product.region}</span>
            <span>{product.fulfillmentWindow}</span>
            <span>{product.delivery}</span>
          </div>
          <div className={styles.list}>
            {product.includes.map((item) => (
              <div className={styles.listItem} key={item}>
                <strong>{item}</strong>
                <span>Included</span>
              </div>
            ))}
          </div>
          <Link className={styles.button} href="/checkout">
            Order with Paystack
          </Link>
        </aside>
      </section>
    </main>
  );
}
