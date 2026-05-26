import Link from "next/link";
import styles from "../portal.module.css";

export default function RegisterPage() {
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
          <Link href="/login">Sign in</Link>
        </nav>
      </header>

      <section className={styles.twoColumn}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Create account</p>
          <h1 className={styles.headline}>Start buying verified products.</h1>
          <form className={styles.form}>
            <label>
              First name
              <input placeholder="Amina" />
            </label>
            <label>
              Last name
              <input placeholder="Bello" />
            </label>
            <label>
              Email address
              <input placeholder="you@example.com" type="email" />
            </label>
            <label>
              Phone number
              <input placeholder="+234..." />
            </label>
            <label>
              Password
              <input placeholder="Create a password" type="password" />
            </label>
            <button className={styles.button} type="button">
              Create account
            </button>
          </form>
        </div>

        <aside className={styles.card}>
          <span className={styles.badge}>Buyer portal</span>
          <h2>What your account unlocks</h2>
          <div className={styles.list}>
            <div className={styles.listItem}>
              <strong>Instant downloads</strong>
              <span>After payment</span>
            </div>
            <div className={styles.listItem}>
              <strong>Support tickets</strong>
              <span>Tracked</span>
            </div>
            <div className={styles.listItem}>
              <strong>Wallet records</strong>
              <span>NGN</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
