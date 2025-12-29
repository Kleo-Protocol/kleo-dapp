'use client';

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePoolDetail } from '@/hooks/use-pools';
import { useUiStore } from '@/store/ui.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, TrendingUp, DollarSign, Users, Clock } from 'lucide-react';
import { DepositForm } from '@/components/pools/deposit-form';
import { ApyPreview } from '@/components/pools/apy-preview';
import { MyDepositsTable } from '@/components/pools/my-deposits-table';

export function PoolDetailPage() {
  const { poolId } = useParams<{ poolId: string }>();
  const { data: pool, isLoading } = usePoolDetail(poolId);
  const { activePoolTab, setActivePoolTab } = useUiStore();
  const [depositAmount, setDepositAmount] = useState(0);

  const formatBalance = (balance: bigint) => {
    const tokens = Number(balance) / 1e18;
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const formatInterestRate = (rate: bigint) => {
    const percentage = Number(rate) / 100;
    return `${percentage.toFixed(2)}%`;
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
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
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
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {pool.name}
              </h1>
              {getStatusBadge()}
            </div>
            <p className="mt-2 text-lg text-slate-600">{pool.description}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <TrendingUp className="size-4" />
                <span className="text-sm">Interest Rate</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatInterestRate(pool.baseInterestRate)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <DollarSign className="size-4" />
                <span className="text-sm">Available</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatBalance(pool.availableLiquidity)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <Users className="size-4" />
                <span className="text-sm">Min Lenders</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{pool.minLenders}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <Clock className="size-4" />
                <span className="text-sm">Utilization</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{utilizationRate}%</p>
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
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <DepositForm pool={pool} onAmountChange={setDepositAmount} />
              <ApyPreview pool={pool} depositAmount={depositAmount} />
            </div>
            <MyDepositsTable />
          </div>
        </TabsContent>

        <TabsContent value="borrow">
          <Card>
            <CardHeader>
              <CardTitle>Borrow</CardTitle>
              <CardDescription>Borrowing options and information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Borrowing content will be displayed here.</p>
            </CardContent>
          </Card>
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
      </Tabs>
    </div>
  );
}

