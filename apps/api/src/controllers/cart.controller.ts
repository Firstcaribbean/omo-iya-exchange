import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";

export class CartController {
  // GET /api/cart
  static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cartItems = await db.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              comparePrice: true,
              images: true,
              stock: true,
              status: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: "Cart fetched successfully",
        data: cartItems,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/cart/items
  static async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { productId, quantity = 1 } = req.body;

      if (!productId) {
        return res.status(400).json({ success: false, message: "Product ID is required" });
      }

      // Check if product is available
      const product = await db.product.findUnique({ where: { id: productId } });
      if (!product || product.status !== "ACTIVE") {
        return res.status(404).json({ success: false, message: "Product is not available for purchase" });
      }

      if (product.stock > 0 && product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product. Available: ${product.stock}`,
        });
      }

      // Add or update cart item
      const cartItem = await db.cartItem.upsert({
        where: {
          userId_productId: { userId, productId },
        },
        update: {
          quantity: { increment: quantity },
        },
        create: {
          userId,
          productId,
          quantity,
        },
      });

      res.status(200).json({
        success: true,
        message: "Product added to cart",
        data: cartItem,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/cart/items/:id
  static async updateQuantity(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cartItemId = req.params.id;
      const { quantity } = req.body;

      if (quantity === undefined || quantity < 1) {
        return res.status(400).json({ success: false, message: "Valid quantity is required (minimum 1)" });
      }

      const cartItem = await db.cartItem.findFirst({
        where: { id: cartItemId, userId },
        include: { product: true },
      });

      if (!cartItem) {
        return res.status(404).json({ success: false, message: "Cart item not found" });
      }

      // Validate stock
      if (cartItem.product.stock > 0 && cartItem.product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${cartItem.product.stock}`,
        });
      }

      const updated = await db.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });

      res.status(200).json({
        success: true,
        message: "Cart item quantity updated",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/cart/items/:id
  static async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cartItemId = req.params.id;

      const cartItem = await db.cartItem.findFirst({
        where: { id: cartItemId, userId },
      });

      if (!cartItem) {
        return res.status(404).json({ success: false, message: "Cart item not found" });
      }

      await db.cartItem.delete({
        where: { id: cartItemId },
      });

      res.status(200).json({
        success: true,
        message: "Item removed from cart",
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/cart/clear
  static async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      await db.cartItem.deleteMany({
        where: { userId },
      });

      res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
export default CartController;
