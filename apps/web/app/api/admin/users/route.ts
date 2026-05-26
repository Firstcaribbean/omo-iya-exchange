import { fail, mapProfile, ok, requireAdmin, supabaseRest } from "../../../lib/supabase-server";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const rows = await supabaseRest<any[]>("/profiles?select=*&order=created_at.desc");
    return ok(rows.map(mapProfile));
  } catch (error) {
    return fail(error, 401);
  }
}
