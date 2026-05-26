import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";
import { ProductService } from "../services/product.service";
import { FulfillmentService } from "../services/fulfillment.service";
import { ProductStatus, Role, UserStatus, OrderStatus } from "@repo/types";

export class AdminController {
  // GET /api/admin/dashboard
  static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [totalUsers, totalProducts, totalOrders, completedPayments] = await Promise.all([
        db.user.count({ where: { role: "CUSTOMER" } }),
        db.product.count({ where: { status: { not: "ARCHIVED" } } }),
        db.order.count(),
        db.payment.findMany({
          where: { status: "COMPLETED" },
          select: { amount: true },
        }),
      ]);

      const totalRevenue = completedPayments.reduce((acc, p) => acc + Number(p.amount), 0);

      // Fetch monthly revenue trend data for line charts
      const payments = await db.payment.findMany({
        where: { status: "COMPLETED" },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      });

      const revenueByDate: Record<string, number> = {};
      payments.forEach((payment) => {
        const dateStr = new Date(payment.createdAt).toISOString().split("T")[0]; // YYYY-MM-DD
        revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + Number(payment.amount);
      });

      const chartsData = Object.entries(revenueByDate).map(([date, revenue]) => ({
        date,
        revenue,
      }));

      res.status(200).json({
        success: true,
        message: "Dashboard analytics fetched successfully",
        data: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue,
          chartsData,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/admin/products
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        name,
        description,
        shortDesc,
        price,
        comparePrice,
        categoryId,
        images,
        digitalAsset,
        stock,
        sku,
        status,
        featured,
        tags,
        metadata,
      } = req.body;

      const product = await ProductService.createProduct({
        name,
        description,
        shortDesc,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : undefined,
        categoryId,
        images,
        digitalAsset,
        stock: stock ? Number(stock) : 0,
        sku,
        status: status as ProductStatus,
        featured: featured === true,
        tags,
        metadata,
      });

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // PUT /api/admin/products/:id
  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // DELETE /api/admin/products/:id
  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductService.deleteProduct(req.params.id);
      res.status(200).json({
        success: true,
        message: "Product archived/deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/admin/orders
  static async listAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) {
        where.status = status as OrderStatus;
      }

      const [orders, total] = await Promise.all([
        db.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            items: true,
            payment: true,
          },
        }),
        db.order.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        message: "All marketplace orders fetched",
        data: orders,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/admin/orders/:id/approve
  static async approveOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const order = await FulfillmentService.approveOrder(req.params.id, adminId, req.body.notes);

      res.status(200).json({
        success: true,
        message: "Order approved successfully",
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // PUT /api/admin/orders/:id/reject
  static async rejectOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ success: false, message: "Rejection reason is required" });
      }

      const order = await FulfillmentService.rejectOrder(req.params.id, adminId, reason);

      res.status(200).json({
        success: true,
        message: "Order rejected and stock inventory restored",
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // PUT /api/admin/orders/:id/fulfill
  static async fulfillOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const order = await FulfillmentService.fulfillAndDeliverOrder(
        req.params.id,
        adminId,
        req.body.notes
      );

      res.status(200).json({
        success: true,
        message: "Order fulfilled and digital files released successfully",
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/admin/users
  static async listAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = { role: "CUSTOMER" };

      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: "insensitive" } },
          { firstName: { contains: search as string, mode: "insensitive" } },
          { lastName: { contains: search as string, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            emailVerified: true,
            createdAt: true,
          },
        }),
        db.user.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        message: "All customers fetched successfully",
        data: users,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/admin/users/:id/suspend
  static async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await db.user.update({
        where: { id: req.params.id },
        data: { status: "SUSPENDED" },
      });

      res.status(200).json({
        success: true,
        message: `Account for user ${updated.email} is suspended`,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/admin/users/:id/ban
  static async banUser(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await db.user.update({
        where: { id: req.params.id },
        data: { status: "BANNED" },
      });

      res.status(200).json({
        success: true,
        message: `Account for user ${updated.email} has been BANNED`,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/admin/users/:id/activate
  static async activateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await db.user.update({
        where: { id: req.params.id },
        data: { status: "ACTIVE" },
      });

      res.status(200).json({
        success: true,
        message: `Account for user ${updated.email} is now ACTIVE`,
      });
    } catch (error) {
      next(error);
    }
  }
}
export default AdminController;
