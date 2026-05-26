import { fail, ok, requireProfile, supabaseRest } from "../../../../../lib/supabase-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const profile = await requireProfile(request);
    const { id } = await context.params;
    const body = await request.json();
    const text = String(body.message || body.text || "");
    if (!text.trim()) throw new Error("Message is required.");

    const sender = profile.role === "ADMIN" ? "AGENT" : "CUSTOMER";
    const rows = await supabaseRest<any[]>("/ticket_messages", {
      method: "POST",
      prefer: "return=representation",
      body: {
        ticket_id: id,
        sender,
        text,
      },
    });

    await supabaseRest(`/tickets?id=eq.${id}`, {
      method: "PATCH",
      body: {
        status: profile.role === "ADMIN" ? "IN_PROGRESS" : "OPEN",
        assigned_to_agent: true,
      },
    });

    return ok(rows[0]);
  } catch (error) {
    return fail(error, 401);
  }
}
