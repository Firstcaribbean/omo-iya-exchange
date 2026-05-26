import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseRest } from "../../../../lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const payload = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";

  if (!secretKey) {
    return NextResponse.json(
      { success: false, message: "Paystack secret key is not configured." },
      { status: 500 },
    );
  }

  const expectedSignature = crypto
    .createHmac("sha512", secretKey)
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json(
      { success: false, message: "Invalid Paystack signature." },
      { status: 400 },
    );
  }

  const event = JSON.parse(payload) as {
    event?: string;
    data?: {
      reference?: string;
      status?: string;
      metadata?: Record<string, unknown>;
    };
  };

  if (event.event === "charge.success" && event.data?.reference && event.data.status === "success") {
    const metadata = event.data.metadata || {};
    const orderId = typeof metadata.orderId === "string" ? metadata.orderId : "";
    if (orderId) {
      await supabaseRest(`/orders?id=eq.${orderId}`, {
        method: "PATCH",
        body: {
          status: "PAID",
          paystack_reference: event.data.reference,
        },
      });
    }
  }

  return NextResponse.json({
    success: true,
    event: event.event,
    reference: event.data?.reference,
  });
}
