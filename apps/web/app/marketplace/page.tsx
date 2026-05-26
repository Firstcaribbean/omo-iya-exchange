"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiConfigured, apiRequest } from "../lib/api";
import { formatNaira, loadState, saveState, type AppState } from "../lib/store";
import type { Product } from "../market-data";
import styles from "../portal.module.css";

function mapApiProduct(product: any): Product {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category?.name || product.categoryName || "General",
    price: Number(product.price),
    oldPrice: product.comparePrice ? Number(product.comparePrice) : undefined,
    rating: Number(product.rating || 5),
    sales: Number(product.sales || 0),
    image: product.images?.[0] || product.image || "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=900&q=80",
    badge: product.featured ? "Featured" : "Verified",
    description: product.description || product.shortDesc || "",
    delivery: product.metadata?.delivery || "Instant download",
    includes: product.metadata?.includes || ["Digital file"],
  };
}

export default function MarketplacePage() {
  const [state, setState] = useState<AppState | null>(null);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const next = loadState();
      if (apiConfigured()) {
        const [productsResponse, categoriesResponse] = await Promise.all([
          apiRequest<Product[]>("/api/products"),
          apiRequest<Array<{ id: string; name: string; slug: string; description?: string }>>(
            "/api/products/categories",
          ),
        ]);

        if (productsResponse.ok && productsResponse.data) {
          next.products = productsResponse.data.map(mapApiProduct);
        }

        if (categoriesResponse.ok && categoriesResponse.data) {
          next.categories = categoriesResponse.data.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description || `${category.name} products.`,
          }));
        }
      }

      if (active) setState(next);
    }

    hydrate();
    return () => {
      active = false;
    };
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
