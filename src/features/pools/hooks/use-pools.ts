import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllPools,
  getPool,
  getPoolStats,
  getAvailablePools,
  updatePoolLiquidity,
} from '@/services/mock/pools.mock';
import { QUERY_STALE_TIMES } from '@/lib/constants';

// Query keys
const poolsBaseKey = ['pools'] as const;

export const poolsKeys = {
  all: poolsBaseKey,
  lists: {
    all: [...poolsBaseKey, 'list'] as const,
    available: [...poolsBaseKey, 'list', 'available'] as const,
  },
  detail: (poolId: string) => [...poolsBaseKey, poolId] as const,
  stats: (poolId: string) => [...poolsBaseKey, poolId, 'stats'] as const,
};

/**
 * Hook to fetch all pools
 */
export function usePools() {
  return useQuery({
    queryKey: poolsKeys.lists.all,
    queryFn: () => getAllPools(),
    staleTime: QUERY_STALE_TIMES.POOLS_LIST,
  });
}

/**
 * Hook to fetch available pools (active with liquidity)
 */
export function useAvailablePools() {
  return useQuery({
    queryKey: poolsKeys.lists.available,
    queryFn: () => getAvailablePools(),
    staleTime: QUERY_STALE_TIMES.POOLS_AVAILABLE,
  });
}

/**
 * Hook to fetch pool details by ID
 */
export function usePoolDetail(poolId: string | undefined) {
  return useQuery({
    queryKey: poolId ? poolsKeys.detail(poolId) : ['pools', 'null'],
    queryFn: () => {
      if (!poolId) {
        throw new Error('Pool ID is required');
      }
      return getPool(poolId);
    },
    enabled: !!poolId,
    staleTime: QUERY_STALE_TIMES.POOL_DETAIL,
  });
}

/**
 * Hook to fetch pool statistics
 */
export function usePoolStats(poolId: string | undefined) {
  return useQuery({
    queryKey: poolId ? poolsKeys.stats(poolId) : ['pools', 'stats', 'null'],
    queryFn: () => {
      if (!poolId) {
        throw new Error('Pool ID is required');
      }
      return getPoolStats(poolId);
    },
    enabled: !!poolId,
    staleTime: QUERY_STALE_TIMES.POOL_STATS,
  });
}

/**
 * Hook to update pool liquidity
 */
export function useUpdatePoolLiquidity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ poolId, liquidityDelta }: { poolId: string; liquidityDelta: bigint }) =>
      updatePoolLiquidity(poolId, liquidityDelta),
    onSuccess: (_, variables) => {
      // Invalidate pool-related queries
      queryClient.invalidateQueries({ queryKey: poolsKeys.detail(variables.poolId) });
      queryClient.invalidateQueries({ queryKey: poolsKeys.stats(variables.poolId) });
      queryClient.invalidateQueries({ queryKey: poolsKeys.lists.all });
      queryClient.invalidateQueries({ queryKey: poolsKeys.lists.available });
    },
  });
}

