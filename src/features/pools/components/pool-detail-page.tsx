'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { Skeleton } from '@/shared/ui/skeleton';
import { ArrowLeft, TrendingUp, DollarSign, Users, Clock, Percent, Shield, Zap, Target } from 'lucide-react';
import { DepositForm } from '@/features/pools/components/deposit-form';
import { ApyPreview } from '@/features/pools/components/apy-preview';
import { MyDepositsTable } from '@/features/pools/components/my-deposits-table';
import { MaxBorrowInfo } from '@/features/pools/components/max-borrow-info';
import { BorrowForm } from '@/features/pools/components/borrow-form';
import { RequestsTable } from '@/features/pools/components/requests-table';
import { LoansTable } from '@/features/pools/components/loans-table';
import { LenderPositionCard } from '@/features/pools/components/lender-position-card';
import { PendingRequestsTable } from '@/features/pools/components/pending-requests-table';
import { MyBacksTable } from '@/features/pools/components/my-backs-table';
import { AnalyticsKpiCards } from '@/features/pools/components/analytics-kpi-cards';
import { AnalyticsCharts } from '@/features/pools/components/analytics-charts';
import { AnalyticsLoanHistory } from '@/features/pools/components/analytics-loan-history';
import { usePoolDetailLogic } from '@/features/pools/hooks/use-pool-detail';
import { MOCK_VALUES } from '@/lib/constants';

export function PoolDetailPage() {
  const {
    pool,
    poolState,
    poolStats,
    isLoading,
    error,
    activePoolTab,
    setActivePoolTab,
    isPoolCreator,
    maxBorrow,
    getStatusBadge,
    formatBalance,
    formatInterestRate,
    formatPoolStateValue,
    formatBasisPoints,
  } = usePoolDetailLogic();

  const statusBadge = getStatusBadge();

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-10 w-10 rounded-lg' />
          <div className='space-y-2'>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-4 w-96' />
          </div>
        </div>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className='h-24 rounded-lg' />
          ))}
        </div>
        <Skeleton className='h-96 w-full rounded-lg' />
      </div>
    );
  }

  if (!poolState || error) {
    return (
      <div className='space-y-6'>
        <Link href='/pools'>
          <Button variant='ghost' size='sm' className='gap-2'>
            <ArrowLeft className='size-4' />
            Back to Pools
          </Button>
        </Link>
        <Card>
          <CardContent className='py-12 text-center space-y-2'>
            <p className='text-slate-600'>
              {error ? 'Error loading pool' : 'Pool not found'}
            </p>
            {error && (
              <p className='text-sm text-red-500'>
                {error.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='space-y-4'>
        <Link href='/pools'>
          <Button variant='ghost' size='sm' className='gap-2'>
            <ArrowLeft className='size-4' />
            Back to Pools
          </Button>
        </Link>

        <div className='flex items-start justify-between'>
          <div>
            <div className='flex items-center gap-3'>
              <h1 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
                {pool?.name ?? 'Lending Pool'}
              </h1>
              {statusBadge && <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
            </div>
            <p className='mt-2 text-lg text-muted-foreground'>
              {pool?.description ?? 'Pool details and configuration'}
            </p>
          </div>
        </div>

        {/* Key Metrics - Pool State */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <TrendingUp className='size-4' />
                <span className='text-sm'>Base Interest Rate</span>
              </div>
              <p className='text-2xl font-bold text-card-foreground'>
                {formatBasisPoints(poolState.baseInterestRate)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <Target className='size-4' />
                <span className='text-sm'>Optimal Utilization</span>
              </div>
              <p className='text-2xl font-bold text-card-foreground'>
                {formatBasisPoints(poolState.optimalUtilization)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <Users className='size-4' />
                <span className='text-sm'>Min Stars to Vouch</span>
              </div>
              <p className='text-2xl font-bold text-card-foreground'>{poolState.minStarsToVouch}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <Zap className='size-4' />
                <span className='text-sm'>Max Rate</span>
              </div>
              <p className='text-2xl font-bold text-card-foreground'>
                {formatBasisPoints(poolState.maxRate)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Pool State Metrics */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <Percent className='size-4' />
                <span className='text-sm'>Slope 1</span>
              </div>
              <p className='text-xl font-bold text-card-foreground'>
                {formatBasisPoints(poolState.slope1)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <Percent className='size-4' />
                <span className='text-sm'>Slope 2</span>
              </div>
              <p className='text-xl font-bold text-card-foreground'>
                {formatBasisPoints(poolState.slope2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <Zap className='size-4' />
                <span className='text-sm'>Boost</span>
              </div>
              <p className='text-xl font-bold text-card-foreground'>
                {formatBasisPoints(poolState.boost)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <Clock className='size-4' />
                <span className='text-sm'>Cooldown Period</span>
              </div>
              <p className='text-xl font-bold text-card-foreground'>
                {Math.floor(Number(poolState.cooldownPeriod) / 86400)}d
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <Shield className='size-4' />
                <span className='text-sm'>Reserve Factor</span>
              </div>
              <p className='text-xl font-bold text-card-foreground'>
                {poolState.reserveFactor}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Exposure Cap */}
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-2 text-muted-foreground mb-2'>
              <DollarSign className='size-4' />
              <span className='text-sm'>Exposure Cap</span>
            </div>
            <p className='text-2xl font-bold text-card-foreground'>
              {formatPoolStateValue(poolState.exposureCap)} tokens
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activePoolTab} onValueChange={(value) => setActivePoolTab(value as typeof activePoolTab)}>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='lend'>Lend</TabsTrigger>
          <TabsTrigger value='borrow'>Borrow</TabsTrigger>
          <TabsTrigger value='history'>History</TabsTrigger>
          {isPoolCreator && <TabsTrigger value='analytics'>Analytics</TabsTrigger>}
        </TabsList>

        {/* Tab Panels */}
        <TabsContent value='overview'>
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Pool overview information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-slate-600'>Overview content will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='lend'>
          {pool && (
            <div className='space-y-6'>
              <LenderPositionCard
                totalBacked={MOCK_VALUES.TOTAL_BACKED_TOKENS}
                activeBacks={MOCK_VALUES.ACTIVE_BACKS}
                defaultedBacks={MOCK_VALUES.DEFAULTED_BACKS}
              />
              <PendingRequestsTable requests={[]} />
              <MyBacksTable backs={[]} />
            </div>
          )}
        </TabsContent>

        <TabsContent value='borrow'>
          {pool && (
            <div className='space-y-6'>
              <div className='grid gap-6 lg:grid-cols-2'>
                <MaxBorrowInfo pool={pool} />
                <BorrowForm pool={pool} maxBorrow={maxBorrow} />
              </div>
              <RequestsTable requests={[]} />
              <LoansTable loans={[]} />
            </div>
          )}
        </TabsContent>

        <TabsContent value='history'>
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>Pool transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-slate-600'>History content will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='analytics'>
          {isPoolCreator && pool && poolStats ? (
            <div className='space-y-6'>
              <AnalyticsKpiCards stats={poolStats} />
              <AnalyticsCharts />
              <AnalyticsLoanHistory loans={[]} isCreator={isPoolCreator} />
            </div>
          ) : (
            <Card>
              <CardContent className='py-12 text-center'>
                <p className='text-slate-600'>Analytics are only available to pool creators.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
