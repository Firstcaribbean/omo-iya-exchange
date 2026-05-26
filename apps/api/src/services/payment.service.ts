import crypto from "crypto";
import { db } from "../config/database";
import { PAYSTACK_SECRET_KEY, PAYSTACK_API_URL } from "../config/payment";
import { NotificationService } from "./notification.service";
import { EmailService } from "./email.service";

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string; // "success", "failed", etc.
    reference: string;
    amount: number; // in kobo (1 NGN = 100 kobo)
    gateway_response: string;
    channel: string;
    metadata: {
      orderId?: string;
      userId?: string;
      customType?: "wallet_topup" | "product_purchase";
    };
    customer: {
      email: string;
    };
  };
}

export class PaymentService {
  // Initialize Paystack checkout transaction
  static async initializePaystack(
    email: string,
    amountInNaira: number,
    metadata: { orderId?: string; userId?: string; customType: "wallet_topup" | "product_purchase" }
  ): Promise<PaystackInitResponse> {
    const amountInKobo = Math.round(amountInNaira * 100);
    const reference = `OMI-PAY-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

    const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        reference,
        metadata,
        callback_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/checkout/success?ref=${reference}`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Paystack initialization failed: ${errorText}`);
    }

    return (await response.json()) as PaystackInitResponse;
  }

  // Direct server-to-server transaction verification fallback
  static async verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const response = await fetch(`${PAYSTACK_API_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Paystack verification fetch failed: ${errorText}`);
    }

    return (await response.json()) as PaystackVerifyResponse;
  }

  // Crytographically check Paystack webhook header signature
  static verifyWebhookSignature(signature: string, rawBody: string): boolean {
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");
    
    return hash === signature;
  }

  // Handle validated webhook event
  static async handleWebhook(event: { event: string; data: any }) {
    console.log(`[Paystack Webhook] Received Event: ${event.event}`);

    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const amountInNaira = data.amount / 100; // convert kobo to Naira
      const metadata = data.metadata || {};

      console.log(`[Paystack Webhook] charge.success - Ref: ${reference} - Naira: ₦${amountInNaira}`);

      // Re-verify transaction status locally via db to avoid double executions
      const existingPayment = await db.payment.findFirst({
        where: { providerTxId: reference },
      });

      if (existingPayment && existingPayment.status === "COMPLETED") {
        console.log(`[Paystack Webhook] Payment ${reference} already processed`);
        return;
      }

      // Check if wallet top-up or checkout purchase
      if (metadata.customType === "wallet_topup" && metadata.userId) {
        await this.processWalletTopUp(metadata.userId, amountInNaira, reference, data);
      } else if (metadata.orderId) {
        await this.processOrderPayment(metadata.orderId, amountInNaira, reference, data);
      } else {
        console.warn(`[Paystack Webhook] Unknown transaction metadata structure:`, metadata);
      }
    }
  }

  // Process order checkout payment success
  private static async processOrderPayment(orderId: string, amount: number, reference: string, gatewayData: any) {
    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Check if order was already paid
      if (order.status !== "PENDING") {
        console.warn(`[Payment] Order ${orderId} is not in PENDING status: ${order.status}`);
        return;
      }

      // 1. Create or update payment log
      await tx.payment.upsert({
        where: { orderId },
        update: {
          status: "COMPLETED",
          providerTxId: reference,
          metadata: gatewayData,
        },
        create: {
          orderId,
          provider: "PAYSTACK",
          providerTxId: reference,
          amount,
          currency: "NGN",
          status: "COMPLETED",
          metadata: gatewayData,
        },
      });

      // 2. Mark order as PAID
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });

      // 3. Increment fulfillment logs
      await tx.fulfillmentLog.create({
        data: {
          orderId,
          action: "PAID",
          performedBy: "SYSTEM",
          notes: `Paystack payment confirmed (Ref: ${reference})`,
        },
      });

      // 4. Trigger In-App Notification
      await NotificationService.create(
        order.userId,
        "PAYMENT",
        "Payment Confirmed!",
        `Your payment of ₦${amount.toLocaleString()} for order ${order.orderNumber} was processed successfully. Administrative review is underway.`,
        `/dashboard/orders/${orderId}`
      );

      // 5. Send confirmation email
      await EmailService.sendOrderConfirmation(
        order.user.email,
        `${order.user.firstName} ${order.user.lastName}`,
        order.orderNumber,
        amount
      ).catch((err) => console.error("Failsafe order email failed:", err));

      console.log(`[Payment] Order ${orderId} successfully marked PAID`);
    });
  }

  // Process wallet funding success
  private static async processWalletTopUp(userId: string, amount: number, reference: string, gatewayData: any) {
    await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user || !user.wallet) {
        throw new Error(`User wallet ${userId} not found`);
      }

      // 1. Increment balance
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: { increment: amount },
        },
      });

      // 2. Write transaction log
      await tx.walletTransaction.create({
        data: {
          walletId: user.wallet.id,
          type: "CREDIT",
          amount,
          description: "Wallet topup via Paystack",
          reference,
        },
      });

      // 3. Create Notification alert
      await NotificationService.create(
        userId,
        "PAYMENT",
        "Wallet Funded Successfully!",
        `Your Omo Iya wallet has been credited with ₦${amount.toLocaleString()} (Ref: ${reference}).`,
        "/dashboard/wallet"
      );

      console.log(`[Payment] Wallet for user ${userId} funded with ₦${amount}`);
    });
  }
}
export default PaymentService;
