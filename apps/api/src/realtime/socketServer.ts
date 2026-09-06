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

    socket.on("chat:open", async (payload: { conversationId: string; userId?: string }) => {
      if (payload?.conversationId) {
        socket.join(`conv:${payload.conversationId}`);
        try {
          const { CommerceConversationModel, CommerceMerchantModel } = await import("../modules/commerce/commerce.model.js");
          const { whatsappService } = await import("../modules/whatsapp/whatsapp.service.js");
          const conv = await CommerceConversationModel.findById(payload.conversationId).populate("customerId");
          const customerPhone = (conv?.customerId as any)?.phone || (conv?.customerId as any)?.platformId;
          const isWhatsApp = !conv?.platform || conv?.platform === "whatsapp";
          if (conv && isWhatsApp && customerPhone && customerPhone !== "WEB_VISITOR") {
            const merchant = await CommerceMerchantModel.findById(conv.merchantId);
            const ownerId = payload.userId || merchant?.ownerId?.toString() || conv.merchantId?.toString();
            if (ownerId) {
              await whatsappService.subscribePresence(ownerId, customerPhone);
            }
          }
        } catch (err) {
          console.warn("[Socket chat:open] Failed to subscribe presence:", err);
        }
      }
    });

    socket.on("chat:leave", (payload: { conversationId: string; userId?: string }) => {
      if (payload?.conversationId) {
        socket.leave(`conv:${payload.conversationId}`);
      }
    });

    socket.on("typing:start", async (payload: { conversationId: string; userId?: string; participant?: string }) => {
      if (payload?.conversationId) {
        const typingData = {
          conversationId: payload.conversationId,
          isTyping: true,
          participant: payload.participant || "human",
          senderSocketId: socket.id,
          senderUserId: payload.userId
        };
        // 1. Broadcast to other clients viewing this specific conversation
        socket.to(`conv:${payload.conversationId}`).emit("conversation:typing", typingData);

        try {
          const { CommerceConversationModel, CommerceMerchantModel, CommerceCustomerModel } = await import("../modules/commerce/commerce.model.js");
          const { UserModel } = await import("../modules/auth/user.model.js");
          const { whatsappService } = await import("../modules/whatsapp/whatsapp.service.js");

          const conv = await CommerceConversationModel.findById(payload.conversationId).populate("customerId");
          if (!conv) return;

          const merchant = await CommerceMerchantModel.findById(conv.merchantId);
          const ownerId = payload.userId || merchant?.ownerId?.toString() || conv.merchantId?.toString();
          const customerPhone = (conv?.customerId as any)?.phone || (conv?.customerId as any)?.platformId;
          const isWhatsApp = !conv?.platform || conv?.platform === "whatsapp";

          // 2. Propagate typing state directly to WhatsApp recipient's physical device
          if (isWhatsApp && customerPhone && customerPhone !== "WEB_VISITOR" && ownerId) {
            await whatsappService.sendPresence(ownerId, customerPhone, 'composing', merchant).catch(() => {});
          }

          // 3. Propagate to Web Inbox recipient if the target is another user/merchant on the platform
          if (customerPhone && customerPhone !== "WEB_VISITOR") {
            const cleanDigits = customerPhone.replace(/\D/g, "");
            if (cleanDigits.length >= 8) {
              const last8 = cleanDigits.slice(-8);
              const recipientUser = await UserModel.findOne({
                $or: [
                  { whatsappNumber: customerPhone },
                  { whatsappNumber: { $regex: last8 } }
                ]
              });

              const recipientMerchant = await CommerceMerchantModel.findOne({
                $or: [
                  ...(recipientUser ? [{ ownerId: recipientUser._id }] : []),
                  { phone: customerPhone },
                  { phone: { $regex: last8 } },
                  { whatsappNumber: customerPhone },
                  { whatsappNumber: { $regex: last8 } }
                ]
              });

              const senderPhone = (merchant?.whatsappNumber || merchant?.phone || "").replace(/\D/g, "");
              const senderUser = payload.userId ? await UserModel.findById(payload.userId) : null;
              const senderUserPhone = (senderUser?.whatsappNumber || "").replace(/\D/g, "");
              const senderDigits = senderPhone || senderUserPhone;

              if (recipientMerchant && senderDigits && senderDigits.length >= 8) {
                const senderLast8 = senderDigits.slice(-8);
                const recipientCustomer = await CommerceCustomerModel.findOne({
                  merchantId: recipientMerchant._id,
                  $or: [
                    { phone: senderDigits },
                    { phone: { $regex: senderLast8 } }
                  ]
                });

                let reciprocalConv: any = null;
                if (recipientCustomer) {
                  reciprocalConv = await CommerceConversationModel.findOne({
                    merchantId: recipientMerchant._id,
                    customerId: recipientCustomer._id
                  });
                }

                const reciprocalTypingPayload = {
                  conversationId: reciprocalConv ? reciprocalConv._id.toString() : payload.conversationId,
                  customerPhone: senderDigits,
                  isTyping: true,
                  participant: "customer",
                  senderSocketId: socket.id,
                  senderUserId: payload.userId
                };

                if (reciprocalConv) {
                  io?.to(`conv:${reciprocalConv._id.toString()}`).emit("conversation:typing", reciprocalTypingPayload);
                }
                if (recipientMerchant.ownerId) {
                  io?.to(`user:${recipientMerchant.ownerId.toString()}`).emit("conversation:typing", reciprocalTypingPayload);
                }
                if (recipientUser) {
                  io?.to(`user:${recipientUser._id.toString()}`).emit("conversation:typing", reciprocalTypingPayload);
                }
              }
            }
          }
        } catch (err) {
          console.warn("[Socket typing:start] Failed to propagate typing:", err);
        }
      }
    });

    socket.on("typing:stop", async (payload: { conversationId: string; userId?: string; participant?: string }) => {
      if (payload?.conversationId) {
        const typingData = {
          conversationId: payload.conversationId,
          isTyping: false,
          participant: payload.participant || "human",
          senderSocketId: socket.id,
          senderUserId: payload.userId
        };
        // 1. Broadcast to other clients viewing this specific conversation
        socket.to(`conv:${payload.conversationId}`).emit("conversation:typing", typingData);

        try {
          const { CommerceConversationModel, CommerceMerchantModel, CommerceCustomerModel } = await import("../modules/commerce/commerce.model.js");
          const { UserModel } = await import("../modules/auth/user.model.js");
          const { whatsappService } = await import("../modules/whatsapp/whatsapp.service.js");

          const conv = await CommerceConversationModel.findById(payload.conversationId).populate("customerId");
          if (!conv) return;

          const merchant = await CommerceMerchantModel.findById(conv.merchantId);
          const ownerId = payload.userId || merchant?.ownerId?.toString() || conv.merchantId?.toString();
          const customerPhone = (conv?.customerId as any)?.phone || (conv?.customerId as any)?.platformId;
          const isWhatsApp = !conv?.platform || conv?.platform === "whatsapp";

          // 2. Propagate pause state directly to WhatsApp recipient's physical device
          if (isWhatsApp && customerPhone && customerPhone !== "WEB_VISITOR" && ownerId) {
            await whatsappService.sendPresence(ownerId, customerPhone, 'paused', merchant).catch(() => {});
          }

          // 3. Propagate to Web Inbox recipient if the target is another user/merchant on the platform
          if (customerPhone && customerPhone !== "WEB_VISITOR") {
            const cleanDigits = customerPhone.replace(/\D/g, "");
            if (cleanDigits.length >= 8) {
              const last8 = cleanDigits.slice(-8);
              const recipientUser = await UserModel.findOne({
                $or: [
                  { whatsappNumber: customerPhone },
                  { whatsappNumber: { $regex: last8 } }
                ]
              });

              const recipientMerchant = await CommerceMerchantModel.findOne({
                $or: [
                  ...(recipientUser ? [{ ownerId: recipientUser._id }] : []),
                  { phone: customerPhone },
                  { phone: { $regex: last8 } },
                  { whatsappNumber: customerPhone },
                  { whatsappNumber: { $regex: last8 } }
                ]
              });

              const senderPhone = (merchant?.whatsappNumber || merchant?.phone || "").replace(/\D/g, "");
              const senderUser = payload.userId ? await UserModel.findById(payload.userId) : null;
              const senderUserPhone = (senderUser?.whatsappNumber || "").replace(/\D/g, "");
              const senderDigits = senderPhone || senderUserPhone;

              if (recipientMerchant && senderDigits && senderDigits.length >= 8) {
                const senderLast8 = senderDigits.slice(-8);
                const recipientCustomer = await CommerceCustomerModel.findOne({
                  merchantId: recipientMerchant._id,
                  $or: [
                    { phone: senderDigits },
                    { phone: { $regex: senderLast8 } }
                  ]
                });

                let reciprocalConv: any = null;
                if (recipientCustomer) {
                  reciprocalConv = await CommerceConversationModel.findOne({
                    merchantId: recipientMerchant._id,
                    customerId: recipientCustomer._id
                  });
                }

                const reciprocalTypingPayload = {
                  conversationId: reciprocalConv ? reciprocalConv._id.toString() : payload.conversationId,
                  customerPhone: senderDigits,
                  isTyping: false,
                  participant: "customer",
                  senderSocketId: socket.id,
                  senderUserId: payload.userId
                };

                if (reciprocalConv) {
                  io?.to(`conv:${reciprocalConv._id.toString()}`).emit("conversation:typing", reciprocalTypingPayload);
                }
                if (recipientMerchant.ownerId) {
                  io?.to(`user:${recipientMerchant.ownerId.toString()}`).emit("conversation:typing", reciprocalTypingPayload);
                }
                if (recipientUser) {
                  io?.to(`user:${recipientUser._id.toString()}`).emit("conversation:typing", reciprocalTypingPayload);
                }
              }
            }
          }
        } catch (err) {
          console.warn("[Socket typing:stop] Failed to propagate typing:", err);
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

export function emitToConversation(conversationId: string, event: string, data: any) {
  if (io && conversationId) {
    io.to(`conv:${conversationId}`).emit(event, data);
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
