import { fail, ok, orderWithItems, requireProfile, supabaseRest } from "../../../../lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const profile = await requireProfile(request);
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) throw new Error("Paystack secret key is not configured.");

    const { orderId } = await request.json();
    const [order] = await orderWithItems(`id=eq.${orderId}&user_id=eq.${profile.id}&select=*`);
    if (!order) throw new Error("Order not found.");
    if (order.total <= 0) throw new Error("Order total is invalid.");

    const origin = new URL(request.url).origin;
    const reference = `${order.id}-${Date.now()}`;
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: profile.email,
        amount: Math.round(order.total * 100),
        reference,
        callback_url: `${origin}/checkout/success?reference=${reference}`,
        metadata: {
          orderId: order.id,
          userId: profile.id,
          source: "omo-iya-exchange",
        },
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.status === false) {
      throw new Error(body.message || "Unable to initialize Paystack payment.");
    }

    await supabaseRest(`/orders?id=eq.${order.id}`, {
      method: "PATCH",
      body: { paystack_reference: reference },
    });

    return ok(body.data);
  } catch (error) {
    return fail(error, 400);
  }
}
