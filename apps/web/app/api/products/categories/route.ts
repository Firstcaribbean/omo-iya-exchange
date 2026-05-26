import { fail, fallbackSnapshot, getPublicSnapshot, ok, supabaseConfigured } from "../../../lib/supabase-server";

export async function GET() {
  try {
    if (!supabaseConfigured()) return ok(fallbackSnapshot().categories, "Supabase is not configured.");
    const snapshot = await getPublicSnapshot();
    return ok(snapshot.categories);
  } catch (error) {
    return fail(error);
  }
}
