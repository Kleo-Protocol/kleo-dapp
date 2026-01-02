'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { Skeleton } from '@/shared/ui/skeleton';
import { ArrowLeft, TrendingUp, DollarSign, Users, Clock } from 'lucide-react';
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
    poolStats,
    isLoading,
    activePoolTab,
    setActivePoolTab,
    isPoolCreator,
    maxBorrow,
    utilizationRate,
    getStatusBadge,
    formatBalance,
    formatInterestRate,
  } = usePoolDetailLogic();

  const statusBadge = getStatusBadge(pool);

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

  if (!pool) {
    return (
      <div className='space-y-6'>
        <Link href='/pools'>
          <Button variant='ghost' size='sm' className='gap-2'>
            <ArrowLeft className='size-4' />
            Back to Pools
          </Button>
        </Link>
        <Card>
          <CardContent className='py-12 text-center'>
            <p className='text-slate-600'>Pool not found</p>
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
              <h1 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>{pool.name}</h1>
              {statusBadge && <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
            </div>
            <p className='mt-2 text-lg text-muted-foreground'>{pool.description}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <TrendingUp className='size-4' />
                <span className='text-sm'>Interest Rate</span>
              </div>
              <p className='text-2xl font-bold text-card-foreground'>{formatInterestRate(pool.baseInterestRate)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <DollarSign className='size-4' />
                <span className='text-sm'>Available</span>
              </div>
              <p className='text-2xl font-bold text-card-foreground'>{formatBalance(pool.availableLiquidity)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <Users className='size-4' />
                <span className='text-sm'>Min Lenders</span>
              </div>
              <p className='text-2xl font-bold text-card-foreground'>{pool.minLenders}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <Clock className='size-4' />
                <span className='text-sm'>Utilization</span>
              </div>
              <p className='text-2xl font-bold text-card-foreground'>{utilizationRate}%</p>
            </CardContent>
          </Card>
        </div>
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
