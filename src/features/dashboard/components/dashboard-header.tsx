'use client';

import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { formatBalance as formatTypinkBalance, useBalances, useTypink } from 'typink';
import { formatBalance } from '@/shared/utils/format';
import type { Profile } from '@/services/mock/profile.mock';
import { Skeleton } from '@/shared/ui/skeleton';
import { useMemo } from 'react';

interface DashboardHeaderProps {
  userRole: 'lender' | 'borrower' | null;
  profile: Profile | null | undefined;
  isLoading: boolean;
}

const tierColors = {
  rojo: 'bg-atomic-tangerine/10 text-atomic-tangerine border-atomic-tangerine/20',
  amarillo: 'bg-amber-honey/10 text-amber-honey border-amber-honey/20',
  verde: 'bg-amber-honey/10 text-amber-honey border-amber-honey/20',
};

const tierLabels = {
  rojo: 'Red',
  amarillo: 'Yellow',
  verde: 'Green',
};

export function DashboardHeader({ userRole, profile, isLoading }: DashboardHeaderProps) {
  const { connectedAccount, network } = useTypink();
  const addresses = useMemo(() => (connectedAccount ? [connectedAccount.address] : []), [connectedAccount]);
  const balances = useBalances(addresses);
  const balance = connectedAccount ? balances[connectedAccount.address] : null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
    );
  }

  const greeting = userRole === 'lender' 
    ? 'Welcome back, Lender! 👋' 
    : userRole === 'borrower'
    ? 'Welcome back, Borrower! 👋'
    : 'Welcome to Kleo! 👋';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {greeting}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {userRole 
            ? `Manage your ${userRole === 'lender' ? 'lending' : 'borrowing'} activities and track your performance`
            : 'Get started by connecting your wallet and selecting your role'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profile && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trust Tier</p>
                  <div className="mt-1">
                    <Badge 
                      variant="outline" 
                      className={`${tierColors[profile.tier]} border`}
                    >
                      {tierLabels[profile.tier]}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Reputation</p>
                  <p className="text-2xl font-bold">{profile.reputation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {balance && connectedAccount && (
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="text-2xl font-bold mt-1">
                  {formatTypinkBalance(balance.free, network).split(' ')[0]}
                  <span className="text-lg text-muted-foreground ml-1">
                    {network.symbol}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {profile && (
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Capital</p>
                <p className="text-2xl font-bold mt-1">
                  {formatBalance(profile.capital)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
