'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp, Calendar } from 'lucide-react';
import type { Profile } from '@/services/mock/profile.mock';

interface ProfileCardProps {
  profile: Profile | undefined;
  isLoading: boolean;
}

export function ProfileCard({ profile, isLoading }: ProfileCardProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatBalance = (balance: bigint) => {
    const tokens = Number(balance) / 1e18;
    return tokens.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-600">
          No profile data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Profile</CardTitle>
            <CardDescription className="mt-1">Your account information</CardDescription>
          </div>
          <Badge variant={profile.tier}>{profile.tier.toUpperCase()}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Wallet className="size-5 text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-900">Wallet Address</p>
            <p className="text-sm text-slate-600 font-mono">{formatAddress(profile.walletAddress)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TrendingUp className="size-5 text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-900">Capital</p>
            <p className="text-sm text-slate-600">{formatBalance(profile.capital)} tokens</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="size-5 flex items-center justify-center">
            <span className="text-lg">⭐</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Reputation Score</p>
            <p className="text-sm text-slate-600">{profile.reputation} points</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="size-5 text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-900">Member Since</p>
            <p className="text-sm text-slate-600">{formatDate(profile.registeredAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

