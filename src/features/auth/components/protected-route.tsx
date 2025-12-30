'use client';

import { ReactNode } from 'react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card, CardContent } from '@/shared/ui/card';
import { useProtectedRoute } from '@/features/auth/hooks/use-protected-route';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Componente que protege las rutas del dapp
 * Solo permite acceso si hay una wallet conectada
 * Redirige a la landing page si no hay wallet
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isChecking, isWalletConnected } = useProtectedRoute();

  // Mostrar loading mientras se verifica el estado inicial
  if (isChecking) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='py-12 text-center'>
            <div className='space-y-4'>
              <Skeleton className='h-8 w-48 mx-auto' />
              <Skeleton className='h-4 w-64 mx-auto' />
              <Skeleton className='h-4 w-56 mx-auto' />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si no hay wallet conectada, mostrar loading mientras redirige
  if (!isWalletConnected) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='py-12 text-center'>
            <div className='space-y-4'>
              <Skeleton className='h-8 w-48 mx-auto' />
              <Skeleton className='h-4 w-64 mx-auto' />
              <Skeleton className='h-4 w-56 mx-auto' />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si hay wallet conectada, mostrar el contenido
  return <>{children}</>;
}
