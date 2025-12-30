'use client';

import { useEffect } from 'react';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useUserStore } from '@/store/user.store';

export function useProfileSync(walletAddress: string | undefined) {
  const { data: profile, isLoading: profileLoading } = useProfile(walletAddress);
  const { setWalletAddress, setCapital, setReputation, setTier, setIncomeReference } = useUserStore();

  // Update Zustand store when profile data loads
  useEffect(() => {
    if (profile) {
      setWalletAddress(profile.walletAddress);
      setCapital(Number(profile.capital));
      setReputation(profile.reputation);
      setTier(profile.tier);
      setIncomeReference(profile.incomeReference || undefined);
    }
  }, [profile, setWalletAddress, setCapital, setReputation, setTier, setIncomeReference]);

  return {
    profile,
    isLoading: profileLoading,
  };
}

