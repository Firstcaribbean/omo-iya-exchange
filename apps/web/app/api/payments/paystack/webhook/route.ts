import crypto from "node:crypto";
import { NextResponse } from "next/server";

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

  return NextResponse.json({
    success: true,
    event: event.event,
    reference: event.data?.reference,
  });
}
