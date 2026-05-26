import { ORDER_PREFIX } from "../config/constants";

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6); // Get last 6 digits of timestamp
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random alpha-numeric chars
  return `${ORDER_PREFIX}${timestamp}-${randomChars}`;
};
