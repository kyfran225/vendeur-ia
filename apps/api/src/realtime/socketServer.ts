import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server | null = null;
const onlineSessions = new Set<string>();

export function initSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on("join", (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket] Merchant ${userId} joined their room`);

      // If user is admin/founder, join the pulse room too
      // We can't verify role easily here without DB hit or decoding token,
      // so we rely on the client joining it explicitly and a middleware in a real app.
      // For now, we'll allow joining via a specific event.
    });

    socket.on("join_founder_pulse", () => {
       // Ideally verify token here
       socket.join("founder:pulse");
       console.log(`[Socket] Founder joined Pulse room: ${socket.id}`);
    });

    socket.on("join_auth", (phoneNumber: string) => {
      const clean = phoneNumber.replace(/[\s\-\+\(\)]/g, "");
      socket.join(`auth:${clean}`);
      console.log(`[Socket] Anonymous guest joined auth room for ${clean}`);
    });

    socket.on("join_session", (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      onlineSessions.add(sessionId);

      // Notify merchants that this session is online
      // In a real scenario, we might want to filter by merchantId
      io?.emit("session:status", { sessionId, status: "online" });

      console.log(`[Socket] Web Session ${sessionId} joined and is online`);

      socket.on("disconnect", () => {
        onlineSessions.delete(sessionId);
        io?.emit("session:status", { sessionId, status: "offline" });
        console.log(`[Socket] Web Session ${sessionId} disconnected`);
      });
    });

    socket.on("typing:start", async (payload: { conversationId: string; userId?: string; participant?: string }) => {
      if (payload?.conversationId) {
        socket.broadcast.emit("conversation:typing", {
          conversationId: payload.conversationId,
          isTyping: true,
          participant: payload.participant || "human"
        });

        // Propagate typing state directly to WhatsApp recipient's device
        try {
          const { CommerceConversationModel } = await import("../modules/commerce/commerce.model.js");
          const { whatsappService } = await import("../modules/whatsapp/whatsapp.service.js");
          const conv = await CommerceConversationModel.findById(payload.conversationId).populate("customerId");
          if (conv && conv.platform === "whatsapp" && (conv.customerId as any)?.phone) {
            const customerPhone = (conv.customerId as any).phone;
            const ownerId = payload.userId || conv.merchantId?.toString();
            if (ownerId && customerPhone) {
              await whatsappService.sendPresence(ownerId, customerPhone, 'composing');
            }
          }
        } catch (err) {
          console.warn("[Socket typing:start] Failed to propagate presence to WhatsApp:", err);
        }
      }
    });

    socket.on("typing:stop", async (payload: { conversationId: string; userId?: string; participant?: string }) => {
      if (payload?.conversationId) {
        socket.broadcast.emit("conversation:typing", {
          conversationId: payload.conversationId,
          isTyping: false,
          participant: payload.participant || "human"
        });

        // Propagate pause state directly to WhatsApp recipient's device
        try {
          const { CommerceConversationModel } = await import("../modules/commerce/commerce.model.js");
          const { whatsappService } = await import("../modules/whatsapp/whatsapp.service.js");
          const conv = await CommerceConversationModel.findById(payload.conversationId).populate("customerId");
          if (conv && conv.platform === "whatsapp" && (conv.customerId as any)?.phone) {
            const customerPhone = (conv.customerId as any).phone;
            const ownerId = payload.userId || conv.merchantId?.toString();
            if (ownerId && customerPhone) {
              await whatsappService.sendPresence(ownerId, customerPhone, 'paused');
            }
          }
        } catch (err) {
          console.warn("[Socket typing:stop] Failed to propagate presence to WhatsApp:", err);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToSession(sessionId: string, event: string, data: any) {
  if (io) {
    io.to(`session:${sessionId}`).emit(event, data);
  }
}

export function emitToAuth(room: string, event: string, data: any) {
  if (io && room) {
    const clean = room.replace(/[\s\-\+\(\)]/g, "");
    io.to(`auth:${clean}`).emit(event, data);
    io.to(`auth:${room}`).emit(event, data);
  }
}

export function isSessionOnline(sessionId: string): boolean {
  return onlineSessions.has(sessionId);
}
