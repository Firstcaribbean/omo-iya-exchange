import { products as seedProducts } from "../market-data";
import type { BrandSettings, Category, Order, Product, Ticket, User } from "./store";

type SupabaseOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  prefer?: string;
};

export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function url() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "");
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function anonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

export async function supabaseRest<T>(path: string, options: SupabaseOptions = {}): Promise<T> {
  if (!supabaseConfigured()) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const response = await fetch(`${url()}/rest/v1${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: serviceKey(),
      Authorization: `Bearer ${options.token || serviceKey()}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(body?.message || body?.error_description || body?.hint || "Supabase request failed.");
  }
  return body as T;
}

export function slugifyServer(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function supabaseAuth<T>(path: string, body: unknown, useServiceRole = false): Promise<T> {
  const key = useServiceRole ? serviceKey() : anonKey();
  const response = await fetch(`${url()}/auth/v1${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.msg || result?.message || result?.error_description || "Authentication failed.");
  }
  return result as T;
}

export async function getAuthUser(token: string) {
  const response = await fetch(`${url()}/auth/v1/user`, {
    headers: {
      apikey: anonKey(),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  return body as { id: string; email?: string };
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export async function requireProfile(request: Request) {
  const token = getBearerToken(request);
  if (!token) throw new Error("Please sign in first.");
  const authUser = await getAuthUser(token);
  if (!authUser?.id) throw new Error("Your session expired. Please sign in again.");
  const profiles = await supabaseRest<ProfileRow[]>(`/profiles?id=eq.${authUser.id}&select=*`);
  const profile = profiles[0];
  if (!profile || profile.status === "SUSPENDED") throw new Error("Account is not active.");
  return mapProfile(profile);
}

export async function requireAdmin(request: Request) {
  const profile = await requireProfile(request);
  if (profile.role !== "ADMIN") throw new Error("Admin access required.");
  return profile;
}

type ProfileRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: "CUSTOMER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  region: string;
  country: string;
  availability: number;
  fulfillment_window: string;
  price: number;
  old_price?: number | null;
  rating: number;
  sales: number;
  image: string;
  badge: string;
  description: string;
  delivery: string;
  includes: string[] | null;
  requires_otp: boolean;
};

type CategoryRow = { id: string; name: string; slug: string; description: string };
type BrandRow = BrandSettings & { id: number };

export function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    password: "",
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    phone: row.phone || "",
    role: row.role,
    status: row.status,
  };
}

export function productToRow(product: Product): ProductRow {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    region: product.region,
    country: product.country,
    availability: product.availability,
    fulfillment_window: product.fulfillmentWindow,
    price: product.price,
    old_price: product.oldPrice ?? null,
    rating: product.rating,
    sales: product.sales,
    image: product.image,
    badge: product.badge,
    description: product.description,
    delivery: product.delivery,
    includes: product.includes,
    requires_otp: Boolean(product.requiresOtp),
  };
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    region: row.region,
    country: row.country,
    availability: Number(row.availability || 0),
    fulfillmentWindow: row.fulfillment_window,
    price: Number(row.price || 0),
    oldPrice: row.old_price ? Number(row.old_price) : undefined,
    rating: Number(row.rating || 5),
    sales: Number(row.sales || 0),
    image: row.image,
    badge: row.badge,
    description: row.description,
    delivery: row.delivery,
    includes: row.includes || ["Onboarding support"],
    requiresOtp: row.requires_otp,
  };
}

export async function getPublicSnapshot() {
  const [products, categories, brands] = await Promise.all([
    supabaseRest<ProductRow[]>("/products?select=*&order=name.asc"),
    supabaseRest<CategoryRow[]>("/categories?select=*&order=name.asc"),
    supabaseRest<BrandRow[]>("/brand_settings?id=eq.1&select=*"),
  ]);

  return {
    products: products.map(mapProduct),
    categories: categories.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
    })) satisfies Category[],
    brand: brands[0],
  };
}

export function fallbackSnapshot() {
  const categories = Array.from(new Set(seedProducts.map((product) => product.category))).map((name) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: `${name} services.`,
  }));

  return {
    products: seedProducts,
    categories,
    brand: {
      name: "Omo Iya Exchange",
      tagline: "Secure Digital Marketplace",
      supportEmail: "support@omoiyaexchange.com",
      whatsapp: "+234 800 000 0000",
      heroTitle: "Omo Iya Exchange",
      heroCopy:
        "Browse compliant setup services with region filters, country availability, NGN pricing, and Paystack-ready checkout.",
    },
  };
}

export async function orderWithItems(orderIdFilter: string) {
  const orders = await supabaseRest<any[]>(
    `/orders?${orderIdFilter}&select=*,order_items(*)&order=created_at.desc`,
  );

  return orders.map((order) => ({
    id: order.id,
    userId: order.user_id,
    total: Number(order.total || 0),
    status: order.status,
    createdAt: order.created_at,
    otpCode: order.otp_code || "",
    fulfillmentNote: order.fulfillment_note || "",
    items: (order.order_items || []).map((item: any) => ({
      productId: item.product_id,
      name: item.name,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0),
    })),
  })) satisfies Order[];
}

export async function ticketsFor(filter: string) {
  const rows = await supabaseRest<any[]>(
    `/tickets?${filter}&select=*,ticket_messages(*)&order=created_at.desc`,
  );

  return rows.map((ticket) => ({
    id: ticket.id,
    userId: ticket.user_id,
    subject: ticket.subject,
    message: ticket.message,
    status: ticket.status,
    channel: ticket.channel,
    assignedToAgent: ticket.assigned_to_agent,
    contactName: ticket.contact_name,
    contactEmail: ticket.contact_email,
    messages: (ticket.ticket_messages || []).map((message: any) => ({
      id: message.id,
      sender: message.sender,
      text: message.text,
      createdAt: message.created_at,
    })),
  })) satisfies Ticket[];
}

export function ok<T>(data: T, message = "OK") {
  return Response.json({ success: true, data, message });
}

export function fail(error: unknown, status = 400) {
  const rawMessage = error instanceof Error ? error.message : "Request failed.";
  const message =
    rawMessage === "fetch failed"
      ? "Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL in Vercel and make sure it is only https://PROJECT_REF.supabase.co"
      : rawMessage;
  return Response.json({ success: false, message }, { status });
}
