import { Request, Response, NextFunction } from "express";
import { SupportService } from "../services/support.service";
import { TicketPriority, Role } from "@repo/types";

export class SupportController {
  // POST /api/support/tickets
  static async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { subject, description, priority } = req.body;

      if (!subject || !description) {
        return res.status(400).json({ success: false, message: "Subject and Description are required" });
      }

      const ticket = await SupportService.createTicket(userId, {
        subject,
        description,
        priority: priority as TicketPriority,
      });

      res.status(201).json({
        success: true,
        message: "Support ticket created successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/support/tickets
  static async listUserTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page, limit } = req.query;

      const result = await SupportService.listUserTickets(
        userId,
        page ? Number(page) : undefined,
        limit ? Number(limit) : undefined
      );

      res.status(200).json({
        success: true,
        message: "Tickets retrieved successfully",
        data: result.tickets,
        meta: {
          total: result.total,
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/support/tickets/:id
  static async getTicketDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role as Role;
      const ticketId = req.params.id;

      const ticket = await SupportService.getTicketDetails(ticketId, userId, userRole);

      res.status(200).json({
        success: true,
        message: "Ticket details retrieved successfully",
        data: ticket,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // POST /api/support/tickets/:id/messages
  static async replyToTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const senderId = req.user!.id;
      const senderRole = req.user!.role as Role;
      const ticketId = req.params.id;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ success: false, message: "Reply message is required" });
      }

      const reply = await SupportService.replyToTicket(ticketId, senderId, senderRole, message);

      res.status(201).json({
        success: true,
        message: "Reply sent successfully",
        data: reply,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
export default SupportController;
