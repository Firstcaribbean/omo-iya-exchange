import { fail, ok, requireAdmin, supabaseRest } from "../../../../../lib/supabase-server";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    await supabaseRest(`/orders?id=eq.${id}`, { method: "PATCH", body: { status: "FULFILLED" } });
    return ok({ id, status: "FULFILLED" });
  } catch (error) {
    return fail(error, 401);
  }
}
