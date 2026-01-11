'use client';

import { Star, DollarSign, TrendingDown, Shield, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { formatBalance } from 'typink';
import { useTypink } from 'typink';
import { Skeleton } from '@/shared/ui/skeleton';
import type { UserReputation } from '../hooks/use-personal-dashboard';

interface PersonalKPICardsProps {
  reputation: UserReputation;
  totalDeposits: bigint;
  totalInterestEarned: bigint;
  currentAPY: number;
  totalBorrowed: bigint;
  totalToRepay: bigint;
  activeLoansCount: number;
  vouchesForMeCount: number;
  myVouchesCount: number;
  starsAtStake: number;
  isLoading: boolean;
  decimals: number;
}

export function PersonalKPICards({
  reputation,
  totalDeposits,
  totalInterestEarned,
  currentAPY,
  totalBorrowed,
  totalToRepay,
  activeLoansCount,
  vouchesForMeCount,
  myVouchesCount,
  starsAtStake,
  isLoading,
  decimals,
}: PersonalKPICardsProps) {
  const { network } = useTypink();

  if (isLoading) {
    return (
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className='border-anti-flash-white/20 bg-anti-flash-white/10 backdrop-blur-sm'>
            <CardHeader>
              <Skeleton className='h-4 w-24' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-32 mb-4' />
              <Skeleton className='h-3 w-full' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Format amounts
  const formattedDeposits = formatBalance(totalDeposits, network);
  const formattedInterest = formatBalance(totalInterestEarned, network);
  const formattedBorrowed = formatBalance(totalBorrowed, network);
  const formattedToRepay = formatBalance(totalToRepay, network);

  // Calculate next level progress (assuming next level at 500 stars)
  const nextLevelStars = 500;
  const reputationProgress = reputation.stars > 0 
    ? Math.min((reputation.stars / nextLevelStars) * 100, 100)
    : 0;

  // Calculate repayment progress
  const repaymentProgress = totalBorrowed > 0n
    ? Number((totalToRepay / totalBorrowed) * 100n)
    : 0;

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {/* Card 1: Mi Reputación */}
      <Card className='border-anti-flash-white/20 bg-anti-flash-white/10 backdrop-blur-sm hover:border-anti-flash-white/40 transition-all duration-300 hover:scale-[1.02]'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Star className='h-5 w-5 text-amber-honey' />
              <span className='font-inter text-sm text-muted-foreground'>Mi Reputación</span>
            </div>
            {reputation.canVouch ? (
              <Badge variant='secondary' className='bg-amber-honey/20 text-amber-honey border-amber-honey/30'>
                Can Vouch
              </Badge>
            ) : (
              <Badge variant='secondary' className='bg-muted text-muted-foreground'>
                Cannot Vouch Yet
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div>
              <span className='font-sora text-3xl font-bold tracking-tight text-foreground'>
                {reputation.stars}
              </span>
              <span className='font-inter text-sm text-muted-foreground ml-2'>stars</span>
            </div>
            <div className='space-y-2'>
              <p className='font-inter text-sm text-muted-foreground'>
                {starsAtStake} at stake
              </p>
              <Progress value={reputationProgress} className='h-2' />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Mis Depósitos */}
      <Card className='border-anti-flash-white/20 bg-anti-flash-white/10 backdrop-blur-sm hover:border-anti-flash-white/40 transition-all duration-300 hover:scale-[1.02]'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <DollarSign className='h-5 w-5 text-forest-green' />
              <span className='font-inter text-sm text-muted-foreground'>Mis Depósitos</span>
            </div>
            {currentAPY > 0 && (
              <Badge variant='secondary' className='bg-forest-green/20 text-forest-green border-forest-green/30'>
                {currentAPY.toFixed(2)}% APY
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div>
              <span className='font-sora text-3xl font-bold tracking-tight text-foreground'>
                {formattedDeposits}
              </span>
            </div>
            <div>
              <p className='font-inter text-sm text-muted-foreground'>
                {formattedInterest} earned this month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Mis Préstamos */}
      <Card className='border-anti-flash-white/20 bg-anti-flash-white/10 backdrop-blur-sm hover:border-anti-flash-white/40 transition-all duration-300 hover:scale-[1.02]'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <TrendingDown className='h-5 w-5 text-oxford-blue' />
              <span className='font-inter text-sm text-muted-foreground'>Mis Préstamos</span>
            </div>
            {activeLoansCount > 0 && (
              <Badge variant='secondary' className='bg-oxford-blue/20 text-oxford-blue border-oxford-blue/30'>
                {activeLoansCount} Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div>
              <span className='font-sora text-3xl font-bold tracking-tight text-foreground'>
                {formattedBorrowed}
              </span>
              <span className='font-inter text-xs text-muted-foreground ml-2'>borrowed</span>
            </div>
            <div className='space-y-2'>
              <p className='font-inter text-sm text-muted-foreground'>
                {formattedToRepay} to repay
              </p>
              {totalBorrowed > 0n && (
                <Progress value={repaymentProgress} className='h-2' />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Mis Vouches */}
      <Card className='border-anti-flash-white/20 bg-anti-flash-white/10 backdrop-blur-sm hover:border-anti-flash-white/40 transition-all duration-300 hover:scale-[1.02]'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Shield className='h-5 w-5 text-cetacean-blue' />
              <span className='font-inter text-sm text-muted-foreground'>Mis Vouches</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div>
              <span className='font-sora text-3xl font-bold tracking-tight text-foreground'>
                {vouchesForMeCount + myVouchesCount}
              </span>
              <span className='font-inter text-xs text-muted-foreground ml-2'>vouches</span>
            </div>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <Badge variant='secondary' className='bg-cetacean-blue/20 text-cetacean-blue border-cetacean-blue/30 text-xs'>
                  {vouchesForMeCount} backing me
                </Badge>
                <Badge variant='secondary' className='bg-cetacean-blue/20 text-cetacean-blue border-cetacean-blue/30 text-xs'>
                  {myVouchesCount} I back
                </Badge>
              </div>
              <p className='font-inter text-sm text-muted-foreground'>
                {starsAtStake} stars at stake
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
