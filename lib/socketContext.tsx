"use client";

import { useSession } from "next-auth/react";
import { createContext, ReactNode, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { data } = useSession();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // ⚠️ Only connect if user is logged in
    if (!data?.user?._id) return;

    // Prevent duplicate sockets
    if (!socketRef.current) {
      const s = io(process.env.NEXT_APP_BASE_URL!, {
        query: { userId: data.user._id },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socketRef.current = s;

      s.on("connect", () => {
        console.log("✅ Connected:", s.id);
        s.emit("user_online", { userId: data.user?._id });
      });

      s.on("disconnect", () => {
        console.log("❌ Disconnected");
      });

      // optional: re-emit online after reconnection
      s.io.on("reconnect", () => {
        console.log("🔁 Reconnected");
        s.emit("user_online", { userId: data.user?._id });
      });
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [data?.user?._id]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
