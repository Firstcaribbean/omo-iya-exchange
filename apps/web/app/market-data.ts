export type Product = {
  id: string;
  slug: string;
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
  includes: string[];
};

export const products: Product[] = [
  {
    id: "brand-kit",
    slug: "business-brand-starter-kit",
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
    includes: ["Logo file pack", "Canva social templates", "Invoice sheet", "Launch checklist"],
  },
  {
    id: "wa-commerce",
    slug: "whatsapp-commerce-playbook",
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
    includes: ["Sales scripts", "Follow-up messages", "Offer templates", "Pricing worksheet"],
  },
  {
    id: "excel-finance",
    slug: "sme-finance-dashboard",
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
    includes: ["Income tracker", "Expense log", "Profit dashboard", "Stock worksheet"],
  },
  {
    id: "ad-pack",
    slug: "meta-ads-creative-pack",
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
    includes: ["Ad concepts", "Caption bank", "Campaign planner", "Report template"],
  },
  {
    id: "ebook-launch",
    slug: "ebook-launch-system",
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
    includes: ["Launch workbook", "Sales page outline", "Email copy", "Content planner"],
  },
  {
    id: "support-stack",
    slug: "customer-support-response-kit",
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
    includes: ["Reply macros", "Ticket categories", "Refund scripts", "Escalation rules"],
  },
];

export const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

export function formatNaira(amount: number) {
  return `NGN ${amount.toLocaleString("en-NG")}`;
}

export function findProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
