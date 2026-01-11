'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { MainFooter } from './main-footer';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { MapAccountModal } from '@/features/auth/components/map-account-modal';
import { WalletDrawerProvider, useWalletDrawer } from './wallet-drawer-context';
import { cn } from '@/lib/utils';

interface AppLayoutContentProps {
  children: ReactNode;
}

function AppLayoutContent({ children }: AppLayoutContentProps) {
  const { isWalletDrawerOpen } = useWalletDrawer();

  return (
    <ProtectedRoute>
      <div className='min-h-screen flex flex-col'>
        <Sidebar />
        <div
          className={cn(
            'md:ml-20 flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out',
            isWalletDrawerOpen && 'md:ml-[400px]' // 80px (sidebar) + 320px (drawer width)
          )}
        >
          <main className='max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 lg:px-8 py-8'>{children}</main>
          <MainFooter />
        </div>
      </div>
      <MapAccountModal />
    </ProtectedRoute>
  );
}

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <WalletDrawerProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </WalletDrawerProvider>
  );
}
