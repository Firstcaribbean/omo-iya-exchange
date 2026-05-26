import { Router } from "express";
import { SupportController } from "../controllers/support.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.use(authenticate); // Gated

router.post("/tickets", SupportController.createTicket);
router.get("/tickets", SupportController.listUserTickets);
router.get("/tickets/:id", SupportController.getTicketDetails);
router.post("/tickets/:id/messages", SupportController.replyToTicket);

export default router;
