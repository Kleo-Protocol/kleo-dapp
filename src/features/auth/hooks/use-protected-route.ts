'use client';

import { useSupabaseUser } from '@/hooks/useSupabaseUser';

/**
 * Hook para proteger rutas basado en sesión de Supabase
 * El middleware ya maneja las redirecciones, este hook solo verifica el estado del usuario
 */
export function useProtectedRoute() {
  const { user, loading } = useSupabaseUser();

  // Si está cargando, mostrar loading
  // Si no está cargando y hay usuario, está autenticado
  // Si no está cargando y no hay usuario, el middleware debería haber redirigido
  return {
    isChecking: loading,
    isAuthenticated: !!user && !loading,
  };
}

