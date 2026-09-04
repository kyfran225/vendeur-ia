import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

let globalSocket: Socket | null = null;
const listeners = new Set<(s: Socket | null) => void>();

function setGlobalSocket(s: Socket | null) {
  globalSocket = s;
  listeners.forEach((cb) => cb(s));
}

export function useSocket(): Socket | null {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(globalSocket);

  useEffect(() => {
    listeners.add(setSocket);
    return () => {
      listeners.delete(setSocket);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      if (globalSocket) {
        globalSocket.disconnect();
        setGlobalSocket(null);
      }
      return;
    }

    if (!globalSocket) {
      const s = io(API_URL, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        transports: ["websocket", "polling"],
      });

      const joinRooms = () => {
        if (user?.id) {
          s.emit("join", user.id);
          const merchantId = (user as any).merchantId || (user as any).merchant?._id;
          if (merchantId) {
            s.emit("join", String(merchantId));
          }
          console.log(`[Socket] Joined room for user ${user.id}`);
        }
      };

      s.on("connect", joinRooms);
      if (s.connected) {
        joinRooms();
      }

      setGlobalSocket(s);
    } else {
      if (globalSocket.connected) {
        globalSocket.emit("join", user.id);
        const merchantId = (user as any).merchantId || (user as any).merchant?._id;
        if (merchantId) {
          globalSocket.emit("join", String(merchantId));
        }
      }
      if (socket !== globalSocket) {
        setSocket(globalSocket);
      }
    }
  }, [user?.id, (user as any)?.merchantId, socket]);

  return socket;
}
