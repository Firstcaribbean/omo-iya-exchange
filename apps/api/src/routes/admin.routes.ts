import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { logAudit } from "../middleware/auditLogger";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN", "SUPER_ADMIN")); // Gated exclusively to administrators

router.get("/dashboard", AdminController.getDashboardStats);

// Products CRUD
router.post("/products", logAudit("CREATE", "Product"), AdminController.createProduct);
router.put("/products/:id", logAudit("UPDATE", "Product"), AdminController.updateProduct);
router.delete("/products/:id", logAudit("DELETE", "Product"), AdminController.deleteProduct);

// Orders and Fulfillment
router.get("/orders", AdminController.listAllOrders);
router.put("/orders/:id/approve", logAudit("APPROVE", "Order"), AdminController.approveOrder);
router.put("/orders/:id/reject", logAudit("REJECT", "Order"), AdminController.rejectOrder);
router.put("/orders/:id/fulfill", logAudit("FULFILL", "Order"), AdminController.fulfillOrder);

// Users Access Management
router.get("/users", AdminController.listAllUsers);
router.put("/users/:id/suspend", logAudit("SUSPEND", "User"), AdminController.suspendUser);
router.put("/users/:id/ban", logAudit("BAN", "User"), AdminController.banUser);
router.put("/users/:id/activate", logAudit("ACTIVATE", "User"), AdminController.activateUser);

export default router;
