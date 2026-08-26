import { AuditLogModel } from "../modules/commerce/audit-log.model.js";
import { logger } from "./logger.service.js";
import { getSocketServer } from "../realtime/socketServer.js";

export class AuditLogService {
  async log(data: {
    merchantId?: any;
    userId?: any;
    action: string;
    entity: "merchant" | "payment" | "system" | "ai" | "user" | "order";
    entityId?: string;
    metadata?: any;
    severity?: "info" | "warning" | "error" | "critical";
  }) {
    try {
      const logEntry = await AuditLogModel.create({
        ...data,
        timestamp: new Date()
      });

      // Emit to Founder dashboard in real-time
      const io = getSocketServer();
      if (io) {
        io.to("founder:pulse").emit("system:pulse", logEntry);
      }

      if (data.severity === "critical" || data.severity === "error") {
        logger.error(`[AUDIT] ${data.severity.toUpperCase()}: ${data.action}`, data.metadata);
      }

      return logEntry;
    } catch (err: any) {
      logger.error(`[AuditLogService] Failed to log: ${err.message}`);
    }
  }

  async getRecent(limit = 50) {
    return AuditLogModel.find()
      .populate("merchantId", "businessName")
      .populate("userId", "displayName email")
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}

export const auditLogService = new AuditLogService();
