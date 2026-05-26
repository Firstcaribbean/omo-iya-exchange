import crypto from "crypto";

export const generateRandomToken = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString("hex");
};

export const hashString = (text: string): string => {
  return crypto.createHash("sha256").update(text).digest("hex");
};
