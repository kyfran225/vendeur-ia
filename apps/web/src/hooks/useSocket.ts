import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

export function useSocket() {
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user?.id && !socketRef.current) {
      const s = io(API_URL, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });
      socketRef.current = s;

      const joinRoom = () => {
        if (user?.id) {
          s.emit("join", user.id);
          console.log(`[Socket] Joined room for user ${user.id}`);
        }
      };

      s.on("connect", joinRoom);
      if (s.connected) {
        joinRoom();
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id]);

  return socketRef.current;
}
