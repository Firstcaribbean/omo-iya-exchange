import { fail, ok, orderWithItems, requireAdmin } from "../../../lib/supabase-server";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return ok(await orderWithItems("id=not.is.null"));
  } catch (error) {
    return fail(error, 401);
  }
}
