"use client";

import { products as seedProducts, type Product } from "../market-data";

export type { Product };

export type UserRole = "CUSTOMER" | "ADMIN";

export type User = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  status: "ACTIVE" | "SUSPENDED";
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type BrandSettings = {
  name: string;
  tagline: string;
  supportEmail: string;
  whatsapp: string;
  heroTitle: string;
  heroCopy: string;
};

export type Order = {
  id: string;
  userId: string;
  total: number;
  status: "PENDING" | "PAID" | "FULFILLED";
  items: Array<{ productId: string; name: string; price: number; quantity: number }>;
  createdAt: string;
};

export type Ticket = {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
};

export type AppState = {
  users: User[];
  currentUserId: string | null;
  products: Product[];
  categories: Category[];
  brand: BrandSettings;
  cart: Record<string, number>;
  orders: Order[];
  tickets: Ticket[];
};

const STORAGE_KEY = "omo-iya-exchange-state-v1";

export const demoCredentials = {
  admin: { email: "admin@omoiyaexchange.com", password: "Admin@12345" },
  customer: { email: "customer@omoiyaexchange.com", password: "Customer@12345" },
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createDefaultState(): AppState {
  const categories = Array.from(new Set(seedProducts.map((product) => product.category))).map(
    (name) => ({
      id: crypto.randomUUID(),
      name,
      slug: slugify(name),
      description: `${name} digital products and resources.`,
    }),
  );

  return {
    users: [
      {
        id: "admin-user",
        email: demoCredentials.admin.email,
        password: demoCredentials.admin.password,
        firstName: "Admin",
        lastName: "Manager",
        phone: "+2348000000000",
        role: "ADMIN",
        status: "ACTIVE",
      },
      {
        id: "customer-user",
        email: demoCredentials.customer.email,
        password: demoCredentials.customer.password,
        firstName: "Demo",
        lastName: "Customer",
        phone: "+2348012345678",
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    ],
    currentUserId: null,
    products: seedProducts,
    categories,
    brand: {
      name: "Omo Iya Exchange",
      tagline: "Secure Digital Marketplace",
      supportEmail: "support@omoiyaexchange.com",
      whatsapp: "+234 800 000 0000",
      heroTitle: "Buy verified digital products in Nigeria.",
      heroCopy:
        "Browse digital templates, business kits, guides, and downloadable tools with NGN pricing and Paystack-ready checkout.",
    },
    cart: {},
    orders: [],
    tickets: [
      {
        id: "TCK-1001",
        userId: "customer-user",
        subject: "Need help downloading purchase",
        message: "Please resend my download link.",
        status: "OPEN",
      },
    ],
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const state = createDefaultState();
    saveState(state);
    return state;
  }

  try {
    return JSON.parse(raw) as AppState;
  } catch {
    const state = createDefaultState();
    saveState(state);
    return state;
  }
}

export function saveState(state: AppState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  const state = createDefaultState();
  saveState(state);
  return state;
}

export function currentUser(state: AppState) {
  return state.users.find((user) => user.id === state.currentUserId) ?? null;
}

export function formatNaira(amount: number) {
  return `NGN ${amount.toLocaleString("en-NG")}`;
}
