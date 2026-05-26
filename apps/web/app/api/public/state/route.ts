import { fail, fallbackSnapshot, getPublicSnapshot, ok, supabaseConfigured } from "../../../lib/supabase-server";

export async function GET() {
  try {
    if (!supabaseConfigured()) return ok({ ...fallbackSnapshot(), live: false }, "Supabase is not configured.");
    return ok({ ...(await getPublicSnapshot()), live: true });
  } catch (error) {
    return fail(error);
  }
}
