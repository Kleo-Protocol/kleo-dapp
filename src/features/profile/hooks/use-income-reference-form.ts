'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useUpdateIncomeReference } from '@/features/profile/hooks/use-profile';
import type { Profile } from '@/services/mock/profile.mock';

interface UseIncomeReferenceFormProps {
  profile: Profile | null | undefined;
  walletAddress: string | undefined;
}

export function useIncomeReferenceForm({ profile, walletAddress }: UseIncomeReferenceFormProps) {
  const [incomeRef, setIncomeRef] = useState('');
  const updateIncomeRef = useUpdateIncomeReference();

  useEffect(() => {
    if (profile?.incomeReference) {
      setIncomeRef(profile.incomeReference);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet to update income reference',
      });
      return;
    }

    updateIncomeRef.mutate(
      {
        walletAddress,
        incomeReference: incomeRef.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success('Income reference updated', {
            description: incomeRef.trim()
              ? 'Your income reference has been saved'
              : 'Income reference has been removed',
          });
        },
        onError: () => {
          toast.error('Update failed', {
            description: 'Failed to update income reference. Please try again.',
          });
        },
      }
    );
  };

  const isDisabled = updateIncomeRef.isPending || !walletAddress;

  return {
    incomeRef,
    setIncomeRef,
    isPending: updateIncomeRef.isPending,
    isDisabled,
    handleSubmit,
  };
}

