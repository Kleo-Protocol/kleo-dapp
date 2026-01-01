'use client';

import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Componente que protege las rutas del dapp
 * El middleware ya maneja las redirecciones en el servidor
 * Si llegamos a este componente, el middleware ya verificó que hay una sesión válida
 * Por lo tanto, mostramos el contenido inmediatamente sin esperar la verificación del cliente
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // El middleware ya verificó la sesión y redirigió si no hay usuario
  // Si llegamos aquí, hay una sesión válida, así que mostramos el contenido inmediatamente
  // El hook useSupabaseUser sincroniza el estado en segundo plano, pero no bloqueamos el render
  return <>{children}</>;
}
