"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiConfigured, apiRequest } from "../../lib/api";
import { currentUser, formatNaira, loadState, saveState, type AppState, type Product } from "../../lib/store";
import styles from "../../portal.module.css";

export function ProductDetails({ slug }: { slug: string }) {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const next = loadState();
      if (apiConfigured()) {
        const [productsResponse, meResponse] = await Promise.all([
          apiRequest<Product[]>("/api/products"),
          apiRequest<any>("/api/auth/me"),
        ]);
        if (productsResponse.ok && productsResponse.data) {
          next.products = productsResponse.data;
        }
        if (meResponse.ok && meResponse.data) {
          const normalized = {
            id: meResponse.data.id,
            email: meResponse.data.email,
            password: "",
            firstName: meResponse.data.firstName,
            lastName: meResponse.data.lastName,
            phone: meResponse.data.phone || meResponse.data.phoneNumber || "",
            role: meResponse.data.role === "CUSTOMER" ? "CUSTOMER" as const : "ADMIN" as const,
            status: meResponse.data.status || "ACTIVE" as const,
          };
          const existingIndex = next.users.findIndex((item) => item.id === normalized.id);
          if (existingIndex >= 0) {
            next.users[existingIndex] = normalized;
          } else {
            next.users.push(normalized);
          }
          next.currentUserId = normalized.id;
        }
      }
      if (active) setState(next);
    }

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  const product = state?.products.find((item) => item.slug === slug);
  const user = state ? currentUser(state) : null;
  const brand = state?.brand.name ?? "Omo Iya Exchange";
  const tagline = state?.brand.tagline ?? "Secure Digital Marketplace";

  function addToCart(item: Product) {
    const next = loadState();
    const activeUser = currentUser(next);

    if (!activeUser || activeUser.role !== "CUSTOMER") {
      window.location.href = `/login?next=/products/${item.slug}`;
      return;
    }

    next.cart[item.id] = (next.cart[item.id] ?? 0) + 1;
    saveState(next);
    setState(next);
    window.location.href = "/checkout";
  }

  if (!state) return null;

  if (!product) {
    return (
      <main className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>OI</span>
            <div>
              <strong>{brand}</strong>
              <span>{tagline}</span>
            </div>
          </Link>
          <nav className={styles.nav}>
            <Link href="/marketplace">Marketplace</Link>
            <Link href="/login">Sign in</Link>
          </nav>
        </header>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Service unavailable</p>
          <h1 className={styles.headline}>This service could not be found.</h1>
          <p className={styles.lead}>Return to the marketplace to choose an active service.</p>
          <Link className={styles.button} href="/marketplace">Open marketplace</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>OI</span>
          <div>
            <strong>{brand}</strong>
            <span>{tagline}</span>
          </div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/checkout">Checkout</Link>
          {user?.role === "CUSTOMER" ? <Link href="/dashboard">Dashboard</Link> : null}
          <Link href="/login">{user ? "Switch user" : "Sign in"}</Link>
        </nav>
      </header>

      <section className={styles.twoColumn}>
        <img className={styles.productImage} src={product.image} alt={product.name} />
        <aside className={styles.card}>
          <span className={styles.badge}>{product.badge}</span>
          <h1 className={styles.headline}>{product.name}</h1>
          <p className={styles.lead}>{product.description}</p>
          <p className={styles.price}>{formatNaira(product.price)}</p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span>Category</span>
              <strong>{product.category}</strong>
            </div>
            <div className={styles.stat}>
              <span>Country</span>
              <strong>{product.country}</strong>
            </div>
            <div className={styles.stat}>
              <span>Available</span>
              <strong>{product.availability}</strong>
            </div>
          </div>
          <div className={styles.metaGrid}>
            <span>{product.region}</span>
            <span>{product.fulfillmentWindow}</span>
            <span>{product.delivery}</span>
            {product.requiresOtp ? <span>OTP handoff required</span> : null}
          </div>
          <div className={styles.list}>
            {product.includes.map((item) => (
              <div className={styles.listItem} key={item}>
                <strong>{item}</strong>
                <span>Included</span>
              </div>
            ))}
          </div>
          <button className={styles.button} onClick={() => addToCart(product)} type="button">
            {user?.role === "CUSTOMER" ? "Add to cart and checkout" : "Sign in to shop"}
          </button>
        </aside>
      </section>
    </main>
  );
}
