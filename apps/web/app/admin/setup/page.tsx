"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiRequest } from "../../lib/api";
import styles from "../../portal.module.css";

export default function AdminSetupPage() {
  const [form, setForm] = useState({
    firstName: "Admin",
    lastName: "Manager",
    email: "",
    phone: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await apiRequest("/api/auth/register-admin", {
      method: "POST",
      body: JSON.stringify(form),
    });
    if (response.ok) {
      setMessage("Admin created. Redirecting to login...");
      window.setTimeout(() => {
        window.location.href = "/login";
      }, 900);
      return;
    }
    setMessage(response.message || "Unable to create admin.");
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>OI</span>
          <div>
            <strong>Omo Iya Exchange</strong>
            <span>First admin setup</span>
          </div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/login">Login</Link>
        </nav>
      </header>

      <section className={styles.twoColumn}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>One-time setup</p>
          <h1 className={styles.headline}>Create the first admin account.</h1>
          <p className={styles.lead}>
            This setup closes automatically after one admin profile exists in Supabase.
          </p>
          <form className={styles.form} onSubmit={submit}>
            <label>
              First name
              <input required value={form.firstName} onChange={(event) => update("firstName", event.target.value)} />
            </label>
            <label>
              Last name
              <input required value={form.lastName} onChange={(event) => update("lastName", event.target.value)} />
            </label>
            <label>
              Email
              <input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(event) => update("phone", event.target.value)} />
            </label>
            <label>
              Password
              <input required minLength={8} type="password" value={form.password} onChange={(event) => update("password", event.target.value)} />
            </label>
            <button className={styles.button} type="submit">Create admin</button>
            {message ? <p className={styles.successText}>{message}</p> : null}
          </form>
        </div>
        <aside className={styles.card}>
          <span className={styles.badge}>Private access</span>
          <div className={styles.list}>
            <div className={styles.listItem}><strong>Catalog</strong><span>Products and inventory</span></div>
            <div className={styles.listItem}><strong>Orders</strong><span>Payment and OTP handoff</span></div>
            <div className={styles.listItem}><strong>Support</strong><span>Live chat replies</span></div>
          </div>
        </aside>
      </section>
    </main>
  );
}
