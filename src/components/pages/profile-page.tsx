'use client';

import { useEffect } from 'react';
import { useProfile, useProfileStats } from '@/hooks/use-profile';
import { useUserStore } from '@/store/user.store';
import { ProfileCard } from '@/components/profile/profile-card';
import { IncomeReferenceForm } from '@/components/profile/income-reference-form';
import { BorrowerStats } from '@/components/profile/borrower-stats';
import { LenderStats } from '@/components/profile/lender-stats';
import { Skeleton } from '@/components/ui/skeleton';

// Mock wallet address - replace with real wallet integration
const MOCK_WALLET_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

export function ProfilePage() {
  const { data: profile, isLoading: profileLoading } = useProfile(MOCK_WALLET_ADDRESS);
  const { data: stats, isLoading: statsLoading } = useProfileStats(MOCK_WALLET_ADDRESS);
  
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

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileCard profile={profile} isLoading={profileLoading} />
        <IncomeReferenceForm
          profile={profile}
          isLoading={profileLoading}
          walletAddress={MOCK_WALLET_ADDRESS}
        />
      </div>

      {stats && stats.totalBorrowed > 0n && (
        <BorrowerStats stats={stats} isLoading={statsLoading} />
      )}

      {stats && stats.totalLent > 0n && (
        <LenderStats stats={stats} isLoading={statsLoading} />
      )}

      {stats && stats.totalBorrowed === 0n && stats.totalLent === 0n && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">
            No activity yet. Start borrowing or lending to see your statistics here.
          </p>
        </div>
      )}
    </div>
  );
}

