import Link from "next/link";
import { formatNaira, products } from "../market-data";
import styles from "../portal.module.css";

const cartPreview = products.slice(0, 2);
const subtotal = cartPreview.reduce((sum, product) => sum + product.price, 0);

export default function CheckoutPage() {
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
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/login">Sign in</Link>
        </nav>
      </header>

      <section className={styles.twoColumn}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Secure checkout</p>
          <h1 className={styles.headline}>Review order and pay in NGN.</h1>
          <p className={styles.lead}>
            The next integration step will create a pending order, initialize a
            Paystack transaction, and redirect the buyer to the hosted payment
            page.
          </p>
          <form className={styles.form}>
            <label>
              Buyer email
              <input defaultValue="customer@example.com" type="email" />
            </label>
            <label>
              Payment method
              <select defaultValue="paystack">
                <option value="paystack">Paystack card, transfer, USSD</option>
                <option value="wallet">Wallet balance</option>
              </select>
            </label>
            <button className={styles.button} type="button">
              Initialize Paystack payment
            </button>
          </form>
        </div>

        <aside className={styles.card}>
          <span className={styles.badge}>Order summary</span>
          <div className={styles.list}>
            {cartPreview.map((product) => (
              <div className={styles.listItem} key={product.id}>
                <strong>{product.name}</strong>
                <span>{formatNaira(product.price)}</span>
              </div>
            ))}
            <div className={styles.listItem}>
              <strong>Subtotal</strong>
              <span>{formatNaira(subtotal)}</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
