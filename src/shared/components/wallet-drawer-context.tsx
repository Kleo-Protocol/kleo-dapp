'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface WalletDrawerContextType {
  isWalletDrawerOpen: boolean;
  setIsWalletDrawerOpen: (open: boolean) => void;
}

const WalletDrawerContext = createContext<WalletDrawerContextType | undefined>(undefined);

export function WalletDrawerProvider({ children }: { children: ReactNode }) {
  const [isWalletDrawerOpen, setIsWalletDrawerOpen] = useState(false);

  return (
    <WalletDrawerContext.Provider value={{ isWalletDrawerOpen, setIsWalletDrawerOpen }}>
      {children}
    </WalletDrawerContext.Provider>
  );
}

export function useWalletDrawer() {
  const context = useContext(WalletDrawerContext);
  if (context === undefined) {
    throw new Error('useWalletDrawer must be used within a WalletDrawerProvider');
  }
  return context;
}
