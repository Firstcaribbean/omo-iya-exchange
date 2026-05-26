import { Request, Response, NextFunction } from "express";
import { db } from "../config/database";

export const logAudit = (action: string, entity: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Capture details upon successful API completion
    const originalJson = res.json;
    
    res.json = function (body) {
      res.json = originalJson; // Restore
      
      const responseResult = res.json(body);
      
      // Perform database log creation in the background asynchronously
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id || null;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers["user-agent"] || null;

        db.auditLog.create({
          data: {
            userId,
            action,
            entity,
            entityId: req.params.id || body.data?.id || null,
            ipAddress,
            userAgent,
            newData: req.method !== "GET" ? req.body : undefined,
          }
        }).catch((err) => {
          console.error("Failed to write audit log:", err);
        });
      }
      
      return responseResult;
    };
    
    next();
  };
};
export default logAudit;
