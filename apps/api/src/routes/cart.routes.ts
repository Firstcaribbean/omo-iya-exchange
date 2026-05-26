import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.use(authenticate); // Gated to logged-in users

router.get("/", CartController.getCart);
router.post("/items", CartController.addItem);
router.put("/items/:id", CartController.updateQuantity);
router.delete("/items/:id", CartController.removeItem);
router.delete("/clear", CartController.clearCart);

export default router;
