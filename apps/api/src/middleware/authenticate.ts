import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/auth";
import { db } from "../config/database";
import { Role, UserStatus } from "@repo/types";

// TS Request typing decoration
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        status: UserStatus;
        firstName: string;
        lastName: string;
      };
    }
  }
}

interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token is missing or invalid",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is empty",
      });
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid token",
      });
    }

    // Resolve user details in DB to check status (BANNED/SUSPENDED)
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      return res.status(403).json({
        success: false,
        message: `Your account has been ${user.status.toLowerCase()}`,
      });
    }

    // Attach to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      status: user.status as UserStatus,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    next(error);
  }
};
export default authenticate;
