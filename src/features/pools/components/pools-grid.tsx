'use client';

import { PoolCard } from './pool-card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card } from '@/shared/ui/card';
import { EmptyState } from '@/shared/components/empty-state';
import { Building2 } from 'lucide-react';
import type { Pool } from '@/lib/types';

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
      <EmptyState
        icon={<Building2 className="size-12" />}
        title="No Pools Found"
        description="No pools match your current filters. Try adjusting your search criteria."
      />
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

