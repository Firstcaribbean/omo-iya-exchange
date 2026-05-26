"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { loadState, saveState, type User } from "../lib/store";
import styles from "../portal.module.css";

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const state = loadState();

    if (state.users.some((user) => user.email.toLowerCase() === form.email.toLowerCase())) {
      setMessage("An account already exists with this email.");
      return;
    }

    const user: User = {
      id: crypto.randomUUID(),
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      role: "CUSTOMER",
      status: "ACTIVE",
    };

    state.users.push(user);
    state.currentUserId = user.id;
    saveState(state);
    window.location.href = "/dashboard";
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>OI</span>
          <div>
            <strong>Omo Iya Exchange</strong>
            <span>Create account</span>
          </div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/login">Sign in</Link>
        </nav>
      </header>

      <section className={styles.twoColumn}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Create account</p>
          <h1 className={styles.headline}>Join the marketplace.</h1>
          <form className={styles.form} onSubmit={submit}>
            <label>
              First name
              <input required onChange={(event) => update("firstName", event.target.value)} />
            </label>
            <label>
              Last name
              <input required onChange={(event) => update("lastName", event.target.value)} />
            </label>
            <label>
              Email address
              <input required type="email" onChange={(event) => update("email", event.target.value)} />
            </label>
            <label>
              Phone number
              <input required onChange={(event) => update("phone", event.target.value)} />
            </label>
            <label>
              Password
              <input
                minLength={8}
                required
                type="password"
                onChange={(event) => update("password", event.target.value)}
              />
            </label>
            <button className={styles.button} type="submit">
              Create account
            </button>
            {message ? <p className={styles.errorText}>{message}</p> : null}
          </form>
        </div>

        <aside className={styles.card}>
          <span className={styles.badge}>Customer features</span>
          <div className={styles.list}>
            <div className={styles.listItem}>
              <strong>Wallet</strong>
              <span>NGN tracking</span>
            </div>
            <div className={styles.listItem}>
              <strong>Purchases</strong>
              <span>Download access</span>
            </div>
            <div className={styles.listItem}>
              <strong>Support</strong>
              <span>Ticket history</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
