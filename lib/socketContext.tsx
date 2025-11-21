"use client";

import { useSession } from "next-auth/react";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { data } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // ⚠️ Only connect if user is logged in
    if (!data?.user?._id) return;

    // Prevent duplicate sockets
    if (!socket) {
      const s = io(process.env.NEXT_APP_BASE_URL!, {
        query: { userId: data.user._id },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      setSocket(s);

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
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [data?.user?._id, socket]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
