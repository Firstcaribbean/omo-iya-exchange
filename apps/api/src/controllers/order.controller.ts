import { Request, Response, NextFunction } from "express";
import { OrderService } from "../services/order.service";

export class OrderController {
  // POST /api/orders
  static async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { notes } = req.body;

      const order = await OrderService.createOrderFromCart(userId, notes);

      res.status(201).json({
        success: true,
        message: "Order placed successfully",
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/orders
  static async listUserOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page, limit } = req.query;

      const result = await OrderService.listUserOrders(
        userId,
        page ? Number(page) : undefined,
        limit ? Number(limit) : undefined
      );

      res.status(200).json({
        success: true,
        message: "User orders fetched successfully",
        data: result.orders,
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

  // GET /api/orders/:id
  static async getOrderDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const orderId = req.params.id;

      const order = await OrderService.getOrderDetail(orderId, userId);

      res.status(200).json({
        success: true,
        message: "Order details fetched successfully",
        data: order,
      });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }
}
export default OrderController;
