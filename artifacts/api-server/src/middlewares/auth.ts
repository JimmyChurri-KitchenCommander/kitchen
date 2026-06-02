import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      isDemoMode?: boolean;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Demo mode: userId already set by the demo router middleware — pass straight through.
  if (req.isDemoMode) {
    next();
    return;
  }

  const auth = getAuth(req);
  const userId = (auth?.sessionClaims?.userId as string | undefined) || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
};
