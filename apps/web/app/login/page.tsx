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

  function getSafeNextPath() {
    const nextPath = new URLSearchParams(window.location.search).get("next");
    return nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (apiConfigured()) {
      const response = await apiRequest<{
        accessToken: string;
        user: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          phone?: string;
          phoneNumber?: string;
          role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
          status?: "ACTIVE" | "SUSPENDED";
        };
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (response.ok && response.data) {
        setAccessToken(response.data.accessToken);
        const state = loadState();
        const normalized = {
          id: response.data.user.id,
          email: response.data.user.email,
          password: "",
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          phone: response.data.user.phone || response.data.user.phoneNumber || "",
          role: response.data.user.role === "CUSTOMER" ? "CUSTOMER" as const : "ADMIN" as const,
          status: response.data.user.status || "ACTIVE" as const,
        };
        const existingIndex = state.users.findIndex((item) => item.id === normalized.id);
        if (existingIndex >= 0) {
          state.users[existingIndex] = normalized;
        } else {
          state.users.push(normalized);
        }
        state.currentUserId = normalized.id;
        saveState(state);
        window.location.href =
          response.data.user.role === "CUSTOMER" ? getSafeNextPath() : "/admin";
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
    window.location.href = user.role === "ADMIN" ? "/admin" : getSafeNextPath();
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>OI</span>
          <div>
            <strong>{loadState().brand.name}</strong>
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
