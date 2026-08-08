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

export function isSessionOnline(sessionId: string): boolean {
  return onlineSessions.has(sessionId);
}
