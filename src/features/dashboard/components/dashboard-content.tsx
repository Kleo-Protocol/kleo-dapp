'use client';

import { useTypink } from 'typink';
import { useAuthStore } from '@/store/authStore';
import { useDashboard } from '@/features/auth/hooks/use-dashboard';
import { useProfileSync } from '@/features/profile/hooks/use-profile-sync';
import { useProfileStats } from '@/features/profile/hooks/use-profile';
import { useBorrowerLoans } from '@/features/pools/hooks/use-borrow-data';
import { useLenderLoans } from '@/features/pools/hooks/use-lend-data';
import { useAvailablePools } from '@/features/pools/hooks/use-pools';
import { DashboardHeader } from './dashboard-header';
import { DashboardKpis } from './dashboard-kpis';
import { DashboardActivity } from './dashboard-activity';
import { DashboardQuickActions } from './dashboard-quick-actions';
import { DashboardPools } from './dashboard-pools';

export function DashboardContent() {
  const { connectedAccount } = useTypink();
  const { userRole } = useAuthStore();
  const { shouldShowContent } = useDashboard();
  
  const walletAddress = connectedAccount?.address;

  const { profile, isLoading: profileLoading } = useProfileSync(walletAddress);
  const { data: stats, isLoading: statsLoading } = useProfileStats(walletAddress);
  const { data: borrowerLoans = [], isLoading: borrowerLoansLoading } = useBorrowerLoans(
    userRole === 'borrower' ? walletAddress : undefined
  );
  const { data: lenderLoans = [], isLoading: lenderLoansLoading } = useLenderLoans(
    userRole === 'lender' ? walletAddress : undefined
  );
  const { data: availablePools = [], isLoading: poolsLoading } = useAvailablePools();

  if (!shouldShowContent) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Preparing your dashboard...
      </div>
    );
  }

  const isLoading = profileLoading || statsLoading;
  const activeLoans = userRole === 'borrower' 
    ? borrowerLoans.filter(loan => loan.status === 'active' || loan.status === 'funding')
    : lenderLoans.filter(loan => loan.status === 'active' || loan.status === 'funding');

  return (
    <div className="space-y-6">
      <DashboardHeader userRole={userRole} profile={profile} isLoading={isLoading} />
      
      <DashboardKpis 
        profile={profile} 
        stats={stats} 
        isLoading={isLoading}
        activeLoansCount={activeLoans.length}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardActivity 
          userRole={userRole}
          activeLoans={activeLoans}
          isLoading={userRole === 'borrower' ? borrowerLoansLoading : lenderLoansLoading}
        />
        
        <DashboardQuickActions userRole={userRole} />
      </div>

      {userRole === 'lender' && availablePools.length > 0 && (
        <DashboardPools pools={availablePools} isLoading={poolsLoading} />
      )}
    </div>
  );
}
