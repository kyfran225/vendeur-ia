import { Server } from "socket.io";
let io = null;
export function initSocketServer(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    io.on("connection", (socket) => {
        console.log(`[Socket] User connected: ${socket.id}`);
        socket.on("join", (userId) => {
            socket.join(`user:${userId}`);
            console.log(`[Socket] User ${userId} joined their room`);
        });
        socket.on("disconnect", () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
        });
    });
    return io;
}
export function getSocketServer() {
    return io;
}
export function emitToUser(userId, event, data) {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
}
