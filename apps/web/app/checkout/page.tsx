"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiConfigured, apiRequest } from "../lib/api";
import { currentUser, formatNaira, loadState, saveState, type AppState } from "../lib/store";
import styles from "../portal.module.css";

export default function CheckoutPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const next = loadState();
      if (apiConfigured()) {
        const [productsResponse, meResponse] = await Promise.all([
          apiRequest<AppState["products"]>("/api/products"),
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

  const items = useMemo(() => {
    if (!state) return [];
    return Object.entries(state.cart)
      .map(([productId, quantity]) => {
        const product = state.products.find((item) => item.id === productId);
        return product ? { ...product, quantity } : null;
      })
      .filter(Boolean) as Array<(AppState["products"][number]) & { quantity: number }>;
  }, [state]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const user = state ? currentUser(state) : null;
  const canCheckout = user?.role === "CUSTOMER";

  function updateQuantity(productId: string, delta: number) {
    if (!canCheckout) {
      window.location.href = "/login?next=/checkout";
      return;
    }

    const next = loadState();
    const quantity = (next.cart[productId] ?? 0) + delta;
    if (quantity <= 0) {
      delete next.cart[productId];
    } else {
      next.cart[productId] = quantity;
    }
    saveState(next);
    setState(next);
  }

  function placeOrder() {
    if (apiConfigured()) {
      placeApiOrder();
      return;
    }

    const next = loadState();
    const activeUser = currentUser(next);

    if (!activeUser || activeUser.role !== "CUSTOMER") {
      window.location.href = "/login?next=/checkout";
      return;
    }

    const orderItems = Object.entries(next.cart)
      .map(([productId, quantity]) => {
        const product = next.products.find((item) => item.id === productId);
        return product ? { productId, quantity, name: product.name, price: product.price } : null;
      })
      .filter(Boolean) as Array<{ productId: string; quantity: number; name: string; price: number }>;

    if (orderItems.length === 0) {
      setNotice("Add at least one service before checkout.");
      return;
    }

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    next.orders.unshift({
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: activeUser.id,
      total,
      status: "PAID",
      items: orderItems,
      createdAt: new Date().toISOString(),
    });
    next.cart = {};
    saveState(next);
    setState(next);
    setNotice("Order completed successfully. It has been added to your dashboard.");
  }

  async function placeApiOrder() {
    if (items.length === 0) {
      setNotice("Add at least one service before checkout.");
      return;
    }

    const orderResponse = await apiRequest<{ id: string }>("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        notes: "Website checkout",
        items: items.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      }),
    });

    if (!orderResponse.ok || !orderResponse.data) {
      setNotice(orderResponse.message || "Unable to create order. Please try again.");
      return;
    }

    const paymentResponse = await apiRequest<{ authorization_url?: string }>(
      "/api/payments/paystack/initialize",
      {
        method: "POST",
        body: JSON.stringify({ orderId: orderResponse.data.id }),
      },
    );

    if (paymentResponse.ok && paymentResponse.data?.authorization_url) {
      const next = loadState();
      next.cart = {};
      saveState(next);
      window.location.href = paymentResponse.data.authorization_url;
      return;
    }

    setNotice(paymentResponse.message || "Unable to initialize Paystack payment.");
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>OI</span>
          <div>
            <strong>{state?.brand.name ?? "Omo Iya Exchange"}</strong>
            <span>{state?.brand.tagline ?? "Secure checkout"}</span>
          </div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/marketplace">Marketplace</Link>
          {canCheckout ? <Link href="/dashboard">Dashboard</Link> : null}
          <Link href="/login">{user ? "Switch user" : "Login"}</Link>
        </nav>
      </header>

      {!canCheckout ? (
        <section className={styles.card}>
          <p className={styles.eyebrow}>Account required</p>
          <h1 className={styles.headline}>Create an account or sign in to shop.</h1>
          <p className={styles.lead}>Customers must be signed in before adding services to cart or paying for an order.</p>
          <div className={styles.inlineActions}>
            <Link className={styles.button} href="/register">Create account</Link>
            <Link className={styles.ghostButton} href="/login?next=/checkout">Sign in</Link>
          </div>
        </section>
      ) : (
      <section className={styles.twoColumn}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Checkout</p>
          <h1 className={styles.headline}>Review cart and create order.</h1>
          <p className={styles.lead}>
            Pay securely in NGN. When the production API is configured, this
            button creates a service order and redirects to Paystack.
          </p>
          {notice ? <p className={styles.successText}>{notice}</p> : null}
          <button className={styles.button} onClick={placeOrder} type="button">
            Pay with Paystack
          </button>
        </div>

        <aside className={styles.card}>
          <span className={styles.badge}>Order summary</span>
          <div className={styles.list}>
            {items.length === 0 ? (
              <div className={styles.listItem}>
                <strong>No cart items</strong>
                <span>Visit marketplace</span>
              </div>
            ) : (
              items.map((item) => (
                <div className={styles.listItem} key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{formatNaira(item.price)} x {item.quantity}</span>
                  <div className={styles.inlineActions}>
                    <button onClick={() => updateQuantity(item.id, -1)} type="button">-</button>
                    <button onClick={() => updateQuantity(item.id, 1)} type="button">+</button>
                  </div>
                </div>
              ))
            )}
            <div className={styles.listItem}>
              <strong>Total</strong>
              <span>{formatNaira(subtotal)}</span>
            </div>
          </div>
        </aside>
      </section>
      )}
    </main>
  );
}
