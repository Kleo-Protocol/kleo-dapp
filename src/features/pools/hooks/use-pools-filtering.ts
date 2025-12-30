'use client';

import { useState, useMemo } from 'react';
import type { Pool } from '@/services/mock/pools.mock';
import type { SortOption, StatusFilter } from '@/features/pools/components/pools-filters';

export function usePoolsFiltering(pools: Pool[]) {
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

  return {
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortedPools,
  };
}

