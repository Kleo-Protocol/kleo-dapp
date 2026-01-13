'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { formatBalance, formatInterestRate } from '@/shared/utils/format';
import { useTypink } from 'typink';
import { useUserDeposits } from '@/features/pools/hooks/use-lending-pool-data';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Pool } from '@/lib/types';
import { Skeleton } from '@/shared/ui/skeleton';

interface DashboardPoolsProps {
  pools: Pool[];
  isLoading: boolean;
}

export function DashboardPools({ pools, isLoading }: DashboardPoolsProps) {
  const { connectedAccount } = useTypink();
  const { data: userDeposits = 0n } = useUserDeposits(connectedAccount?.address);
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pools.length === 0) {
    return null;
  }

  const featuredPools = pools.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Featured Pools</CardTitle>
            <CardDescription>Top lending pools with available liquidity</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/pools">
              View All
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {featuredPools.map((pool) => {
            const utilizationRate = pool.totalLiquidity > 0n
              ? Number(((pool.totalLiquidity - pool.availableLiquidity) * BigInt(100)) / pool.totalLiquidity)
              : 0;

            return (
              <div
                key={pool.poolId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{pool.name}</h3>
                    {pool.status === 'active' && (
                      <Badge variant="verde" className="bg-forest-green/20 text-forest-green border-forest-green/30">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Interest Rate</p>
                      <p className="font-semibold">{formatInterestRate(pool.baseInterestRate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p className="font-semibold">{formatBalance(userDeposits, 10)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Utilization</p>
                      <p className="font-semibold">{utilizationRate}%</p>
                    </div>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/pools/${pool.poolId}`}>
                    View
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
