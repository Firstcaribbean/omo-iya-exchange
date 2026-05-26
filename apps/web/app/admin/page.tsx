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
  category: "Design",
  price: 0,
  oldPrice: undefined as number | undefined,
  rating: 5,
  sales: 0,
  image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=900&q=80",
  badge: "New",
  description: "",
  delivery: "Instant download",
  includes: ["Digital file", "Usage guide"],
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
    price: Number(product.price),
    oldPrice: product.comparePrice ? Number(product.comparePrice) : undefined,
    rating: Number(product.rating || 5),
    sales: Number(product.sales || 0),
    image: product.images?.[0] || product.image || emptyProduct.image,
    badge: product.featured ? "Featured" : "Verified",
    description: product.description || product.shortDesc || "",
    delivery: product.metadata?.delivery || "Instant download",
    includes: product.metadata?.includes || ["Digital file"],
  };
}

export default function AdminPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [productForm, setProductForm] = useState<Product>(emptyProduct);
  const [categoryName, setCategoryName] = useState("");

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
            description: category.description || `${category.name} products.`,
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
              name: item.productName || item.name || "Product",
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
      rating: Number(productForm.rating),
      sales: Number(productForm.sales),
      includes: productForm.includes.length ? productForm.includes : ["Digital file"],
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
            stock: 9999,
            status: "ACTIVE",
            featured: product.badge === "Featured",
            tags: [product.category],
            metadata: { delivery: product.delivery, includes: product.includes },
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
    setProductForm({ ...emptyProduct, category: next.categories[0]?.name ?? "Design" });
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
      description: `${categoryName.trim()} products.`,
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
          <p className={styles.lead}>Sign in with an administrator account to manage products, orders, users, and brand settings.</p>
          <Link className={styles.button} href="/login">Go to login</Link>
        </section>
      ) : (
        <>
          <section className={styles.adminGrid}>
            <div className={styles.card}><span className={styles.badge}>Products</span><h2>{state.products.length}</h2></div>
            <div className={styles.card}><span className={styles.badge}>Orders</span><h2>{state.orders.length}</h2></div>
            <div className={styles.card}><span className={styles.badge}>Users</span><h2>{state.users.length}</h2></div>
          </section>

          <section className={styles.twoColumn}>
            <div className={styles.panel} id="product-form">
              <p className={styles.eyebrow}>Product management</p>
              <h1 className={styles.headline}>{productForm.id ? "Edit product" : "Add product"}</h1>
              <form className={styles.form} onSubmit={saveProduct}>
                <label>Name<input required value={productForm.name} onChange={(event) => setProductForm((p) => ({ ...p, name: event.target.value }))} /></label>
                <label>Category<select value={productForm.category} onChange={(event) => setProductForm((p) => ({ ...p, category: event.target.value }))}>{state.categories.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
                <label>Price<input required type="number" value={productForm.price} onChange={(event) => setProductForm((p) => ({ ...p, price: Number(event.target.value) }))} /></label>
                <label>Image URL<input required value={productForm.image} onChange={(event) => setProductForm((p) => ({ ...p, image: event.target.value }))} /></label>
                <label>Description<textarea required value={productForm.description} onChange={(event) => setProductForm((p) => ({ ...p, description: event.target.value }))} /></label>
                <button className={styles.button} type="submit">Save product</button>
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
            <p className={styles.eyebrow}>Catalog</p>
            <table className={styles.table}>
              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Actions</th></tr></thead>
              <tbody>
                {state.products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{formatNaira(product.price)}</td>
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
          </section>

          <section className={styles.twoColumn}>
            <div className={styles.panel}>
              <p className={styles.eyebrow}>Brand details</p>
              <form className={styles.form} onSubmit={saveBrand}>
                <label>Brand name<input value={state.brand.name} onChange={(event) => updateBrand("name", event.target.value)} /></label>
                <label>Tagline<input value={state.brand.tagline} onChange={(event) => updateBrand("tagline", event.target.value)} /></label>
                <label>Support email<input value={state.brand.supportEmail} onChange={(event) => updateBrand("supportEmail", event.target.value)} /></label>
                <label>WhatsApp<input value={state.brand.whatsapp} onChange={(event) => updateBrand("whatsapp", event.target.value)} /></label>
                <button className={styles.button} type="submit">Save brand</button>
              </form>
            </div>
            <aside className={styles.card}>
              <span className={styles.badge}>Restore defaults</span>
              <p className={styles.lead}>Restore seeded products, users, categories, and brand settings.</p>
              <button className={styles.ghostButton} onClick={() => setState(resetState())} type="button">Reset local app data</button>
            </aside>
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>Orders and users</p>
            <table className={styles.table}>
              <thead><tr><th>Order</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{state.orders.map((order) => <tr key={order.id}><td>{order.id}</td><td>{formatNaira(order.total)}</td><td>{order.status}</td><td><select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as AppState["orders"][number]["status"])}><option>PENDING</option><option>PAID</option><option>FULFILLED</option></select></td></tr>)}</tbody>
            </table>
            <table className={styles.table}>
              <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{state.users.map((item) => <tr key={item.id}><td>{item.email}</td><td>{item.role}</td><td>{item.status}</td><td><button onClick={() => updateUserStatus(item.id)} type="button">{item.status === "ACTIVE" ? "Suspend" : "Reactivate"}</button></td></tr>)}</tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}
