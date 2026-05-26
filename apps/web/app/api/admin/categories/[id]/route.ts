import { fail, ok, requireAdmin, supabaseRest } from "../../../../lib/supabase-server";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    await supabaseRest(`/categories?id=eq.${id}`, { method: "DELETE" });
    return ok({ id });
  } catch (error) {
    return fail(error, 401);
  }
}
