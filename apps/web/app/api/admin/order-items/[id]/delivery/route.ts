import { fail, ok, requireAdmin, supabaseRest } from "../../../../../lib/supabase-server";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const body = await request.json();
    const rows = await supabaseRest<any[]>(`/order_items?id=eq.${id}`, {
      method: "PATCH",
      prefer: "return=representation",
      body: {
        delivered_number: String(body.deliveredNumber || "").trim(),
        username: String(body.username || "").trim(),
        pin: String(body.pin || "").trim(),
        otp_code: String(body.otpCode || "").trim(),
        fulfillment_note: String(body.fulfillmentNote || "").trim(),
      },
    });

    return ok(rows[0]);
  } catch (error) {
    return fail(error, 401);
  }
}
