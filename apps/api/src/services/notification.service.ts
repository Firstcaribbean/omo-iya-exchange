import { db } from "../config/database";

export class NotificationService {
  static async create(userId: string, type: string, title: string, message: string, actionUrl?: string) {
    return db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        actionUrl,
      },
    });
  }

  static async listForUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.notification.count({ where: { userId } }),
    ]);

    return { notifications, total };
  }

  static async markAsRead(id: string, userId: string) {
    const notification = await db.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return db.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return db.notification.count({
      where: { userId, read: false },
    });
  }
}
export default NotificationService;
