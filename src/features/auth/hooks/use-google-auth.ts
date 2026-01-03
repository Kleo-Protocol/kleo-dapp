'use client';

import { useState } from 'react';
import { signInWithGoogle } from '@/services/authService';

interface UseGoogleAuthReturn {
  isLoading: boolean;
  error: string | null;
  handleGoogleSignIn: () => Promise<void>;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithGoogle();

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      }
      // If successful, user will be redirected by Supabase OAuth flow
      // Loading state will be reset when component unmounts or redirect happens
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    handleGoogleSignIn,
  };
}