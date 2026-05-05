import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface AppState {
  aiOpen: boolean;
  cartCount: number;
  unreadMessages: number;
  unreadNotifs: number;
  openAI: () => void;
  closeAI: () => void;
  toggleAI: () => void;
  setCartCount: (n: number) => void;
  setUnreadMessages: (n: number) => void;
  setUnreadNotifs: (n: number) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [aiOpen, setAiOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const openAI  = useCallback(() => setAiOpen(true),  []);
  const closeAI = useCallback(() => setAiOpen(false), []);
  const toggleAI = useCallback(() => setAiOpen(v => !v), []);

  const value = useMemo<AppState>(() => ({
    aiOpen, cartCount, unreadMessages, unreadNotifs,
    openAI, closeAI, toggleAI,
    setCartCount, setUnreadMessages, setUnreadNotifs,
  }), [aiOpen, cartCount, unreadMessages, unreadNotifs]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
