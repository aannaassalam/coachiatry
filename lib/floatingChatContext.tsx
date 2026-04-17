"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type FloatingChatState = {
  isOpen: boolean;
  isCollapsed: boolean;
  openRoomId: string | null;
  offsetX: number;
};

type FloatingChatContextValue = FloatingChatState & {
  openPanel: () => void;
  closePanel: () => void;
  openChat: (roomId: string) => void;
  backToList: () => void;
  toggleCollapse: () => void;
  setOffsetX: (x: number) => void;
};

const STORAGE_KEY = "coachiatry:floating-chat";

const DEFAULT_STATE: FloatingChatState = {
  isOpen: false,
  isCollapsed: false,
  openRoomId: null,
  offsetX: 0
};

const FloatingChatContext = createContext<FloatingChatContextValue | null>(null);

const readStoredState = (): FloatingChatState => {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<FloatingChatState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
};

export const FloatingChatProvider = ({ children }: { children: ReactNode }) => {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<FloatingChatState>(DEFAULT_STATE);

  useEffect(() => {
    setState(readStoredState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota / privacy-mode errors
    }
  }, [state, hydrated]);

  const openPanel = useCallback(
    () => setState((s) => ({ ...s, isOpen: true, isCollapsed: false })),
    []
  );
  const closePanel = useCallback(
    () =>
      setState((s) => ({
        ...s,
        isOpen: false,
        isCollapsed: false,
        openRoomId: null
      })),
    []
  );
  const openChat = useCallback(
    (roomId: string) =>
      setState((s) => ({
        ...s,
        isOpen: true,
        isCollapsed: false,
        openRoomId: roomId
      })),
    []
  );
  const backToList = useCallback(
    () => setState((s) => ({ ...s, openRoomId: null })),
    []
  );
  const toggleCollapse = useCallback(
    () => setState((s) => ({ ...s, isCollapsed: !s.isCollapsed })),
    []
  );
  const setOffsetX = useCallback(
    (x: number) => setState((s) => ({ ...s, offsetX: x })),
    []
  );

  const value = useMemo<FloatingChatContextValue>(
    () => ({
      ...state,
      openPanel,
      closePanel,
      openChat,
      backToList,
      toggleCollapse,
      setOffsetX
    }),
    [
      state,
      openPanel,
      closePanel,
      openChat,
      backToList,
      toggleCollapse,
      setOffsetX
    ]
  );

  return (
    <FloatingChatContext.Provider value={value}>
      {children}
    </FloatingChatContext.Provider>
  );
};

export const useFloatingChat = () => {
  const ctx = useContext(FloatingChatContext);
  if (!ctx) {
    throw new Error(
      "useFloatingChat must be used inside <FloatingChatProvider>"
    );
  }
  return ctx;
};
