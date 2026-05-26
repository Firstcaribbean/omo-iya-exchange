import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.use(authenticate); // Gated

router.post("/", OrderController.checkout);
router.get("/", OrderController.listUserOrders);
router.get("/:id", OrderController.getOrderDetail);

export default router;
