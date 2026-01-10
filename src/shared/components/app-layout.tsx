'use client';

import { ReactNode } from 'react';
import { MainHeader } from './main-header';
import { MainFooter } from './main-footer';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { MapAccountModal } from '@/features/auth/components/map-account-modal';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ProtectedRoute>
      <div className='min-h-screen flex flex-col'>
        <MainHeader />
        <main className='max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 lg:px-8 py-8'>{children}</main>
        <MainFooter />
      </div>
      <MapAccountModal />
    </ProtectedRoute>
  );
}
