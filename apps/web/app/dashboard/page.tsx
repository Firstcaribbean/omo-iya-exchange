"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiConfigured, apiRequest, clearAccessToken } from "../lib/api";
import { currentUser, formatNaira, loadState, saveState, type AppState } from "../lib/store";
import styles from "../portal.module.css";

export default function DashboardPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [ticket, setTicket] = useState({ subject: "", message: "" });

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const next = loadState();
      if (apiConfigured()) {
        const [meResponse, ordersResponse, ticketsResponse] = await Promise.all([
          apiRequest<{
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber?: string;
            role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
          }>("/api/auth/me"),
          apiRequest<any[]>("/api/orders"),
          apiRequest<any[]>("/api/support/tickets"),
        ]);

        if (meResponse.ok && meResponse.data) {
          const user = meResponse.data;
          const existing = next.users.find((item) => item.id === user.id);
          const normalized = {
            id: user.id,
            email: user.email,
            password: "",
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phoneNumber || "",
            role: user.role === "CUSTOMER" ? "CUSTOMER" as const : "ADMIN" as const,
            status: "ACTIVE" as const,
          };
          if (existing) {
            Object.assign(existing, normalized);
          } else {
            next.users.push(normalized);
          }
          next.currentUserId = user.id;
        }

        if (ordersResponse.ok && ordersResponse.data) {
          next.orders = ordersResponse.data.map((order: any) => ({
            id: order.id,
            userId: order.userId,
            total: Number(order.total),
            status: order.status,
            createdAt: order.createdAt,
            items: (order.items || []).map((item: any) => ({
              productId: item.productId,
              name: item.productName,
              price: Number(item.price),
              quantity: item.quantity,
            })),
          }));
        }

        if (ticketsResponse.ok && ticketsResponse.data) {
          next.tickets = ticketsResponse.data.map((ticket: any) => ({
            id: ticket.id,
            userId: ticket.userId,
            subject: ticket.subject,
            message: ticket.description,
            status: ticket.status,
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
    clearAccessToken();
    window.location.href = "/login";
  }

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (apiConfigured()) {
      const response = await apiRequest("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({ subject: ticket.subject, description: ticket.message }),
      });
      if (response.ok) {
        window.location.reload();
        return;
      }
    }

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
