'use client';

import { usePools } from '@/features/pools/hooks/use-pools';
import { PoolsFilters } from '@/features/pools/components/pools-filters';
import { PoolsGrid } from '@/features/pools/components/pools-grid';
import { usePoolsFiltering } from '@/features/pools/hooks/use-pools-filtering';
import { useKleoClient } from '@/providers/kleo-client-provider';

export function PoolsPage() {
  const { isConnected, isConnecting, error } = useKleoClient();
  const { data: pools = [], isLoading: isPoolsLoading, error: poolsError } = usePools();
  const { statusFilter, setStatusFilter, sortBy, setSortBy, sortedPools } = usePoolsFiltering(pools);

  // Show loading while SDK is connecting or pools are loading
  const isLoading = isConnecting || !isConnected || isPoolsLoading;

  // Debug: log connection state
  console.log('Kleo SDK state:', { isConnected, isConnecting, error, poolsCount: pools.length, poolsError });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Lending Pools</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Discover and explore available lending pools to start earning returns
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-500">
            Connection error: {error.message}
          </p>
        )}
      </div>

      <PoolsFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div>
        {!isLoading && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {sortedPools.length} {sortedPools.length === 1 ? 'pool' : 'pools'} found
            </p>
          </div>
        )}
        <PoolsGrid pools={sortedPools} isLoading={isLoading} />
      </div>
    </div>
  );
}

