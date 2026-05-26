export const JWT_SECRET = process.env.JWT_SECRET || "omoiya-exchange-super-secret-development-key";
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "omoiya-exchange-refresh-secret-development-key";

export const ACCESS_TOKEN_EXPIRY = "15m";
export const REFRESH_TOKEN_EXPIRY = "7d";
export const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export const BCRYPT_SALT_ROUNDS = 10;

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
