import { fail, ok, requireAdmin, slugifyServer, supabaseRest } from "../../../lib/supabase-server";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) throw new Error("Category name is required.");
    const rows = await supabaseRest<any[]>("/categories", {
      method: "POST",
      prefer: "return=representation",
      body: {
        name,
        slug: body.slug || slugifyServer(name),
        description: body.description || `${name} services.`,
      },
    });
    return ok(rows[0]);
  } catch (error) {
    return fail(error, 401);
  }
}
