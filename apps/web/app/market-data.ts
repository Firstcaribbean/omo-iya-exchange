export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  region: string;
  country: string;
  availability: number;
  fulfillmentWindow: string;
  price: number;
  oldPrice?: number;
  rating: number;
  sales: number;
  image: string;
  badge: string;
  description: string;
  delivery: string;
  includes: string[];
  requiresOtp?: boolean;
};

export const products: Product[] = [
  {
    id: "ng-whatsapp-business-setup",
    slug: "nigeria-whatsapp-business-number-setup",
    name: "Nigeria WhatsApp Business Number Setup",
    category: "WhatsApp Business Setup",
    region: "West Africa",
    country: "Nigeria",
    availability: 42,
    fulfillmentWindow: "24-48 hours",
    price: 28500,
    oldPrice: 34000,
    rating: 4.9,
    sales: 318,
    image:
      "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=900&q=80",
    badge: "High availability",
    description:
      "Compliant WhatsApp Business onboarding for buyer-owned brands, including number registration guidance, profile setup, catalog basics, and handover support.",
    delivery: "Managed setup",
    includes: ["Business profile setup", "Catalog starter setup", "Number onboarding guidance", "Handover checklist"],
    requiresOtp: true,
  },
  {
    id: "gh-whatsapp-business-setup",
    slug: "ghana-whatsapp-business-number-setup",
    name: "Ghana WhatsApp Business Number Setup",
    category: "WhatsApp Business Setup",
    region: "West Africa",
    country: "Ghana",
    availability: 18,
    fulfillmentWindow: "24-72 hours",
    price: 31500,
    rating: 4.8,
    sales: 204,
    image:
      "https://images.unsplash.com/photo-1556157382-97eda2f9e2bf?auto=format&fit=crop&w=900&q=80",
    badge: "Limited slots",
    description:
      "Region-specific WhatsApp Business setup for Ghanaian businesses, with compliance review, brand profile configuration, and buyer-controlled handover.",
    delivery: "Managed setup",
    includes: ["Eligibility check", "Profile configuration", "Security handover", "Support window"],
    requiresOtp: true,
  },
  {
    id: "uk-business-account-setup",
    slug: "uk-business-account-setup-service",
    name: "UK Business Account Setup Service",
    category: "Business Account Setup",
    region: "Europe",
    country: "United Kingdom",
    availability: 11,
    fulfillmentWindow: "2-4 business days",
    price: 54000,
    oldPrice: 62000,
    rating: 4.7,
    sales: 156,
    image:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80",
    badge: "Verified",
    description:
      "Guided setup for buyer-owned business accounts using buyer-provided details, with compliance checks, recovery setup, and onboarding documentation.",
    delivery: "Guided onboarding",
    includes: ["Requirement review", "Account setup session", "Recovery configuration", "Completion proof"],
    requiresOtp: true,
  },
  {
    id: "us-brand-page-setup",
    slug: "us-brand-page-setup-package",
    name: "US Brand Page Setup Package",
    category: "Business Account Setup",
    region: "North America",
    country: "United States",
    availability: 25,
    fulfillmentWindow: "1-3 business days",
    price: 48000,
    rating: 4.9,
    sales: 91,
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
    badge: "Premium",
    description:
      "Business page creation and launch support for buyer-owned brands, including profile setup, starter content, permissions, and security checklist.",
    delivery: "Managed setup",
    includes: ["Brand profile setup", "Starter content", "Admin permission review", "Security checklist"],
  },
  {
    id: "ng-sim-registration-assist",
    slug: "nigeria-sim-registration-assistance",
    name: "Nigeria SIM Registration Assistance",
    category: "SIM Registration Assistance",
    region: "West Africa",
    country: "Nigeria",
    availability: 64,
    fulfillmentWindow: "Same day-48 hours",
    price: 17500,
    rating: 4.6,
    sales: 127,
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    badge: "Available",
    description:
      "Provider-aligned assistance for lawful SIM onboarding where the buyer supplies required identity information and completes any mandatory verification.",
    delivery: "Assisted onboarding",
    includes: ["Provider availability check", "Registration guidance", "Verification reminders", "Activation support"],
    requiresOtp: true,
  },
  {
    id: "global-onboarding-consult",
    slug: "global-account-onboarding-consultation",
    name: "Global Account Onboarding Consultation",
    category: "Compliance Consultation",
    region: "Global",
    country: "Multi-country",
    availability: 9,
    fulfillmentWindow: "Booked within 48 hours",
    price: 22500,
    rating: 4.7,
    sales: 83,
    image:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&q=80",
    badge: "Consultation",
    description:
      "Planning call for businesses that need compliant setup across regions, provider requirements, documentation, and launch workflow.",
    delivery: "Video/phone consultation",
    includes: ["Region planning", "Provider checklist", "Risk review", "Launch roadmap"],
  },
];

export const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
export const regions = ["All", ...Array.from(new Set(products.map((p) => p.region)))];
export const countries = ["All", ...Array.from(new Set(products.map((p) => p.country)))];

export function formatNaira(amount: number) {
  return `NGN ${amount.toLocaleString("en-NG")}`;
}

export function findProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
