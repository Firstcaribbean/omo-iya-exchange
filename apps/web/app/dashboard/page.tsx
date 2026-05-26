"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { currentUser, formatNaira, loadState, saveState, type AppState } from "../lib/store";
import styles from "../portal.module.css";

export default function DashboardPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [ticket, setTicket] = useState({ subject: "", message: "" });

  useEffect(() => {
    setState(loadState());
  }, []);

  const user = state ? currentUser(state) : null;
  const orders = useMemo(
    () => (state && user ? state.orders.filter((order) => order.userId === user.id) : []),
    [state, user],
  );
  const tickets = useMemo(
    () => (state && user ? state.tickets.filter((item) => item.userId === user.id) : []),
    [state, user],
  );

  function logout() {
    const next = loadState();
    next.currentUserId = null;
    saveState(next);
    window.location.href = "/login";
  }

  function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = loadState();
    const activeUser = currentUser(next);
    if (!activeUser) {
      window.location.href = "/login";
      return;
    }
    next.tickets.unshift({
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: activeUser.id,
      subject: ticket.subject,
      message: ticket.message,
      status: "OPEN",
    });
    saveState(next);
    setState(next);
    setTicket({ subject: "", message: "" });
  }

  if (!state) return null;

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>OI</span>
          <div>
            <strong>Omo Iya Exchange</strong>
            <span>Customer dashboard</span>
          </div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/checkout">Checkout</Link>
          {user?.role === "ADMIN" ? <Link href="/admin">Admin</Link> : null}
          <button className={styles.ghostButton} onClick={logout} type="button">
            Sign out
          </button>
        </nav>
      </header>

      {!user ? (
        <section className={styles.card}>
          <h1 className={styles.headline}>Please sign in.</h1>
          <Link className={styles.button} href="/login">Go to login</Link>
        </section>
      ) : (
        <section className={styles.dashboardGrid}>
          <aside className={styles.sidebar}>
            <strong>{user.firstName} {user.lastName}</strong>
            <nav>
              <a href="#overview">Overview</a>
              <a href="#orders">Orders</a>
              <a href="#support">Support</a>
              <a href="#profile">Profile</a>
            </nav>
          </aside>

          <div className={styles.panel} id="overview">
            <p className={styles.eyebrow}>Welcome back</p>
            <h1 className={styles.headline}>Your digital products hub.</h1>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span>Wallet balance</span>
                <strong>{formatNaira(0)}</strong>
              </div>
              <div className={styles.stat}>
                <span>Orders</span>
                <strong>{orders.length}</strong>
              </div>
              <div className={styles.stat}>
                <span>Tickets</span>
                <strong>{tickets.length}</strong>
              </div>
            </div>

            <h2 id="orders">My purchases</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Products</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={4}>No orders yet.</td></tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{formatNaira(order.total)}</td>
                      <td>{order.status}</td>
                      <td>{order.items.map((item) => item.name).join(", ")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <h2 id="support">Support center</h2>
            <form className={styles.form} onSubmit={createTicket}>
              <label>
                Subject
                <input
                  required
                  value={ticket.subject}
                  onChange={(event) => setTicket((current) => ({ ...current, subject: event.target.value }))}
                />
              </label>
              <label>
                Message
                <textarea
                  required
                  value={ticket.message}
                  onChange={(event) => setTicket((current) => ({ ...current, message: event.target.value }))}
                />
              </label>
              <button className={styles.button} type="submit">Open support ticket</button>
            </form>
            <div className={styles.list}>
              {tickets.map((item) => (
                <div className={styles.listItem} key={item.id}>
                  <strong>{item.subject}</strong>
                  <span>{item.status}</span>
                </div>
              ))}
            </div>

            <h2 id="profile">Profile</h2>
            <div className={styles.list}>
              <div className={styles.listItem}><strong>Email</strong><span>{user.email}</span></div>
              <div className={styles.listItem}><strong>Phone</strong><span>{user.phone}</span></div>
              <div className={styles.listItem}><strong>Status</strong><span>{user.status}</span></div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
