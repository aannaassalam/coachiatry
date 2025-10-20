"use client";

import { useSession } from "next-auth/react";
// context/SocketContext.tsx
import React, {
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
    const s = io(process.env.NEXT_APP_BASE_URL!, {
      query: { userId: data?.user?._id },
      transports: ["websocket"]
    });
    setSocket(s);

    s.on("connect", () => {
      s.emit("user_online", { userId: data?.user?._id });

      // Optional: handle reconnection after network loss
      s.on("connect", () => {
        s.emit("user_online", { userId: data?.user?._id });
      });
    });
    s.on("disconnect", () => console.log("❌ Disconnected"));

    return () => {
      s.disconnect();
    };
  }, [data?.user?._id]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
