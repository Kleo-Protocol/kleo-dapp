'use client';

import { ReactNode } from 'react';
import { MainHeader } from './main-header';
import { MainFooter } from './main-footer';

interface LandingLayoutProps {
  children: ReactNode;
}

/**
 * Layout para la landing page - no requiere wallet conectada
 */
export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className='min-h-screen flex flex-col'>
      <MainHeader />
      <main className='w-full flex-1'>
        {children}
      </main>
      <MainFooter />
    </div>
  );
}

