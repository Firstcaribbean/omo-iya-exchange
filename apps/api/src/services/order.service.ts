import { db } from "../config/database";
import { generateOrderNumber } from "../utils/orderNumber";
import { NotificationService } from "./notification.service";

export class OrderService {
  // Create order from user's current shopping cart
  static async createOrderFromCart(userId: string, notes?: string) {
    return db.$transaction(async (tx) => {
      // 1. Fetch user's cart items
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        throw new Error("Cannot checkout: Shopping cart is empty");
      }

      let subtotal = 0;

      // 2. Perform atomic inventory stock verification
      for (const item of cartItems) {
        const product = item.product;
        
        // Digital products might have unlimited stock (stock = -1 or similar),
        // but if stock > 0 we verify and deduct it
        if (product.stock > 0 && product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.stock}`);
        }
      }

      // Calculate totals
      const itemsData = cartItems.map((item) => {
        const price = Number(item.product.price);
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

        return {
          productId: item.productId,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        };
      });

      const orderNumber = generateOrderNumber();
      const tax = 0; // standard digital products tax
      const total = subtotal + tax;

      // 3. Create the Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: "PENDING",
          subtotal,
          tax,
          total,
          notes,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // 4. Deduct product inventory stock where applicable
      for (const item of cartItems) {
        if (item.product.stock > 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
            },
          });
        }
      }

      // 5. Clear the shopping cart
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      // 6. Write notification logs
      await NotificationService.create(
        userId,
        "ORDER_UPDATE",
        "Order Created Successfully",
        `Order ${orderNumber} has been created. Awaiting payment processing.`,
        `/dashboard/orders/${order.id}`
      );

      console.log(`[Order] Order ${order.id} (${orderNumber}) created from cart`);
      return order;
    });
  }

  // Get user order details
  static async getOrderDetail(orderId: string, userId: string) {
    const order = await db.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        payment: {
          select: {
            id: true,
            provider: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  }

  // List orders for user
  static async listUserOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          items: {
            select: { productName: true, quantity: true },
          },
        },
      }),
      db.order.count({ where: { userId } }),
    ]);

    return { orders, total };
  }
}
export default OrderService;
