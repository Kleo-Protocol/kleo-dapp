'use client';

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePoolDetail } from '@/hooks/use-pools';
import { useUiStore } from '@/store/ui.store';
import { useUserStore } from '@/store/user.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, TrendingUp, DollarSign, Users, Clock } from 'lucide-react';
import { DepositForm } from '@/components/pools/deposit-form';
import { ApyPreview } from '@/components/pools/apy-preview';
import { MyDepositsTable } from '@/components/pools/my-deposits-table';
import { MaxBorrowInfo } from '@/components/pools/max-borrow-info';
import { BorrowForm } from '@/components/pools/borrow-form';
import { RequestsTable } from '@/components/pools/requests-table';
import { LoansTable } from '@/components/pools/loans-table';
import { LenderPositionCard } from '@/components/pools/lender-position-card';
import { PendingRequestsTable } from '@/components/pools/pending-requests-table';
import { MyBacksTable } from '@/components/pools/my-backs-table';
import { AnalyticsKpiCards } from '@/components/pools/analytics-kpi-cards';
import { AnalyticsCharts } from '@/components/pools/analytics-charts';
import { AnalyticsLoanHistory } from '@/components/pools/analytics-loan-history';
import { usePoolStats } from '@/hooks/use-pools';
import { formatBalance, formatInterestRate } from '@/utils/format';
import type { Pool } from '@/services/mock/pools.mock';

export function PoolDetailPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const { data: pool, isLoading } = usePoolDetail(poolId);
  const { data: poolStats } = usePoolStats(poolId);
  const { activePoolTab, setActivePoolTab } = useUiStore();
  const { reputation, tier } = useUserStore();
  const [depositAmount, setDepositAmount] = useState(0);

  // Mock: Check if user is pool creator (in real app, this would come from backend)
  const isPoolCreator = true; // Mock: always true for demo

  // Calculate max borrow based on user's reputation and tier
  const calculateMaxBorrow = (pool: Pool) => {
    const baseMultiplier = tier === 'verde' ? 10 : tier === 'amarillo' ? 5 : 2;
    const reputationMultiplier = Math.floor(reputation / 100);
    const maxBorrow = baseMultiplier * reputationMultiplier * 1000;
    const poolAvailable = Number(pool.availableLiquidity) / 1e18;
    return Math.min(maxBorrow, poolAvailable);
  };

  const getStatusBadge = () => {
    if (!pool) return null;
    switch (pool.status) {
      case 'active':
        return <Badge variant="verde">Active</Badge>;
      case 'paused':
        return <Badge variant="amarillo">Paused</Badge>;
      case 'closed':
        return <Badge variant="rojo">Closed</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="space-y-6">
        <Link to="/pools">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Pools
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">Pool not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const utilizationRate = pool.totalLiquidity > 0n
    ? Number((pool.totalLiquidity - pool.availableLiquidity) * BigInt(100) / pool.totalLiquidity)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link to="/pools">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Pools
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {pool.name}
              </h1>
              {getStatusBadge()}
            </div>
            <p className="mt-2 text-lg text-muted-foreground">{pool.description}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="size-4" />
                <span className="text-sm">Interest Rate</span>
              </div>
              <p className="text-2xl font-bold text-card-foreground">{formatInterestRate(pool.baseInterestRate)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="size-4" />
                <span className="text-sm">Available</span>
              </div>
              <p className="text-2xl font-bold text-card-foreground">{formatBalance(pool.availableLiquidity)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="size-4" />
                <span className="text-sm">Min Lenders</span>
              </div>
              <p className="text-2xl font-bold text-card-foreground">{pool.minLenders}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="size-4" />
                <span className="text-sm">Utilization</span>
              </div>
              <p className="text-2xl font-bold text-card-foreground">{utilizationRate}%</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activePoolTab} onValueChange={(value) => setActivePoolTab(value as typeof activePoolTab)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lend">Lend</TabsTrigger>
          <TabsTrigger value="borrow">Borrow</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          {isPoolCreator && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>

        {/* Tab Panels */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Pool overview information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Overview content will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lend">
          {pool && (
            <div className="space-y-6">
              <LenderPositionCard
                totalBacked={BigInt(4500000000000000000)} // Mock: 4.5 tokens
                activeBacks={2}
                defaultedBacks={0}
              />
              <PendingRequestsTable />
              <MyBacksTable />
            </div>
          )}
        </TabsContent>

        <TabsContent value="borrow">
          {pool && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <MaxBorrowInfo pool={pool} />
                <BorrowForm pool={pool} maxBorrow={calculateMaxBorrow(pool)} />
              </div>
              <RequestsTable />
              <LoansTable />
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>Pool transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">History content will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          {isPoolCreator && pool && poolStats ? (
            <div className="space-y-6">
              <AnalyticsKpiCards stats={poolStats} />
              <AnalyticsCharts />
              <AnalyticsLoanHistory isCreator={isPoolCreator} />
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-600">Analytics are only available to pool creators.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

