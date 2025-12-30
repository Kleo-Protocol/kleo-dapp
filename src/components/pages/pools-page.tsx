'use client';

import { useState, useMemo } from 'react';
import { usePools } from '@/hooks/use-pools';
import { PoolsFilters, type SortOption, type StatusFilter } from '@/components/pools/pools-filters';
import { PoolsGrid } from '@/components/pools/pools-grid';
import type { Pool } from '@/services/mock/pools.mock';

export function PoolsPage() {
  const { data: pools = [], isLoading } = usePools();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Filter pools by status
  const filteredPools = useMemo(() => {
    let filtered = pools;
    
    if (statusFilter !== 'all') {
      filtered = pools.filter((pool) => pool.status === statusFilter);
    }

    return filtered;
  }, [pools, statusFilter]);

  // Sort pools client-side
  const sortedPools = useMemo(() => {
    const sorted = [...filteredPools];

    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'interestRate':
        sorted.sort((a, b) => {
          const rateA = Number(a.baseInterestRate);
          const rateB = Number(b.baseInterestRate);
          return rateB - rateA; // Descending (highest first)
        });
        break;
      case 'availableLiquidity':
        sorted.sort((a, b) => {
          const liquidityA = Number(a.availableLiquidity);
          const liquidityB = Number(b.availableLiquidity);
          return liquidityB - liquidityA; // Descending (highest first)
        });
        break;
      case 'totalLiquidity':
        sorted.sort((a, b) => {
          const liquidityA = Number(a.totalLiquidity);
          const liquidityB = Number(b.totalLiquidity);
          return liquidityB - liquidityA; // Descending (highest first)
        });
        break;
      case 'activeLoans':
        sorted.sort((a, b) => b.activeLoans - a.activeLoans); // Descending (highest first)
        break;
      default:
        break;
    }

    return sorted;
  }, [filteredPools, sortBy]);

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

