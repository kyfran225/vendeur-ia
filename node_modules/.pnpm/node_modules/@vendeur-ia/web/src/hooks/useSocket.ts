import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

export function useSocket() {
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user && !socketRef.current) {
      socketRef.current = io(API_URL);
      socketRef.current.emit("join", user.id);
      console.log(`[Socket] Joined room for user ${user.id}`);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  return socketRef.current;
}
