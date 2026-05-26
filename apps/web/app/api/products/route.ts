import { fail, fallbackSnapshot, getPublicSnapshot, ok, supabaseConfigured } from "../../lib/supabase-server";

export async function GET() {
  try {
    if (!supabaseConfigured()) return ok(fallbackSnapshot().products, "Supabase is not configured.");
    const snapshot = await getPublicSnapshot();
    return ok(snapshot.products);
  } catch (error) {
    return fail(error);
  }
}
