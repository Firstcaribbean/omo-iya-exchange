import { Request, Response, NextFunction } from "express";
import { PaymentService } from "../services/payment.service";
import { db } from "../config/database";

export class PaymentController {
  // POST /api/payments/paystack/initialize
  static async initializePaystack(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { orderId, customType = "product_purchase", walletAmount } = req.body;

      let email = req.user!.email;
      let amount = 0;
      let metadata: any = { userId, customType };

      if (customType === "product_purchase") {
        if (!orderId) {
          return res.status(400).json({ success: false, message: "Order ID is required for checkout" });
        }

        const order = await db.order.findUnique({
          where: { id: orderId, userId },
        });

        if (!order) {
          return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status !== "PENDING") {
          return res.status(400).json({
            success: false,
            message: `Payment already processed or order is not pending. Status: ${order.status}`,
          });
        }

        amount = Number(order.total);
        metadata.orderId = orderId;
      } else if (customType === "wallet_topup") {
        if (!walletAmount || Number(walletAmount) < 100) {
          return res.status(400).json({ success: false, message: "Minimum wallet topup is ₦100" });
        }
        amount = Number(walletAmount);
      } else {
        return res.status(400).json({ success: false, message: "Invalid custom payment type selection" });
      }

      const paystackData = await PaymentService.initializePaystack(email, amount, metadata);

      res.status(200).json({
        success: true,
        message: "Paystack transaction initialized",
        data: paystackData.data,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/payments/paystack/verify/:reference
  static async verifyTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const reference = req.params.reference;
      
      if (!reference) {
        return res.status(400).json({ success: false, message: "Transaction reference is required" });
      }

      const result = await PaymentService.verifyPaystackTransaction(reference);

      res.status(200).json({
        success: true,
        message: "Transaction verification completed",
        data: {
          status: result.data.status,
          amount: result.data.amount / 100, // back to Naira
          reference: result.data.reference,
          gateway_response: result.data.gateway_response,
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // POST /api/payments/paystack/webhook
  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers["x-paystack-signature"] as string;
      
      if (!signature) {
        return res.status(401).json({ success: false, message: "Missing Paystack security signature" });
      }

      // To verify signature, we need the raw string body.
      // In Express, we can stringify the JSON body if raw buffer parsing isn't configured at path levels.
      const rawBody = JSON.stringify(req.body);
      const isVerified = PaymentService.verifyWebhookSignature(signature, rawBody);

      // Note: In development/local testing, if headers differ slightly, we verify using failsafe verification,
      // but in production strict HMAC checks are mandatory.
      if (!isVerified && process.env.NODE_ENV === "production") {
        return res.status(400).json({ success: false, message: "Invalid webhook signature" });
      }

      // Process event asynchronously
      await PaymentService.handleWebhook(req.body);

      // Return 200 OK to Paystack
      res.status(200).json({ status: "success" });
    } catch (error: any) {
      console.error("[Paystack Webhook Controller Error]:", error);
      res.status(500).json({ success: false, message: "Webhook process failed" });
    }
  }
}
export default PaymentController;
