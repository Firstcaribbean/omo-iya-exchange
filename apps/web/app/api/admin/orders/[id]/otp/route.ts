import { fail, ok, requireAdmin, supabaseRest } from "../../../../../lib/supabase-server";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const body = await request.json();
    const otpCode = String(body.otpCode || "").trim();
    if (!otpCode) throw new Error("OTP code is required.");
    await supabaseRest(`/orders?id=eq.${id}`, {
      method: "PATCH",
      body: {
        otp_code: otpCode,
        fulfillment_note: "OTP added by admin. Customer can view it from the dashboard.",
      },
    });
    return ok({ id, otpCode });
  } catch (error) {
    return fail(error, 401);
  }
}
