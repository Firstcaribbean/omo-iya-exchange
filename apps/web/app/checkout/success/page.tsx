import Link from "next/link";
import styles from "../../portal.module.css";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.ref || params.reference || params.trxref;

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>OI</span>
          <div>
            <strong>Omo Iya Exchange</strong>
            <span>Payment received</span>
          </div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <section className={styles.card}>
        <p className={styles.eyebrow}>Checkout complete</p>
        <h1 className={styles.headline}>Your order is being processed.</h1>
        <p className={styles.lead}>
          Payment confirmation will appear in your dashboard once Paystack
          verification and fulfillment are complete.
        </p>
        {reference ? (
          <div className={styles.listItem}>
            <strong>Payment reference</strong>
            <span>{reference}</span>
          </div>
        ) : null}
        <div className={styles.inlineActions}>
          <Link className={styles.button} href="/dashboard">Open dashboard</Link>
          <Link className={styles.ghostButton} href="/marketplace">Continue shopping</Link>
        </div>
      </section>
    </main>
  );
}
