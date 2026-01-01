'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppLayout } from './app-layout';
import { LandingLayout } from './landing-layout';

interface ConditionalLayoutProps {
  children: ReactNode;
}

/**
 * Layout condicional que aplica LandingLayout para la landing page
 * y AppLayout (con protección) para todas las demás rutas
 * Excluye signin y signup del AppLayout (no necesitan protección)
 */
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/signin' || pathname === '/signup';
  const isCallbackPage = pathname?.startsWith('/auth/callback');

  if (isLandingPage) {
    return <LandingLayout>{children}</LandingLayout>;
  }

  // Auth pages (signin/signup/callback) don't need AppLayout or protection
  if (isAuthPage || isCallbackPage) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}

