import { db } from "../config/database";
import { TicketStatus, TicketPriority, Role } from "@repo/types";

export class SupportService {
  // Customer creates ticket
  static async createTicket(userId: string, data: { subject: string; description: string; priority?: TicketPriority }) {
    return db.supportTicket.create({
      data: {
        userId,
        subject: data.subject,
        description: data.description,
        priority: data.priority || "MEDIUM",
        status: "OPEN",
      },
    });
  }

  // Customer or Admin replies to ticket
  static async replyToTicket(
    ticketId: string,
    senderId: string,
    senderRole: Role,
    message: string
  ) {
    const ticket = await db.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new Error("Support ticket not found");
    }

    if (ticket.status === "CLOSED") {
      throw new Error("Cannot reply to a closed support ticket");
    }

    return db.$transaction(async (tx) => {
      // 1. Create message record
      const ticketMessage = await tx.ticketMessage.create({
        data: {
          ticketId,
          senderId,
          senderRole,
          message,
        },
      });

      // 2. Automatically update status to IN_PROGRESS if admin replied, or OPEN if customer replied
      const nextStatus: TicketStatus = senderRole === "CUSTOMER" ? "OPEN" : "IN_PROGRESS";
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { status: nextStatus },
      });

      return ticketMessage;
    });
  }

  // Get full ticket details with replies
  static async getTicketDetails(ticketId: string, userId?: string, userRole?: Role) {
    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Gating for non-admin customers: can only view own tickets
    if (userRole === "CUSTOMER" && ticket.userId !== userId) {
      throw new Error("Forbidden request: Access denied");
    }

    return ticket;
  }

  // List customer's tickets
  static async listUserTickets(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      db.supportTicket.count({ where: { userId } }),
    ]);

    return { tickets, total };
  }

  // List all tickets (Admin)
  static async listAllTickets(page = 1, limit = 10, status?: TicketStatus) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      db.supportTicket.count({ where }),
    ]);

    return { tickets, total };
  }

  // Close ticket
  static async closeTicket(ticketId: string, adminId: string) {
    return db.supportTicket.update({
      where: { id: ticketId },
      data: { status: "CLOSED" },
    });
  }
}
export default SupportService;
