"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  sales: number;
  image: string;
  badge: string;
  description: string;
  delivery: string;
};

const products: Product[] = [
  {
    id: "brand-kit",
    name: "Business Brand Starter Kit",
    category: "Design",
    price: 18500,
    oldPrice: 24000,
    rating: 4.9,
    sales: 318,
    image:
      "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=900&q=80",
    badge: "Best seller",
    description:
      "Logo files, social templates, invoice sheets, and launch graphics for small Nigerian businesses.",
    delivery: "Instant download",
  },
  {
    id: "wa-commerce",
    name: "WhatsApp Commerce Playbook",
    category: "Business",
    price: 9500,
    rating: 4.8,
    sales: 204,
    image:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&q=80",
    badge: "New",
    description:
      "Scripts, offer templates, customer follow-up flows, and pricing sheets for chat-based sales.",
    delivery: "PDF + editable docs",
  },
  {
    id: "excel-finance",
    name: "SME Finance Dashboard",
    category: "Templates",
    price: 14500,
    oldPrice: 18000,
    rating: 4.7,
    sales: 156,
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
    badge: "Verified",
    description:
      "Track income, expenses, customers, debtors, stock, and monthly profit in one spreadsheet.",
    delivery: "Excel + Google Sheets",
  },
  {
    id: "ad-pack",
    name: "Meta Ads Creative Pack",
    category: "Marketing",
    price: 22000,
    rating: 4.9,
    sales: 91,
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
    badge: "Premium",
    description:
      "Ready-to-edit ad concepts, captions, campaign planner, and performance reporting templates.",
    delivery: "Canva + Docs",
  },
  {
    id: "ebook-launch",
    name: "Ebook Launch System",
    category: "Education",
    price: 12000,
    rating: 4.6,
    sales: 127,
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    badge: "Creator pick",
    description:
      "A complete launch workflow for writing, packaging, pricing, and selling a digital guide.",
    delivery: "Workbook + templates",
  },
  {
    id: "support-stack",
    name: "Customer Support Response Kit",
    category: "Operations",
    price: 7800,
    rating: 4.7,
    sales: 83,
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
    badge: "Fast setup",
    description:
      "Message macros, refund scripts, ticket categories, and escalation rules for lean teams.",
    delivery: "Docs + CSV import",
  },
];

const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

function formatNaira(amount: number) {
  return `NGN ${amount.toLocaleString("en-NG")}`;
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      const matchesSearch =
        search.length === 0 ||
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, query]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const product = products.find((item) => item.id === id);
          return product ? { ...product, quantity } : null;
        })
        .filter(Boolean) as Array<Product & { quantity: number }>,
    [cart],
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  function addToCart(id: string) {
    setCart((current) => ({
      ...current,
      [id]: (current[id] ?? 0) + 1,
    }));
  }

  function removeFromCart(id: string) {
    setCart((current) => {
      const nextQuantity = (current[id] ?? 0) - 1;
      const next = { ...current };

      if (nextQuantity <= 0) {
        delete next[id];
      } else {
        next[id] = nextQuantity;
      }

      return next;
    });
  }

  function clearCart() {
    setCart({});
  }

  return (
    <main className={styles.page}>
      <header className={styles.navbar}>
        <a className={styles.brand} href="#top" aria-label="Omo Iya Exchange home">
          <span className={styles.brandMark}>OI</span>
          <span>
            <strong>Omo Iya Exchange</strong>
            <small>Secure Digital Marketplace</small>
          </span>
        </a>

        <nav className={styles.navLinks} aria-label="Main navigation">
          <a href="#marketplace">Marketplace</a>
          <a href="#checkout">Checkout</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#admin">Admin</a>
        </nav>

        <a className={styles.cartPill} href="#checkout" aria-label="Open cart">
          Cart
          <span>{cartCount}</span>
        </a>
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
          <h1>Omo Iya Exchange</h1>
          <p>
            Buy verified digital products with clear NGN pricing, instant
            delivery, and a secure Paystack-ready checkout flow.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#marketplace">
              Browse products
            </a>
            <a className={styles.secondaryButton} href="#checkout">
              View cart
            </a>
          </div>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Marketplace highlights">
        <div>
          <strong>980+</strong>
          <span>digital deliveries</span>
        </div>
        <div>
          <strong>NGN</strong>
          <span>local pricing</span>
        </div>
        <div>
          <strong>4.8/5</strong>
          <span>average product rating</span>
        </div>
        <div>
          <strong>Test mode</strong>
          <span>Paystack checkout ready</span>
        </div>
      </section>

      <section className={styles.marketplace} id="marketplace">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Marketplace</p>
            <h2>Verified digital products</h2>
          </div>
          <label className={styles.searchBox}>
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates, marketing, business..."
            />
          </label>
        </div>

        <div className={styles.categoryBar} aria-label="Product categories">
          {categories.map((category) => (
            <button
              className={category === activeCategory ? styles.activeChip : ""}
              key={category}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        <div className={styles.productGrid}>
          {filteredProducts.map((product) => (
            <article className={styles.productCard} key={product.id}>
              <div className={styles.productImage}>
                <img src={product.image} alt={product.name} />
                <span>{product.badge}</span>
              </div>
              <div className={styles.productBody}>
                <div className={styles.productMeta}>
                  <span>{product.category}</span>
                  <span>{product.rating.toFixed(1)} rating</span>
                </div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className={styles.delivery}>{product.delivery}</div>
                <div className={styles.productFooter}>
                  <div className={styles.priceBlock}>
                    <strong>{formatNaira(product.price)}</strong>
                    {product.oldPrice ? (
                      <small>{formatNaira(product.oldPrice)}</small>
                    ) : null}
                  </div>
                  <button type="button" onClick={() => addToCart(product.id)}>
                    Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.checkoutSection} id="checkout">
        <div className={styles.checkoutCopy}>
          <p className={styles.eyebrow}>Checkout</p>
          <h2>Cart and Paystack handoff</h2>
          <p>
            This front-end flow is ready for the API connection. The next pass
            will create the order on the backend, initialize Paystack, and
            redirect the buyer to the secure payment page.
          </p>
          <div className={styles.steps}>
            <span>1. Review cart</span>
            <span>2. Create order</span>
            <span>3. Pay with Paystack</span>
            <span>4. Unlock download</span>
          </div>
        </div>

        <aside className={styles.cartPanel} aria-label="Shopping cart">
          <div className={styles.cartHeader}>
            <div>
              <p>Current cart</p>
              <strong>{cartCount} item{cartCount === 1 ? "" : "s"}</strong>
            </div>
            {cartCount > 0 ? (
              <button type="button" onClick={clearCart}>
                Clear
              </button>
            ) : null}
          </div>

          {cartItems.length === 0 ? (
            <div className={styles.emptyCart}>
              <strong>Your cart is waiting.</strong>
              <span>Add a product from the marketplace to preview checkout.</span>
            </div>
          ) : (
            <div className={styles.cartItems}>
              {cartItems.map((item) => (
                <div className={styles.cartItem} key={item.id}>
                  <img src={item.image} alt="" />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{formatNaira(item.price)}</span>
                    <div className={styles.quantityControls}>
                      <button type="button" onClick={() => removeFromCart(item.id)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => addToCart(item.id)}>
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <strong>{formatNaira(subtotal)}</strong>
          </div>
          <button className={styles.checkoutButton} disabled={cartCount === 0}>
            Continue to Paystack
          </button>
          <p className={styles.checkoutNote}>
            Payments will run in Paystack test mode until live keys are added.
          </p>
        </aside>
      </section>

      <section className={styles.workflowGrid} id="dashboard">
        <article>
          <span className={styles.panelLabel}>Customer dashboard</span>
          <h2>Purchases, wallet, support, and notifications.</h2>
          <p>
            Buyers will be able to view their digital products, track wallet
            transactions, open tickets, and manage account security.
          </p>
          <div className={styles.miniStats}>
            <span>Wallet balance</span>
            <strong>NGN 0</strong>
          </div>
        </article>
        <article id="admin">
          <span className={styles.panelLabel}>Admin operations</span>
          <h2>Products, orders, users, fulfillment, and tickets.</h2>
          <p>
            The admin panel will connect to the existing backend services for
            catalog management, order approval, and product delivery.
          </p>
          <div className={styles.miniStats}>
            <span>Today revenue</span>
            <strong>NGN 0</strong>
          </div>
        </article>
      </section>

      <footer className={styles.footer}>
        <div>
          <strong>Omo Iya Exchange</strong>
          <span>Secure Digital Marketplace</span>
        </div>
        <nav aria-label="Footer links">
          <a href="#marketplace">Marketplace</a>
          <a href="#checkout">Checkout</a>
          <a href="#dashboard">Dashboard</a>
        </nav>
      </footer>
    </main>
  );
}
