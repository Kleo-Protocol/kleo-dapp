'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { Wallet, TrendingUp, Calendar, Star } from 'lucide-react';
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
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
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
          <Wallet className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-card-foreground">Wallet Address</p>
            <p className="text-sm text-muted-foreground font-mono">{formatAddress(profile.walletAddress)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TrendingUp className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-card-foreground">Capital</p>
            <p className="text-sm text-muted-foreground">{formatBalance(profile.capital)} tokens</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Star className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-card-foreground">Reputation Score</p>
            <p className="text-sm text-muted-foreground">{profile.reputation} points</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-card-foreground">Member Since</p>
            <p className="text-sm text-muted-foreground">{formatDate(profile.registeredAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

