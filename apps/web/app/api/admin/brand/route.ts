import { fail, getPublicSnapshot, ok, requireAdmin, supabaseRest } from "../../../lib/supabase-server";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const snapshot = await getPublicSnapshot();
    return ok(snapshot.brand);
  } catch (error) {
    return fail(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const rows = await supabaseRest<any[]>("/brand_settings?id=eq.1", {
      method: "PATCH",
      prefer: "return=representation",
      body,
    });
    return ok(rows[0]);
  } catch (error) {
    return fail(error, 401);
  }
}
