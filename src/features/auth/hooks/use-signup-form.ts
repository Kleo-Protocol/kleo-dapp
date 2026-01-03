'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/services/authService';

interface UseSignUpFormReturn {
  name: string;
  surname: string;
  email: string;
  password: string;
  isSubmitting: boolean;
  error: string | null;
  setName: (value: string) => void;
  setSurname: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useSignUpForm(): UseSignUpFormReturn {
  const router = useRouter();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !surname.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp({
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        password,
      });

      if (!result.success) {
        setError(result.error || 'Failed to create account');
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return {
    name,
    surname,
    email,
    password,
    isSubmitting,
    error,
    setName,
    setSurname,
    setEmail,
    setPassword,
    handleSubmit,
  };
}