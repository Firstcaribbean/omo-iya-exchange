import { db } from "../config/database";
import { NotificationService } from "./notification.service";

export class FulfillmentService {
  // Admin approves paid order for preparation/review
  static async approveOrder(orderId: string, adminId: string, notes?: string) {
    return db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status !== "PAID") {
        throw new Error(`Only PAID orders can be approved. Current status: ${order.status}`);
      }

      // Update Order Status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "PROCESSING" },
      });

      // Write fulfillment logs
      await tx.fulfillmentLog.create({
        data: {
          orderId,
          action: "APPROVED",
          performedBy: adminId,
          notes: notes || "Order approved by administrator. Fulfilling digital items.",
        },
      });

      // Notify User
      await NotificationService.create(
        order.userId,
        "FULFILLMENT",
        "Order Processing Started",
        `Your order ${order.orderNumber} is now being processed by our administrators.`,
        `/dashboard/orders/${orderId}`
      );

      return updatedOrder;
    });
  }

  // Admin rejects order (e.g. fraudulent activity or payment chargeback)
  static async rejectOrder(orderId: string, adminId: string, reason: string) {
    return db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status === "FULFILLED" || order.status === "DELIVERED") {
        throw new Error("Cannot reject an already fulfilled/delivered order");
      }

      // Update status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      // Log action
      await tx.fulfillmentLog.create({
        data: {
          orderId,
          action: "REJECTED",
          performedBy: adminId,
          notes: reason || "Order rejected by administrator",
        },
      });

      // Restore product stock inventory
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }

      // Notify User
      await NotificationService.create(
        order.userId,
        "FULFILLMENT",
        "Order Rejected",
        `Your order ${order.orderNumber} was cancelled by administrator. Reason: ${reason}`,
        `/dashboard/orders/${orderId}`
      );

      return updatedOrder;
    });
  }

  // Admin releases digital files to the customer dashboard (Deliver)
  static async fulfillAndDeliverOrder(orderId: string, adminId: string, notes?: string) {
    return db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status !== "PROCESSING" && order.status !== "PAID") {
        throw new Error(`Order must be PAID or PROCESSING to fulfill. Current status: ${order.status}`);
      }

      const now = new Date();

      // 1. Mark all OrderItems as fulfilled
      await tx.orderItem.updateMany({
        where: { orderId },
        data: {
          fulfilled: true,
          deliveredAt: now,
        },
      });

      // 2. Set Order status to DELIVERED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED" },
      });

      // 3. Log fulfillment
      await tx.fulfillmentLog.create({
        data: {
          orderId,
          action: "DELIVERED",
          performedBy: adminId,
          notes: notes || "Digital product access keys and downloads released to customer dashboard.",
        },
      });

      // 4. Send dashboard notification with direct link to Purchases
      await NotificationService.create(
        order.userId,
        "FULFILLMENT",
        "Your Digital Goods are Ready!",
        `Congratulations! The items for order ${order.orderNumber} have been delivered. You can download or access them now.`,
        "/dashboard/purchases"
      );

      console.log(`[Fulfillment] Order ${orderId} digital goods successfully delivered`);
      return updatedOrder;
    });
  }
}
export default FulfillmentService;
