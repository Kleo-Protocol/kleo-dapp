'use client';

import { PoolCard } from './pool-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import type { Pool } from '@/services/mock/pools.mock';

interface PoolsGridProps {
  pools: Pool[];
  isLoading: boolean;
}

export function PoolsGrid({ pools, isLoading }: PoolsGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="flex flex-col">
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
              <Skeleton className="h-10 w-full mt-4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <p className="text-slate-600">No pools found matching your filters.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {pools.map((pool) => (
        <PoolCard key={pool.poolId} pool={pool} />
      ))}
    </div>
  );
}

