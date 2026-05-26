"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { demoCredentials, loadState, saveState } from "../lib/store";
import styles from "../portal.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState(demoCredentials.customer.email);
  const [password, setPassword] = useState(demoCredentials.customer.password);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadState();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const state = loadState();
    const user = state.users.find(
      (item) =>
        item.email.toLowerCase() === email.toLowerCase() &&
        item.password === password &&
        item.status === "ACTIVE",
    );

    if (!user) {
      setMessage("Invalid credentials or suspended account.");
      return;
    }

    state.currentUserId = user.id;
    saveState(state);
    window.location.href = user.role === "ADMIN" ? "/admin" : "/dashboard";
  }

  function fillAdmin() {
    setEmail(demoCredentials.admin.email);
    setPassword(demoCredentials.admin.password);
  }

  function fillCustomer() {
    setEmail(demoCredentials.customer.email);
    setPassword(demoCredentials.customer.password);
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
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/register">Create account</Link>
        </nav>
      </header>

      <section className={styles.heroGrid}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Customer and admin access</p>
          <h1 className={styles.headline}>Sign in to continue.</h1>
          <p className={styles.lead}>
            Use the seeded credentials below, or create a new customer account.
          </p>
          <div className={styles.inlineActions}>
            <button className={styles.ghostButton} onClick={fillCustomer} type="button">
              Fill customer login
            </button>
            <button className={styles.ghostButton} onClick={fillAdmin} type="button">
              Fill admin login
            </button>
          </div>
          <form className={styles.form} onSubmit={submit}>
            <label>
              Email address
              <input
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>
            <label>
              Password
              <input
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>
            <button className={styles.button} type="submit">
              Sign in
            </button>
            {message ? <p className={styles.errorText}>{message}</p> : null}
          </form>
        </div>

        <aside className={styles.card}>
          <span className={styles.badge}>Demo credentials</span>
          <div className={styles.list}>
            <div className={styles.listItem}>
              <strong>Admin</strong>
              <span>{demoCredentials.admin.email}</span>
            </div>
            <div className={styles.listItem}>
              <strong>Admin password</strong>
              <span>{demoCredentials.admin.password}</span>
            </div>
            <div className={styles.listItem}>
              <strong>Customer</strong>
              <span>{demoCredentials.customer.email}</span>
            </div>
            <div className={styles.listItem}>
              <strong>Customer password</strong>
              <span>{demoCredentials.customer.password}</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
