import { fail, mapProfile, ok, supabaseAuth, supabaseRest } from "../../../lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const phone = String(body.phoneNumber || body.phone || "").trim();

    if (!email || !password || !firstName || !lastName) {
      throw new Error("First name, last name, email, and password are required.");
    }

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
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    });

    return ok(mapProfile(rows[0]), "Account created. You can now sign in.");
  } catch (error) {
    return fail(error);
  }
}
