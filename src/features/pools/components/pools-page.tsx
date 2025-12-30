'use client';

import { usePools } from '@/features/pools/hooks/use-pools';
import { PoolsFilters } from '@/features/pools/components/pools-filters';
import { PoolsGrid } from '@/features/pools/components/pools-grid';
import { usePoolsFiltering } from '@/features/pools/hooks/use-pools-filtering';

export function PoolsPage() {
  const { data: pools = [], isLoading } = usePools();
  const { statusFilter, setStatusFilter, sortBy, setSortBy, sortedPools } = usePoolsFiltering(pools);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Lending Pools</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Discover and explore available lending pools to start earning returns
        </p>
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

