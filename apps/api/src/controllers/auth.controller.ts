import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { EmailService } from "../services/email.service";
import { REFRESH_TOKEN_COOKIE_MAX_AGE } from "../config/auth";
import { generateRandomToken } from "../utils/crypto";
import { db } from "../config/database";
import { Role } from "@repo/types";

export class AuthController {
  // POST /api/auth/register
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.registerUser(req.body);

      // Generate email verification token
      const verificationToken = generateRandomToken();
      await db.user.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: verificationToken, // Temporary placeholder for email verification
        },
      });

      // Send verification email
      await EmailService.sendVerificationEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        verificationToken
      ).catch((err) => console.error("Email send failsafe failed:", err));

      res.status(201).json({
        success: true,
        message: "Registration successful. Please verify your email address.",
        data: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // POST /api/auth/login
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, otpCode } = req.body;
      const user = await AuthService.loginUser(email, password);

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        if (!otpCode) {
          return res.status(200).json({
            success: true,
            requires2FA: true,
            message: "Two-factor authentication code is required",
          });
        }

        const otpVerified = AuthService.verifyLoginOTP(user.twoFactorSecret!, otpCode);
        if (!otpVerified) {
          return res.status(400).json({
            success: false,
            message: "Invalid two-factor authentication code",
          });
        }
      }

      // Generate standard JWT Access/Refresh tokens
      const tokens = AuthService.generateTokenPair(user.id, user.email, user.role as Role);

      // Save session in DB
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_COOKIE_MAX_AGE);
      await AuthService.createSession(
        user.id,
        tokens.refreshToken,
        expiresAt,
        req.ip,
        req.headers["user-agent"]
      );

      // Set cookie containing the rotate-able Refresh token
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth/refresh-token",
        maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          accessToken: tokens.accessToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatar: user.avatar,
            emailVerified: user.emailVerified,
            twoFactorEnabled: user.twoFactorEnabled,
          },
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // POST /api/auth/logout
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      
      if (refreshToken) {
        await AuthService.removeSession(refreshToken);
      }

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth/refresh-token",
      });

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/verify-email
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      const user = await db.user.findFirst({
        where: { twoFactorSecret: token, emailVerified: false },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Verification token is invalid or expired",
        });
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          twoFactorSecret: null, // Clear email placeholder
        },
      });

      res.status(200).json({
        success: true,
        message: "Email address verified successfully! You can now login.",
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/enable-2fa (Initiate)
  static async initiate2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await AuthService.generate2FASecret(userId);

      res.status(200).json({
        success: true,
        message: "2FA Setup initiated. Please scan the QR code.",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/verify-2fa (Complete setup)
  static async complete2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { code } = req.body;

      const enabled = await AuthService.verifyAndEnable2FA(userId, code);
      if (enabled) {
        return res.status(200).json({
          success: true,
          message: "Two-factor authentication successfully enabled!",
        });
      }

      res.status(400).json({
        success: false,
        message: "Invalid 2FA authentication code",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // POST /api/auth/disable-2fa
  static async disable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { code } = req.body;

      const disabled = await AuthService.disable2FA(userId, code);
      if (disabled) {
        return res.status(200).json({
          success: true,
          message: "Two-factor authentication has been disabled",
        });
      }

      res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/auth/me
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt,
          wallet: user.wallet,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/auth/me
  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { firstName, lastName, phoneNumber } = req.body;

      const updated = await db.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          phoneNumber,
        },
      });

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: {
          firstName: updated.firstName,
          lastName: updated.lastName,
          phoneNumber: updated.phoneNumber,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/refresh-token
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Access token expiration triggers client to request new token using cookie refresh token
      // Read refresh token from secure httpOnly cookie
      const oldRefreshToken = req.cookies?.refreshToken;
      
      if (!oldRefreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token cookie missing",
        });
      }

      const tokens = await AuthService.rotateSession(
        oldRefreshToken,
        req.ip,
        req.headers["user-agent"]
      );

      // Re-set new rotated refresh token in secure cookie
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth/refresh-token",
        maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
      });

      res.status(200).json({
        success: true,
        message: "Tokens rotated successfully",
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }
}
export default AuthController;
