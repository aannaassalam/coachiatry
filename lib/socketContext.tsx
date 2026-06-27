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
import { initWebPush } from "./fcm";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { data } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // ⚠️ Only connect if user is logged in
    const userId = data?.user?._id;
    if (!userId) return;

    initWebPush().catch((err) =>
      console.warn("Web push registration skipped:", err)
    );

    const s = io(process.env.NEXT_APP_BASE_URL!, {
      query: { userId },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000
    });

    setSocket(s);

    s.on("connect", () => {
      console.log("✅ Connected:", s.id);
      s.emit("user_online", { userId });
    });

    s.on("disconnect", () => {
      console.log("❌ Disconnected");
    });

    // re-emit online after reconnection
    s.io.on("reconnect", () => {
      console.log("🔁 Reconnected");
      s.emit("user_online", { userId });
    });

    // Tear down THIS socket when the user changes or the provider unmounts.
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [data?.user?._id]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
