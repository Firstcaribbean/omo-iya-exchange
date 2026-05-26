"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { categories, countries, formatNaira, products, regions, type Product } from "./market-data";
import styles from "./page.module.css";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeRegion, setActiveRegion] = useState("All");
  const [activeCountry, setActiveCountry] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      const matchesRegion = activeRegion === "All" || product.region === activeRegion;
      const matchesCountry = activeCountry === "All" || product.country === activeCountry;
      const matchesSearch =
        search.length === 0 ||
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        product.region.toLowerCase().includes(search) ||
        product.country.toLowerCase().includes(search);

      return matchesCategory && matchesRegion && matchesCountry && matchesSearch;
    });
  }, [activeCategory, activeCountry, activeRegion, query]);

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
          <Link href="/marketplace">All services</Link>
          <a href="#checkout">Checkout</a>
          <Link href="/login">Login</Link>
          <Link href="/register">Create account</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/admin">Admin</Link>
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
            Order compliant account setup, WhatsApp Business onboarding, SIM
            registration assistance, and regional launch support with clear NGN
            pricing and inventory availability.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#marketplace">
              Browse services
            </a>
            <Link className={styles.secondaryButton} href="/login">
              Sign in
            </Link>
            <a className={styles.secondaryButton} href="#checkout">
              View cart
            </a>
          </div>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Marketplace highlights">
        <div>
          <strong>980+</strong>
          <span>service completions</span>
        </div>
        <div>
          <strong>NGN</strong>
          <span>local pricing</span>
        </div>
        <div>
          <strong>4.8/5</strong>
          <span>average service rating</span>
        </div>
        <div>
          <strong>Paystack</strong>
          <span>secure checkout ready</span>
        </div>
      </section>

      <section className={styles.marketplace} id="marketplace">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Marketplace</p>
            <h2>Verified onboarding services</h2>
          </div>
          <label className={styles.searchBox}>
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country, region, WhatsApp, SIM..."
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
        <div className={styles.filterGrid} aria-label="Region and country filters">
          <label>
            Region
            <select value={activeRegion} onChange={(event) => setActiveRegion(event.target.value)}>
              {regions.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </label>
          <label>
            Country
            <select value={activeCountry} onChange={(event) => setActiveCountry(event.target.value)}>
              {countries.map((country) => (
                <option key={country}>{country}</option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.productGrid}>
          {filteredProducts.map((product) => (
            <article className={styles.productCard} key={product.id}>
              <Link className={styles.productImage} href={`/products/${product.slug}`}>
                <img src={product.image} alt={product.name} />
                <span>{product.badge}</span>
              </Link>
              <div className={styles.productBody}>
                <div className={styles.productMeta}>
                  <span>{product.country}</span>
                  <span>{product.region}</span>
                </div>
                <h3>
                  <Link href={`/products/${product.slug}`}>{product.name}</Link>
                </h3>
                <p>{product.description}</p>
                <div className={styles.availabilityStrip}>
                  <span>{product.availability} available</span>
                  <span>{product.fulfillmentWindow}</span>
                  {product.requiresOtp ? <span>OTP required</span> : null}
                </div>
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
            Buyers select a region-specific service, submit the required
            information after payment, and track fulfillment from their
            dashboard.
          </p>
          <div className={styles.steps}>
            <span>1. Review cart</span>
            <span>2. Create order</span>
            <span>3. Pay with Paystack</span>
            <span>4. Receive handover</span>
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
              <span>Add a service from the marketplace to preview checkout.</span>
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
          <Link
            className={`${styles.checkoutButton} ${
              cartCount === 0 ? styles.disabledLink : ""
            }`}
            href={cartCount === 0 ? "#checkout" : "/checkout"}
            aria-disabled={cartCount === 0}
          >
            Continue to Paystack
          </Link>
          <p className={styles.checkoutNote}>
            Add the Paystack live keys in production to accept real payments.
          </p>
        </aside>
      </section>

      <footer className={styles.footer}>
        <div>
          <strong>Omo Iya Exchange</strong>
          <span>Secure Digital Marketplace</span>
        </div>
        <nav aria-label="Footer links">
          <a href="#marketplace">Marketplace</a>
          <a href="#checkout">Checkout</a>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </footer>
    </main>
  );
}
