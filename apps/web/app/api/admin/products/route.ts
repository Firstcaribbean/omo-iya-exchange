import { fail, mapProduct, ok, productToRow, requireAdmin, slugifyServer, supabaseRest } from "../../../lib/supabase-server";
import type { Product } from "../../../lib/store";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const product: Product = {
      id: crypto.randomUUID(),
      slug: slugifyServer(body.name),
      name: body.name,
      category: body.category || body.tags?.[0] || "General",
      region: body.metadata?.region || "Global",
      country: body.metadata?.country || "Multi-country",
      availability: Number(body.stock || 0),
      fulfillmentWindow: body.metadata?.fulfillmentWindow || "24-72 hours",
      price: Number(body.price || 0),
      oldPrice: body.comparePrice ? Number(body.comparePrice) : undefined,
      rating: 5,
      sales: 0,
      image: body.images?.[0] || "",
      badge: body.featured ? "Featured" : "Verified",
      description: body.description || body.shortDesc || "",
      delivery: body.metadata?.delivery || "Managed setup",
      includes: body.metadata?.includes || ["Onboarding support"],
      requiresOtp: Boolean(body.metadata?.requiresOtp),
    };
    const rows = await supabaseRest<any[]>("/products", {
      method: "POST",
      prefer: "return=representation",
      body: productToRow(product),
    });
    return ok(mapProduct(rows[0]));
  } catch (error) {
    return fail(error, 401);
  }
}
