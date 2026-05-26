import Link from "next/link";
import { formatNaira, products } from "../market-data";
import styles from "../portal.module.css";

export default function AdminPage() {
  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>OI</span>
          <div>
            <strong>Omo Iya Exchange</strong>
            <span>Admin operations</span>
          </div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/">Marketplace</Link>
          <Link href="/dashboard">Customer view</Link>
          <Link href="/login">Sign out</Link>
        </nav>
      </header>

      <section className={styles.adminGrid}>
        <div className={styles.card}>
          <span className={styles.badge}>Revenue</span>
          <h2>{formatNaira(642500)}</h2>
          <p className={styles.finePrint}>Mock month-to-date revenue in NGN.</p>
        </div>
        <div className={styles.card}>
          <span className={styles.badge}>Orders</span>
          <h2>48</h2>
          <p className={styles.finePrint}>12 pending manual fulfillment.</p>
        </div>
        <div className={styles.card}>
          <span className={styles.badge}>Users</span>
          <h2>214</h2>
          <p className={styles.finePrint}>4 users require review.</p>
        </div>
      </section>

      <section className={styles.twoColumn}>
        <div className={styles.panel}>
          <p className={styles.eyebrow}>Catalog CRUD</p>
          <h1 className={styles.headline}>Manage digital products.</h1>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{formatNaira(product.price)}</td>
                  <td>Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className={styles.card}>
          <span className={styles.badge}>Order queue</span>
          <div className={styles.list}>
            <div className={styles.listItem}>
              <strong>ORD-1027</strong>
              <span>Approve</span>
            </div>
            <div className={styles.listItem}>
              <strong>ORD-1026</strong>
              <span>Fulfill</span>
            </div>
            <div className={styles.listItem}>
              <strong>Ticket #44</strong>
              <span>Assign</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
