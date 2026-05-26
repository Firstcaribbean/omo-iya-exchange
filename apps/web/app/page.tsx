"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadState, type AppState } from "./lib/store";
import styles from "./page.module.css";

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  const products = state?.products ?? [];
  const featuredServices = useMemo(() => products.slice(0, 3), [products]);
  const brandName = state?.brand.name ?? "Omo Iya Exchange";
  const tagline = state?.brand.tagline ?? "Regional onboarding services";
  const cartCount = Object.values(state?.cart ?? {}).reduce((sum, quantity) => sum + quantity, 0);
  const heroCopy =
    state?.brand.heroCopy ||
    "Order compliant account setup, WhatsApp Business onboarding, SIM registration assistance, and regional launch support from separate, focused pages.";

  return (
    <main className={styles.page}>
      <header className={styles.navbar}>
        <Link className={styles.brand} href="/" aria-label="Omo Iya Exchange home">
          <span className={styles.brandMark}>OI</span>
          <span>
            <strong>{brandName}</strong>
            <small>{tagline}</small>
          </span>
        </Link>

        <nav className={styles.navLinks} aria-label="Main navigation">
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/checkout">Checkout</Link>
          <Link href="/login">Login</Link>
          <Link href="/register">Create account</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>

        <Link className={styles.cartPill} href="/checkout" aria-label="Open cart">
          Cart
          <span>{cartCount}</span>
        </Link>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroMedia} aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80"
            alt=""
          />
        </div>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Nigeria optimized marketplace</p>
          <h1>{brandName}</h1>
          <p>{heroCopy}</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/marketplace">
              Browse services
            </Link>
            <Link className={styles.secondaryButton} href="/register">
              Create account
            </Link>
            <Link className={styles.secondaryButton} href="/login">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Marketplace highlights">
        <div>
          <strong>980+</strong>
          <span>service completions</span>
        </div>
        <div>
          <strong>{products.length || "6"}</strong>
          <span>active service types</span>
        </div>
        <div>
          <strong>4.8/5</strong>
          <span>average service rating</span>
        </div>
        <div>
          <strong>Paystack</strong>
          <span>secure checkout ready</span>
        </div>
      </section>

      <section className={styles.homeSection}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Services</p>
            <h2>Popular regional onboarding services</h2>
          </div>
          <Link className={styles.textLink} href="/marketplace">
            View full marketplace
          </Link>
        </div>

        <div className={styles.featureGrid}>
          {featuredServices.map((service) => (
            <article className={styles.featureCard} key={service.id}>
              <img src={service.image} alt="" />
              <div>
                <span>{service.country}</span>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <Link href={`/products/${service.slug}`}>View details</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.homeSection}>
        <div className={styles.processGrid}>
          <article>
            <span className={styles.panelLabel}>1</span>
            <h2>Choose a service</h2>
            <p>Filter by country, region, availability, and OTP requirements on the marketplace page.</p>
          </article>
          <article>
            <span className={styles.panelLabel}>2</span>
            <h2>Pay securely</h2>
            <p>Checkout runs through Paystack, with order tracking available from the dashboard.</p>
          </article>
          <article>
            <span className={styles.panelLabel}>3</span>
            <h2>Track fulfillment</h2>
            <p>Support can provide status updates, agent replies, and OTP handoff when required.</p>
          </article>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>
          <strong>{brandName}</strong>
          <span>{tagline}</span>
        </div>
        <nav aria-label="Footer links">
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/checkout">Checkout</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </footer>
    </main>
  );
}
