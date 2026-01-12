'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/services/authService';

interface UseSignInFormReturn {
  email: string;
  password: string;
  isSubmitting: boolean;
  error: string | null;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useSignInForm(): UseSignInFormReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn({
        email: email.trim(),
        password,
      });

      setIsSubmitting(false);

      if (!result.success) {
        setError(result.error || 'Failed to sign in');
        return;
      }

      // Success - redirect to dashboard or requested page
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  return {
    email,
    password,
    isSubmitting,
    error,
    setEmail,
    setPassword,
    handleSubmit,
  };
}