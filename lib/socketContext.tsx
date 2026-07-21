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
    const token = data?.token;
    // The chat socket namespace now requires the same JWT as the REST API.
    if (!userId || !token) return;

    initWebPush().catch((err) =>
      console.warn("Web push registration skipped:", err)
    );

    const s = io(process.env.NEXT_APP_BASE_URL!, {
      auth: { token },
      query: { userId },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000
    });

    setSocket(s);

    s.on("connect", () => {
      s.emit("user_online", { userId });
    });

    // re-emit online after reconnection
    s.io.on("reconnect", () => {
      s.emit("user_online", { userId });
    });

    // Tear down THIS socket when the user changes or the provider unmounts.
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [data?.user?._id, data?.token]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
