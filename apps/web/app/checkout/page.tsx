"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { currentUser, formatNaira, loadState, saveState, type AppState } from "../lib/store";
import styles from "../portal.module.css";

export default function CheckoutPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setState(loadState());
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

  function updateQuantity(productId: string, delta: number) {
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
    const next = loadState();
    const activeUser = currentUser(next);

    if (!activeUser) {
      window.location.href = "/login";
      return;
    }

    const orderItems = Object.entries(next.cart)
      .map(([productId, quantity]) => {
        const product = next.products.find((item) => item.id === productId);
        return product ? { productId, quantity, name: product.name, price: product.price } : null;
      })
      .filter(Boolean) as Array<{ productId: string; quantity: number; name: string; price: number }>;

    if (orderItems.length === 0) {
      setNotice("Add at least one product before checkout.");
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
    setNotice("Payment simulation successful. Order added to your dashboard.");
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>OI</span>
          <div>
            <strong>Omo Iya Exchange</strong>
            <span>Secure checkout</span>
          </div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/login">{user ? "Switch user" : "Login"}</Link>
        </nav>
      </header>

      <section className={styles.twoColumn}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Checkout</p>
          <h1 className={styles.headline}>Review cart and create order.</h1>
          <p className={styles.lead}>
            This currently simulates a successful Paystack payment and creates a
            paid order. Real Paystack redirect will plug into this same button.
          </p>
          {notice ? <p className={styles.successText}>{notice}</p> : null}
          <button className={styles.button} onClick={placeOrder} type="button">
            Pay with Paystack test mode
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
    </main>
  );
}
