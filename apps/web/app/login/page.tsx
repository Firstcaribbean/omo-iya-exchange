"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { apiConfigured, apiRequest, setAccessToken } from "../lib/api";
import { loadState, saveState } from "../lib/store";
import styles from "../portal.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadState();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (apiConfigured()) {
      const response = await apiRequest<{
        accessToken: string;
        user: { role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN" };
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (response.ok && response.data) {
        setAccessToken(response.data.accessToken);
        window.location.href =
          response.data.user.role === "CUSTOMER" ? "/dashboard" : "/admin";
        return;
      }

      setMessage(response.message || "Login failed. Please check your details.");
      return;
    }

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
          <p className={styles.eyebrow}>Secure customer access</p>
          <h1 className={styles.headline}>Sign in to continue.</h1>
          <p className={styles.lead}>
            Enter your account details to access purchases, wallet, support, and
            fulfillment updates.
          </p>
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
          <span className={styles.badge}>Secure access</span>
          <div className={styles.list}>
            <div className={styles.listItem}>
              <strong>JWT sessions</strong>
              <span>API ready</span>
            </div>
            <div className={styles.listItem}>
              <strong>2FA support</strong>
              <span>Backend ready</span>
            </div>
            <div className={styles.listItem}>
              <strong>Email verification</strong>
              <span>Resend/SMTP ready</span>
            </div>
            <div className={styles.listItem}>
              <strong>Role routing</strong>
              <span>Account based</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
