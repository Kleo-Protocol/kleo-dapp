'use client';

import { useProfileStats } from '@/features/profile/hooks/use-profile';
import { ProfileCard } from '@/features/profile/components/profile-card';
import { IncomeReferenceForm } from '@/features/profile/components/income-reference-form';
import { BorrowerStats } from '@/features/profile/components/borrower-stats';
import { LenderStats } from '@/features/profile/components/lender-stats';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card } from '@/shared/ui/card';
import { useProfileSync } from '@/features/profile/hooks/use-profile-sync';
import { useTypink } from 'typink';

export function ProfilePage() {
  const { connectedAccount } = useTypink();
  const walletAddress = connectedAccount?.address;
  
  const { profile, isLoading: profileLoading } = useProfileSync(walletAddress);
  const { data: stats, isLoading: statsLoading } = useProfileStats(walletAddress);

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
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
          walletAddress={walletAddress}
        />
      </div>

      {stats && stats.totalBorrowed > 0n && (
        <BorrowerStats stats={stats} isLoading={statsLoading} />
      )}

      {stats && stats.totalLent > 0n && (
        <LenderStats stats={stats} isLoading={statsLoading} />
      )}

      {stats && stats.totalBorrowed === 0n && stats.totalLent === 0n && (
        <Card>
          <div className="p-12 text-center">
            <p className="text-slate-600 mb-2">No activity yet.</p>
            <p className="text-sm text-slate-500">
              Start borrowing or lending to see your statistics here.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

