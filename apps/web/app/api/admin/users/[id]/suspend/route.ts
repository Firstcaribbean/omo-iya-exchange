import { fail, ok, requireAdmin, supabaseRest } from "../../../../../lib/supabase-server";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    await supabaseRest(`/profiles?id=eq.${id}`, { method: "PATCH", body: { status: "SUSPENDED" } });
    return ok({ id, status: "SUSPENDED" });
  } catch (error) {
    return fail(error, 401);
  }
}
