import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { db } from "../config/database";
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  BCRYPT_SALT_ROUNDS,
} from "../config/auth";
import { generateRandomToken } from "../utils/crypto";
import { Role } from "@repo/types";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  // Generate access & refresh tokens
  static generateTokenPair(userId: string, email: string, role: Role): TokenPair {
    const accessToken = jwt.sign(
      { userId, email, role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, email, role },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  // Create registration session
  static async registerUser(data: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    googleId?: string;
  }) {
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error("Email is already registered");
    }

    let passwordHash: string | null = null;
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);
    }

    // Create user along with a wallet automatically
    const user = await db.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        googleId: data.googleId,
        emailVerified: !!data.googleId, // Google users are verified automatically
        wallet: {
          create: {
            balance: 0,
            currency: "NGN",
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    return user;
  }

  // Validate standard email/password login
  static async loginUser(email: string, password?: string) {
    const user = await db.user.findUnique({
      where: { email },
      include: { wallet: true },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      throw new Error(`Your account has been ${user.status.toLowerCase()}`);
    }

    // If it's a Google OAuth account trying to login with password
    if (!user.passwordHash && user.googleId) {
      throw new Error("Account uses Google Login. Please sign in with Google.");
    }

    if (password && user.passwordHash) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new Error("Invalid email or password");
      }
    } else if (!user.googleId) {
      throw new Error("Invalid login payload");
    }

    return user;
  }

  // Enable Two-Factor Authentication (2FA)
  static async generate2FASecret(userId: string) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const secret = speakeasy.generateSecret({
      name: `Omo Iya Exchange (${user.email})`,
    });

    // Save temporary 2FA secret
    await db.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  // Verify and complete enabling 2FA
  static async verifyAndEnable2FA(userId: string, code: string): Promise<boolean> {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new Error("2FA Setup has not been initialized");
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1, // Allow 30 seconds clock drift
    });

    if (verified) {
      await db.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      });
      return true;
    }

    return false;
  }

  // Disable 2FA
  static async disable2FA(userId: string, code: string): Promise<boolean> {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      throw new Error("2FA is not enabled on this account");
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (verified) {
      await db.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });
      return true;
    }

    return false;
  }

  // Verify 2FA OTP code on login
  static verifyLoginOTP(secret: string, code: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: code,
      window: 2, // Allow slightly larger window for network lag
    });
  }

  // Create dynamic active sessions
  static async createSession(userId: string, token: string, expiresAt: Date, ipAddress?: string, userAgent?: string) {
    return db.session.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  // Refresh tokens with rotation replay protection
  static async rotateSession(oldRefreshToken: string, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    // 1. Verify old token
    let decoded: any;
    try {
      decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      // Invalidate existing sessions for this token if signature fails
      await db.session.deleteMany({ where: { token: oldRefreshToken } }).catch(() => {});
      throw new Error("Invalid or expired refresh token");
    }

    // 2. Resolve session record in DB
    const session = await db.session.findUnique({
      where: { token: oldRefreshToken },
    });

    if (!session) {
      // Replay attack detection: old refresh token is reused, revoke all user sessions!
      await db.session.deleteMany({ where: { userId: decoded.userId } });
      throw new Error("Security Alert: Token reuse detected. Logging out all devices.");
    }

    // Check expiry
    if (new Date() > session.expiresAt) {
      await db.session.delete({ where: { id: session.id } });
      throw new Error("Refresh token expired");
    }

    // 3. Generate new tokens
    const user = await db.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.status !== "ACTIVE") {
      await db.session.delete({ where: { id: session.id } });
      throw new Error("User account is inactive");
    }

    const tokens = this.generateTokenPair(user.id, user.email, user.role as Role);

    // 4. Update session DB - Rotate the token in the session record
    const nextExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // We update the session token to the new refresh token (Rotate)
    await db.session.update({
      where: { id: session.id },
      data: {
        token: tokens.refreshToken,
        expiresAt: nextExpiry,
        ipAddress: ipAddress || session.ipAddress,
        userAgent: userAgent || session.userAgent,
      },
    });

    return tokens;
  }

  // Remove single active session (logout)
  static async removeSession(refreshToken: string) {
    return db.session.delete({ where: { token: refreshToken } }).catch(() => {});
  }
}
export default AuthService;
