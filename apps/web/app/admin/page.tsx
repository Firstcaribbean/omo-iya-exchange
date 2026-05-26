"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { apiConfigured, apiRequest, clearAccessToken } from "../lib/api";
import {
  currentUser,
  formatNaira,
  loadState,
  resetState,
  saveState,
  slugify,
  type AppState,
  type Category,
  type Product,
} from "../lib/store";
import styles from "../portal.module.css";

const emptyProduct = {
  id: "",
  slug: "",
  name: "",
  category: "WhatsApp Business Setup",
  region: "West Africa",
  country: "Nigeria",
  availability: 0,
  fulfillmentWindow: "24-48 hours",
  price: 0,
  oldPrice: undefined as number | undefined,
  rating: 5,
  sales: 0,
  image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=900&q=80",
  badge: "New",
  description: "",
  delivery: "Managed setup",
  includes: ["Onboarding support", "Handover checklist"],
  requiresOtp: true,
};

function normalizeOrderStatus(status: string): AppState["orders"][number]["status"] {
  if (status === "FULFILLED" || status === "COMPLETED") return "FULFILLED";
  if (status === "PAID" || status === "APPROVED") return "PAID";
  return "PENDING";
}

function mapApiProduct(product: any): Product {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category?.name || product.categoryName || "General",
    region: product.metadata?.region || product.region || "Global",
    country: product.metadata?.country || product.country || "Multi-country",
    availability: Number(product.stock ?? product.availability ?? 0),
    fulfillmentWindow: product.metadata?.fulfillmentWindow || product.fulfillmentWindow || "24-72 hours",
    price: Number(product.price),
    oldPrice: product.comparePrice ? Number(product.comparePrice) : undefined,
    rating: Number(product.rating || 5),
    sales: Number(product.sales || 0),
    image: product.images?.[0] || product.image || emptyProduct.image,
    badge: product.featured ? "Featured" : "Verified",
    description: product.description || product.shortDesc || "",
    delivery: product.metadata?.delivery || "Managed setup",
    includes: product.metadata?.includes || ["Onboarding support"],
    requiresOtp: product.metadata?.requiresOtp ?? product.requiresOtp ?? false,
  };
}

export default function AdminPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [productForm, setProductForm] = useState<Product>(emptyProduct);
  const [categoryName, setCategoryName] = useState("");
  const [otpDrafts, setOtpDrafts] = useState<Record<string, string>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const next = loadState();

      if (apiConfigured()) {
        const [meResponse, productsResponse, categoriesResponse, ordersResponse, usersResponse] = await Promise.all([
          apiRequest<any>("/api/auth/me"),
          apiRequest<any[]>("/api/products?limit=100"),
          apiRequest<Array<{ id: string; name: string; slug: string; description?: string }>>(
            "/api/products/categories",
          ),
          apiRequest<any[]>("/api/admin/orders?limit=50"),
          apiRequest<any[]>("/api/admin/users?limit=50"),
        ]);

        if (meResponse.ok && meResponse.data) {
          const user = meResponse.data;
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
          const existingIndex = next.users.findIndex((item) => item.id === user.id);
          if (existingIndex >= 0) {
            next.users[existingIndex] = normalized;
          } else {
            next.users.push(normalized);
          }
          next.currentUserId = user.id;
        }

        if (productsResponse.ok && productsResponse.data) {
          next.products = productsResponse.data.map(mapApiProduct);
        }

        if (categoriesResponse.ok && categoriesResponse.data) {
          next.categories = categoriesResponse.data.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description || `${category.name} services.`,
          }));
        }

        if (ordersResponse.ok && ordersResponse.data) {
          next.orders = ordersResponse.data.map((order: any) => ({
            id: order.id,
            userId: order.userId,
            total: Number(order.total),
            status: normalizeOrderStatus(order.status),
            createdAt: order.createdAt,
            items: (order.items || []).map((item: any) => ({
              productId: item.productId,
              name: item.productName || item.name || "Service",
              price: Number(item.price),
              quantity: item.quantity,
            })),
          }));
        }

        if (usersResponse.ok && usersResponse.data) {
          const adminUsers = next.users.filter((user) => user.role === "ADMIN");
          const customers = usersResponse.data.map((user: any) => ({
            id: user.id,
            email: user.email,
            password: "",
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phoneNumber || "",
            role: "CUSTOMER" as const,
            status: user.status === "ACTIVE" ? "ACTIVE" as const : "SUSPENDED" as const,
          }));
          next.users = [...adminUsers, ...customers];
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
  const isAdmin = user?.role === "ADMIN";
  const totalRevenue = state?.orders
    .filter((order) => order.status === "PAID" || order.status === "FULFILLED")
    .reduce((sum, order) => sum + order.total, 0) ?? 0;
  const pendingOrders = state?.orders.filter((order) => order.status === "PENDING").length ?? 0;
  const openTickets = state?.tickets.filter((ticket) => ticket.status !== "RESOLVED").length ?? 0;
  const lowInventory = state?.products.filter((product) => product.availability <= 5).length ?? 0;

  function persist(next: AppState) {
    saveState(next);
    setState({ ...next });
  }

  function logout() {
    const next = loadState();
    next.currentUserId = null;
    persist(next);
    clearAccessToken();
    window.location.href = "/login";
  }

  function saveBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    persist(loadState());
  }

  function updateBrand(field: keyof AppState["brand"], value: string) {
    const next = loadState();
    next.brand[field] = value;
    persist(next);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = loadState();
    const product: Product = {
      ...productForm,
      id: productForm.id || crypto.randomUUID(),
      slug: slugify(productForm.name),
      price: Number(productForm.price),
      oldPrice: productForm.oldPrice ? Number(productForm.oldPrice) : undefined,
      availability: Number(productForm.availability),
      rating: Number(productForm.rating),
      sales: Number(productForm.sales),
      includes: productForm.includes.length ? productForm.includes : ["Onboarding support"],
    };

    if (apiConfigured()) {
      const category = next.categories.find((item) => item.name === product.category);
      const response = await apiRequest<any>(
        productForm.id ? `/api/admin/products/${productForm.id}` : "/api/admin/products",
        {
          method: productForm.id ? "PUT" : "POST",
          body: JSON.stringify({
            name: product.name,
            description: product.description,
            shortDesc: product.description.slice(0, 160),
            price: product.price,
            comparePrice: product.oldPrice,
            categoryId: category?.id,
            images: [product.image],
            stock: product.availability,
            status: "ACTIVE",
            featured: product.badge === "Featured",
            tags: [product.category],
            metadata: {
              delivery: product.delivery,
              includes: product.includes,
              region: product.region,
              country: product.country,
              fulfillmentWindow: product.fulfillmentWindow,
              requiresOtp: product.requiresOtp,
            },
          }),
        },
      );

      if (response.ok && response.data) {
        Object.assign(product, mapApiProduct(response.data));
      }
    }

    const existingIndex = next.products.findIndex((item) => item.id === product.id);
    if (existingIndex >= 0) {
      next.products[existingIndex] = product;
    } else {
      next.products.unshift(product);
    }
    persist(next);
    setProductForm({ ...emptyProduct, category: next.categories[0]?.name ?? "WhatsApp Business Setup" });
  }

  function editProduct(product: Product) {
    setProductForm(product);
    window.location.hash = "product-form";
  }

  async function deleteProduct(productId: string) {
    if (apiConfigured()) {
      await apiRequest(`/api/admin/products/${productId}`, { method: "DELETE" });
    }

    const next = loadState();
    next.products = next.products.filter((product) => product.id !== productId);
    delete next.cart[productId];
    persist(next);
  }

  function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = loadState();
    if (!categoryName.trim()) return;
    const category: Category = {
      id: crypto.randomUUID(),
      name: categoryName.trim(),
      slug: slugify(categoryName),
      description: `${categoryName.trim()} services.`,
    };
    next.categories.push(category);
    persist(next);
    setCategoryName("");
  }

  function deleteCategory(categoryId: string) {
    const next = loadState();
    const category = next.categories.find((item) => item.id === categoryId);
    if (!category) return;
    next.categories = next.categories.filter((item) => item.id !== categoryId);
    next.products = next.products.map((product) =>
      product.category === category.name
        ? { ...product, category: next.categories[0]?.name ?? "General" }
        : product,
    );
    persist(next);
  }

  async function updateUserStatus(userId: string) {
    const next = loadState();
    const user = next.users.find((item) => item.id === userId);
    const shouldSuspend = user?.status === "ACTIVE";

    if (apiConfigured() && user?.role === "CUSTOMER") {
      await apiRequest(`/api/admin/users/${userId}/${shouldSuspend ? "suspend" : "activate"}`, {
        method: "PUT",
      });
    }

    next.users = next.users.map((item) =>
      item.id === userId
        ? { ...item, status: item.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }
        : item,
    );
    persist(next);
  }

  async function updateOrderStatus(orderId: string, status: AppState["orders"][number]["status"]) {
    if (apiConfigured()) {
      const action = status === "FULFILLED" ? "fulfill" : status === "PAID" ? "approve" : "";
      if (action) {
        await apiRequest(`/api/admin/orders/${orderId}/${action}`, {
          method: "PUT",
          body: JSON.stringify({ notes: "Updated from admin dashboard" }),
        });
      }
    }

    const next = loadState();
    next.orders = next.orders.map((order) => order.id === orderId ? { ...order, status } : order);
    persist(next);
  }

  function updateTicketStatus(ticketId: string, status: AppState["tickets"][number]["status"]) {
    const next = loadState();
    next.tickets = next.tickets.map((ticket) => ticket.id === ticketId ? { ...ticket, status } : ticket);
    persist(next);
  }

  function saveOrderOtp(orderId: string) {
    const code = otpDrafts[orderId]?.trim();
    if (!code) return;

    const next = loadState();
    next.orders = next.orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            otpCode: code,
            fulfillmentNote: "OTP added by admin. Customer can view it from the dashboard.",
          }
        : order,
    );
    persist(next);
    setOtpDrafts((current) => ({ ...current, [orderId]: "" }));
  }

  async function replyToTicket(ticketId: string) {
    const text = replyDrafts[ticketId]?.trim();
    if (!text) return;

    if (apiConfigured()) {
      await apiRequest(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
    }

    const next = loadState();
    next.tickets = next.tickets.map((ticket) =>
      ticket.id === ticketId
        ? {
            ...ticket,
            status: "IN_PROGRESS",
            assignedToAgent: true,
            messages: [
              ...(ticket.messages || []),
              {
                id: `MSG-${Date.now()}`,
                sender: "AGENT",
                text,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : ticket,
    );
    persist(next);
    setReplyDrafts((current) => ({ ...current, [ticketId]: "" }));
  }

  if (!state) return null;

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>OI</span>
          <div>
            <strong>{state.brand.name}</strong>
            <span>Admin operations</span>
          </div>
        </Link>
        <nav className={styles.nav}>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/dashboard">Customer view</Link>
          <button className={styles.ghostButton} onClick={logout} type="button">Sign out</button>
        </nav>
      </header>

      {!isAdmin ? (
        <section className={styles.card}>
          <h1 className={styles.headline}>Admin login required.</h1>
          <p className={styles.lead}>Sign in with an administrator account to manage services, inventory, orders, users, and brand settings.</p>
          <Link className={styles.button} href="/login">Go to login</Link>
        </section>
      ) : (
        <>
          <section className={styles.adminHero}>
            <div>
              <p className={styles.eyebrow}>Private admin dashboard</p>
              <h1 className={styles.headline}>Operate the marketplace from one control room.</h1>
              <p className={styles.lead}>
                Manage public homepage copy, service inventory, country availability,
                OTP fulfillment, customer accounts, and support conversations.
              </p>
            </div>
            <div className={styles.quickNav} aria-label="Admin sections">
              <a href="#content">Public page</a>
              <a href="#catalog">Catalog</a>
              <a href="#orders">Orders</a>
              <a href="#support">Support</a>
            </div>
          </section>

          <section className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <span>Revenue</span>
              <strong>{formatNaira(totalRevenue)}</strong>
            </div>
            <div className={styles.metricCard}>
              <span>Pending orders</span>
              <strong>{pendingOrders}</strong>
            </div>
            <div className={styles.metricCard}>
              <span>Open support</span>
              <strong>{openTickets}</strong>
            </div>
            <div className={styles.metricCard}>
              <span>Low inventory</span>
              <strong>{lowInventory}</strong>
            </div>
          </section>

          <section className={styles.twoColumn} id="content">
            <div className={styles.panel}>
              <p className={styles.eyebrow}>Public page controls</p>
              <h2>Homepage and brand details</h2>
              <p className={styles.finePrint}>
                These settings update the public homepage and marketplace branding.
              </p>
              <form className={styles.form} onSubmit={saveBrand}>
                <label>Brand name<input value={state.brand.name} onChange={(event) => updateBrand("name", event.target.value)} /></label>
                <label>Tagline<input value={state.brand.tagline} onChange={(event) => updateBrand("tagline", event.target.value)} /></label>
                <label>Homepage headline<input value={state.brand.heroTitle} onChange={(event) => updateBrand("heroTitle", event.target.value)} /></label>
                <label>Homepage intro<textarea value={state.brand.heroCopy} onChange={(event) => updateBrand("heroCopy", event.target.value)} /></label>
                <label>Support email<input value={state.brand.supportEmail} onChange={(event) => updateBrand("supportEmail", event.target.value)} /></label>
                <label>WhatsApp<input value={state.brand.whatsapp} onChange={(event) => updateBrand("whatsapp", event.target.value)} /></label>
                <button className={styles.button} type="submit">Save public content</button>
              </form>
            </div>

            <aside className={styles.card}>
              <span className={styles.badge}>Live preview data</span>
              <div className={styles.list}>
                <div className={styles.listItem}><strong>Homepage title</strong><span>{state.brand.heroTitle}</span></div>
                <div className={styles.listItem}><strong>Services shown</strong><span>{state.products.length}</span></div>
                <div className={styles.listItem}><strong>Support email</strong><span>{state.brand.supportEmail}</span></div>
              </div>
              <Link className={styles.button} href="/" target="_blank">Open public page</Link>
            </aside>
          </section>

          <section className={styles.twoColumn} id="catalog">
            <div className={styles.panel} id="product-form">
              <p className={styles.eyebrow}>Service management</p>
              <h1 className={styles.headline}>{productForm.id ? "Edit service" : "Add service"}</h1>
              <form className={styles.form} onSubmit={saveProduct}>
                <label>Name<input required value={productForm.name} onChange={(event) => setProductForm((p) => ({ ...p, name: event.target.value }))} /></label>
                <label>Category<select value={productForm.category} onChange={(event) => setProductForm((p) => ({ ...p, category: event.target.value }))}>{state.categories.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
                <label>Region<input required value={productForm.region} onChange={(event) => setProductForm((p) => ({ ...p, region: event.target.value }))} /></label>
                <label>Country<input required value={productForm.country} onChange={(event) => setProductForm((p) => ({ ...p, country: event.target.value }))} /></label>
                <label>Availability<input required min="0" type="number" value={productForm.availability} onChange={(event) => setProductForm((p) => ({ ...p, availability: Number(event.target.value) }))} /></label>
                <label>Fulfillment window<input required value={productForm.fulfillmentWindow} onChange={(event) => setProductForm((p) => ({ ...p, fulfillmentWindow: event.target.value }))} /></label>
                <label>Price<input required type="number" value={productForm.price} onChange={(event) => setProductForm((p) => ({ ...p, price: Number(event.target.value) }))} /></label>
                <label>Old price<input type="number" value={productForm.oldPrice ?? ""} onChange={(event) => setProductForm((p) => ({ ...p, oldPrice: event.target.value ? Number(event.target.value) : undefined }))} /></label>
                <label>Badge<input value={productForm.badge} onChange={(event) => setProductForm((p) => ({ ...p, badge: event.target.value }))} /></label>
                <label>Delivery label<input value={productForm.delivery} onChange={(event) => setProductForm((p) => ({ ...p, delivery: event.target.value }))} /></label>
                <label>Image URL<input required value={productForm.image} onChange={(event) => setProductForm((p) => ({ ...p, image: event.target.value }))} /></label>
                <label>Description<textarea required value={productForm.description} onChange={(event) => setProductForm((p) => ({ ...p, description: event.target.value }))} /></label>
                <label>Includes<textarea value={productForm.includes.join("\n")} onChange={(event) => setProductForm((p) => ({ ...p, includes: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) }))} /></label>
                <label className={styles.checkboxLabel}><input checked={Boolean(productForm.requiresOtp)} type="checkbox" onChange={(event) => setProductForm((p) => ({ ...p, requiresOtp: event.target.checked }))} /> Requires OTP handoff</label>
                <div className={styles.inlineActions}>
                  <button className={styles.button} type="submit">Save service</button>
                  <button className={styles.ghostButton} onClick={() => setProductForm({ ...emptyProduct, category: state.categories[0]?.name ?? "WhatsApp Business Setup" })} type="button">Clear form</button>
                </div>
              </form>
            </div>

            <aside className={styles.card}>
              <span className={styles.badge}>Categories</span>
              <form className={styles.form} onSubmit={addCategory}>
                <label>New category<input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} /></label>
                <button className={styles.button} type="submit">Add category</button>
              </form>
              <div className={styles.list}>
                {state.categories.map((category) => (
                  <div className={styles.listItem} key={category.id}>
                    <strong>{category.name}</strong>
                    <button className={styles.ghostButton} onClick={() => deleteCategory(category.id)} type="button">Delete</button>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>Service catalog</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Service</th><th>Region</th><th>Country</th><th>Inventory</th><th>Price</th><th>OTP</th><th>Actions</th></tr></thead>
                <tbody>
                  {state.products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.region}</td>
                      <td>{product.country}</td>
                      <td><span className={product.availability <= 5 ? styles.warningPill : styles.statusPill}>{product.availability} left</span></td>
                      <td>{formatNaira(product.price)}</td>
                      <td>{product.requiresOtp ? "Required" : "No"}</td>
                      <td>
                        <div className={styles.inlineActions}>
                          <button onClick={() => editProduct(product)} type="button">Edit</button>
                          <button onClick={() => deleteProduct(product.id)} type="button">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.panel} id="orders">
            <p className={styles.eyebrow}>Orders and users</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Order</th><th>Total</th><th>Status</th><th>Services</th><th>OTP handoff</th><th>Action</th></tr></thead>
                <tbody>
                  {state.orders.length === 0 ? (
                    <tr><td colSpan={6}>No orders yet.</td></tr>
                  ) : (
                    state.orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{formatNaira(order.total)}</td>
                        <td>{order.status}</td>
                        <td>{order.items.map((item) => item.name).join(", ")}</td>
                        <td><input placeholder={order.otpCode || "Paste OTP for customer"} value={otpDrafts[order.id] || ""} onChange={(event) => setOtpDrafts((current) => ({ ...current, [order.id]: event.target.value }))} /></td>
                        <td><div className={styles.inlineActions}><select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as AppState["orders"][number]["status"])}><option>PENDING</option><option>PAID</option><option>FULFILLED</option></select><button onClick={() => saveOrderOtp(order.id)} type="button">Save OTP</button></div></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.panel} id="users">
            <p className={styles.eyebrow}>Customer accounts</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>{state.users.map((item) => <tr key={item.id}><td>{item.email}</td><td>{item.role}</td><td>{item.status}</td><td><button onClick={() => updateUserStatus(item.id)} type="button">{item.status === "ACTIVE" ? "Suspend" : "Reactivate"}</button></td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section className={styles.panel} id="support">
            <p className={styles.eyebrow}>Live chat and support</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Ticket</th><th>Subject</th><th>Conversation</th><th>Reply</th><th>Status</th></tr></thead>
                <tbody>
                  {state.tickets.length === 0 ? (
                    <tr><td colSpan={5}>No support messages yet.</td></tr>
                  ) : (
                    state.tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{ticket.id}</td>
                        <td>{ticket.subject}</td>
                        <td>{(ticket.messages || []).map((message) => `${message.sender}: ${message.text}`).join(" / ") || ticket.message}</td>
                        <td><div className={styles.inlineActions}><input placeholder="Reply as agent" value={replyDrafts[ticket.id] || ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [ticket.id]: event.target.value }))} /><button onClick={() => replyToTicket(ticket.id)} type="button">Reply</button></div></td>
                        <td>
                          <select value={ticket.status} onChange={(event) => updateTicketStatus(ticket.id, event.target.value as AppState["tickets"][number]["status"])}>
                            <option>OPEN</option>
                            <option>IN_PROGRESS</option>
                            <option>RESOLVED</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.card}>
            <span className={styles.badge}>Maintenance</span>
            <p className={styles.lead}>Restore seeded services, users, categories, and brand settings for local testing.</p>
            <button className={styles.ghostButton} onClick={() => setState(resetState())} type="button">Reset local app data</button>
          </section>
        </>
      )}
    </main>
  );
}
