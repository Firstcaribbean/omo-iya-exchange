import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Public webhook route (must NOT be authenticated so Paystack can call it directly)
router.post("/paystack/webhook", PaymentController.handleWebhook);

// Protected merchant queries
router.post("/paystack/initialize", authenticate, PaymentController.initializePaystack);
router.get("/paystack/verify/:reference", authenticate, PaymentController.verifyTransaction);

export default router;
