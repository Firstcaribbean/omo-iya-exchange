import Link from "next/link";
import { formatNaira, products } from "../market-data";
import styles from "../portal.module.css";

export default function DashboardPage() {
  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>OI</span>
          <div>
            <strong>Omo Iya Exchange</strong>
            <span>Customer dashboard</span>
          </div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/">Marketplace</Link>
          <Link href="/checkout">Checkout</Link>
          <Link href="/login">Sign out</Link>
        </nav>
      </header>

      <section className={styles.dashboardGrid}>
        <aside className={styles.sidebar}>
          <strong>Customer menu</strong>
          <nav>
            <a href="#overview">Overview</a>
            <a href="#purchases">My purchases</a>
            <a href="#wallet">Wallet</a>
            <a href="#support">Support</a>
            <a href="#settings">Settings</a>
          </nav>
        </aside>

        <div className={styles.panel} id="overview">
          <p className={styles.eyebrow}>Welcome back</p>
          <h1 className={styles.headline}>Your digital products hub.</h1>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span>Wallet balance</span>
              <strong>{formatNaira(0)}</strong>
            </div>
            <div className={styles.stat}>
              <span>Purchases</span>
              <strong>2</strong>
            </div>
            <div className={styles.stat}>
              <span>Open tickets</span>
              <strong>1</strong>
            </div>
          </div>

          <h2 id="purchases">Recent purchases</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 3).map((product, index) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{index === 0 ? "Fulfilled" : "Paid"}</td>
                  <td>
                    <Link href={`/products/${product.slug}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
