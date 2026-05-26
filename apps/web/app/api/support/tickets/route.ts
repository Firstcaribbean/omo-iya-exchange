import { fail, ok, requireProfile, supabaseRest, ticketsFor } from "../../../lib/supabase-server";

export async function GET(request: Request) {
  try {
    const profile = await requireProfile(request);
    const filter = profile.role === "ADMIN" ? "select=*" : `user_id=eq.${profile.id}&select=*`;
    return ok(await ticketsFor(filter));
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireProfile(request);
    const body = await request.json();
    const subject = String(body.subject || "Support request");
    const message = String(body.description || body.message || "");
    if (!message.trim()) throw new Error("Message is required.");

    const rows = await supabaseRest<any[]>("/tickets", {
      method: "POST",
      prefer: "return=representation",
      body: {
        user_id: profile.id,
        subject,
        message,
        status: "OPEN",
        channel: body.channel || "SUPPORT",
        assigned_to_agent: true,
        contact_name: `${profile.firstName} ${profile.lastName}`.trim(),
        contact_email: profile.email,
      },
    });

    await supabaseRest("/ticket_messages", {
      method: "POST",
      body: {
        ticket_id: rows[0].id,
        sender: "CUSTOMER",
        text: message,
      },
    });

    return ok(rows[0]);
  } catch (error) {
    return fail(error, 401);
  }
}
