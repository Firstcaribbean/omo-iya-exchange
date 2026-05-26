import { fail, mapProfile, ok, supabaseAuth, supabaseRest } from "../../../lib/supabase-server";

export async function POST(request: Request) {
  try {
    const existingAdmins = await supabaseRest<Array<{ id: string }>>("/profiles?role=eq.ADMIN&select=id&limit=1");
    if (existingAdmins.length > 0) {
      throw new Error("Admin setup is already complete.");
    }

    const body = await request.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const firstName = String(body.firstName || "Admin").trim();
    const lastName = String(body.lastName || "Manager").trim();
    const phone = String(body.phone || "").trim();
    if (!email || !password) throw new Error("Admin email and password are required.");

    const created = await supabaseAuth<any>("/admin/users", {
      email,
      password,
      email_confirm: true,
      user_metadata: { firstName, lastName, phone },
    }, true);
    const user = created.user || created;

    const rows = await supabaseRest<any[]>("/profiles", {
      method: "POST",
      prefer: "return=representation",
      body: {
        id: user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    return ok(mapProfile(rows[0]), "Admin account created. You can now sign in.");
  } catch (error) {
    return fail(error);
  }
}
