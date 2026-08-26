import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { SystemSettingsModel } from "../modules/commerce/admin.model.js";
import { env } from "../config/env.js";

/**
 * Middleware to intercept requests during global maintenance.
 * Founders (admins/creators) are allowed to pass through to fix issues.
 */
export const maintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await SystemSettingsModel.findOne();

    if (settings?.maintenanceMode) {
      // 1. Allow bypass for auth routes (to let admins log in)
      if (req.path.startsWith("/api/auth")) {
        return next();
      }

      // 2. Allow bypass for public health check
      if (req.path === "/health" || req.path === "/" || req.path.startsWith("/uploads")) {
        return next();
      }

      // 3. Try to identify the user if a token is present
      let isAdmin = false;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = jwt.verify(token, env.JWT_SECRET) as any;
          isAdmin = decoded?.roles?.includes("admin") || decoded?.roles?.includes("creator") || decoded?.email === "franck@vendeur-ia.com";
        } catch (err) {
          // Token invalid, treat as guest
        }
      }

      // 4. If not an admin, block the request
      if (!isAdmin) {
        return res.status(503).json({
          error: "MAINTENANCE_MODE",
          message: "Vendeur IA est en cours de mise à jour technique. Nous revenons dans quelques instants.",
          retryAfter: 3600
        });
      }
    }

    next();
  } catch (err) {
    // If settings check fails, default to allowing traffic (don't break the app)
    next();
  }
};
