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
  otpCode?: string;
  fulfillmentNote?: string;
};

export type TicketMessage = {
  id: string;
  sender: "CUSTOMER" | "AI" | "AGENT" | "SYSTEM";
  text: string;
  createdAt: string;
};

export type Ticket = {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  channel?: "CHAT" | "SUPPORT";
  assignedToAgent?: boolean;
  contactName?: string;
  contactEmail?: string;
  messages?: TicketMessage[];
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

const STORAGE_KEY = "omo-iya-exchange-state-v2";

export const seededCredentials = {
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
      description: `${name} services and onboarding resources.`,
    }),
  );

  return {
    users: [
      {
        id: "admin-user",
        email: seededCredentials.admin.email,
        password: seededCredentials.admin.password,
        firstName: "Admin",
        lastName: "Manager",
        phone: "+2348000000000",
        role: "ADMIN",
        status: "ACTIVE",
      },
      {
        id: "customer-user",
        email: seededCredentials.customer.email,
        password: seededCredentials.customer.password,
        firstName: "Marketplace",
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
      heroTitle: "Order verified onboarding services by region.",
      heroCopy:
        "Browse compliant setup services with region filters, country availability, NGN pricing, and Paystack-ready checkout.",
    },
    cart: {},
    orders: [],
    tickets: [
      {
        id: "TCK-1001",
        userId: "customer-user",
        subject: "Need help with service fulfillment",
        message: "Please confirm the next steps for my service order.",
        status: "OPEN",
        channel: "SUPPORT",
        assignedToAgent: true,
        messages: [
          {
            id: "MSG-1001",
            sender: "CUSTOMER",
            text: "Please confirm the next steps for my service order.",
            createdAt: new Date().toISOString(),
          },
        ],
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
    return normalizeState(JSON.parse(raw) as AppState);
  } catch {
    const state = createDefaultState();
    saveState(state);
    return state;
  }
}

function normalizeState(state: AppState): AppState {
  state.products = state.products.map((product) => {
    const seed = seedProducts.find((item) => item.id === product.id || item.slug === product.slug);

    return {
      ...product,
      region: product.region || seed?.region || "Global",
      country: product.country || seed?.country || "Multi-country",
      availability: Number(product.availability ?? seed?.availability ?? 0),
      fulfillmentWindow: product.fulfillmentWindow || seed?.fulfillmentWindow || "24-72 hours",
      delivery: product.delivery || seed?.delivery || "Managed setup",
      includes: product.includes?.length ? product.includes : seed?.includes || ["Onboarding support"],
      requiresOtp: product.requiresOtp ?? seed?.requiresOtp ?? false,
    };
  });

  state.orders = state.orders.map((order) => ({
    ...order,
    otpCode: order.otpCode || "",
    fulfillmentNote: order.fulfillmentNote || "",
  }));

  state.tickets = state.tickets.map((ticket) => ({
    ...ticket,
    channel: ticket.channel || "SUPPORT",
    assignedToAgent: ticket.assignedToAgent ?? false,
    messages: ticket.messages?.length
      ? ticket.messages
      : [
          {
            id: `${ticket.id}-MSG-1`,
            sender: "CUSTOMER",
            text: ticket.message,
            createdAt: new Date().toISOString(),
          },
        ],
  }));

  return state;
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
