"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatNaira, loadState, saveState, type AppState } from "../lib/store";
import styles from "../portal.module.css";

export default function MarketplacePage() {
  const [state, setState] = useState<AppState | null>(null);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setState(loadState());
  }, []);

  const products = state?.products ?? [];
  const categories = ["All", ...(state?.categories.map((item) => item.name) ?? [])];
  const filtered = useMemo(() => {
    const search = query.toLowerCase().trim();
    return products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [category, products, query]);

  function addToCart(productId: string) {
    const next = loadState();
    next.cart[productId] = (next.cart[productId] ?? 0) + 1;
    saveState(next);
    setState(next);
  }

  const cartCount = Object.values(state?.cart ?? {}).reduce((sum, quantity) => sum + quantity, 0);

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>OI</span>
          <div>
            <strong>{state?.brand.name ?? "Omo Iya Exchange"}</strong>
            <span>{state?.brand.tagline ?? "Secure Digital Marketplace"}</span>
          </div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/checkout">Cart ({cartCount})</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/login">Login</Link>
        </nav>
      </header>

      <section className={styles.panel}>
        <p className={styles.eyebrow}>Marketplace</p>
        <h1 className={styles.headline}>Browse verified digital products.</h1>
        <div className={styles.toolbar}>
          <input
            placeholder="Search products"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className={styles.productList}>
          {filtered.map((product) => (
            <article className={styles.productRow} key={product.id}>
              <img src={product.image} alt="" />
              <div>
                <span className={styles.badge}>{product.category}</span>
                <h2>{product.name}</h2>
                <p className={styles.finePrint}>{product.description}</p>
                <strong>{formatNaira(product.price)}</strong>
              </div>
              <div className={styles.rowActions}>
                <Link className={styles.ghostButton} href={`/products/${product.slug}`}>
                  Details
                </Link>
                <button className={styles.button} onClick={() => addToCart(product.id)} type="button">
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
