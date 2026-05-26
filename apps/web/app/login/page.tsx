import Link from "next/link";
import styles from "../portal.module.css";

export default function LoginPage() {
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
          <Link href="/register">Create account</Link>
        </nav>
      </header>

      <section className={styles.heroGrid}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Customer access</p>
          <h1 className={styles.headline}>Sign in to manage purchases.</h1>
          <p className={styles.lead}>
            Access your wallet, order history, support tickets, and secure
            digital downloads.
          </p>
          <form className={styles.form}>
            <label>
              Email address
              <input placeholder="you@example.com" type="email" />
            </label>
            <label>
              Password
              <input placeholder="Enter your password" type="password" />
            </label>
            <button className={styles.button} type="button">
              Sign in
            </button>
            <p className={styles.finePrint}>
              API connection next: this form will post to
              <strong> /api/auth/login</strong> and store the user session.
            </p>
          </form>
        </div>

        <aside className={styles.card}>
          <span className={styles.badge}>2FA ready</span>
          <h2>Security built for digital delivery.</h2>
          <div className={styles.list}>
            <div className={styles.listItem}>
              <strong>Email verification</strong>
              <span>Pending API</span>
            </div>
            <div className={styles.listItem}>
              <strong>Two-factor login</strong>
              <span>Backend ready</span>
            </div>
            <div className={styles.listItem}>
              <strong>Session tracking</strong>
              <span>JWT</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
