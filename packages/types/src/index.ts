export type Role = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  avatar?: string | null;
  role: Role;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  status: UserStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "OUT_OF_STOCK";

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc?: string | null;
  price: number;
  comparePrice?: number | null;
  categoryId: string;
  images: string[];
  digitalAsset?: string | null;
  stock: number;
  sku?: string | null;
  status: ProductStatus;
  featured: boolean;
  tags: string[];
  metadata?: any;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  sortOrder: number;
  createdAt: Date | string;
}

export type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "FULFILLED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export interface OrderItemDTO {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  fulfilled: boolean;
  deliveredAt?: Date | string | null;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: OrderItemDTO[];
}

export type PaymentProvider = "PAYSTACK" | "WALLET";
export type PaymentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface PaymentDTO {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  providerTxId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date | string;
}

export interface WalletDTO {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: Date | string;
}

export type WalletTxType = "CREDIT" | "DEBIT" | "REFUND";

export interface WalletTransactionDTO {
  id: string;
  walletId: string;
  type: WalletTxType;
  amount: number;
  description?: string | null;
  reference?: string | null;
  createdAt: Date | string;
}

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface SupportTicketDTO {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TicketMessageDTO {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: Role;
  message: string;
  createdAt: Date | string;
}

export interface NotificationDTO {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string | null;
  createdAt: Date | string;
}
