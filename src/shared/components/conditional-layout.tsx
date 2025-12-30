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
 */
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  if (isLandingPage) {
    return <LandingLayout>{children}</LandingLayout>;
  }

  return <AppLayout>{children}</AppLayout>;
}

