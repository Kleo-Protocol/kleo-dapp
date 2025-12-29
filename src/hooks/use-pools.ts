import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllPools,
  getPool,
  getPoolStats,
  getAvailablePools,
  updatePoolLiquidity,
  type Pool,
  type PoolStats,
} from '@/services/mock/pools.mock';

// Query keys
export const poolsKeys = {
  all: ['pools'] as const,
  lists: {
    all: [...poolsKeys.all, 'list'] as const,
    available: [...poolsKeys.all, 'list', 'available'] as const,
  },
  detail: (poolId: string) => [...poolsKeys.all, poolId] as const,
  stats: (poolId: string) => [...poolsKeys.detail(poolId), 'stats'] as const,
};

/**
 * Hook to fetch all pools
 */
export function usePools() {
  return useQuery({
    queryKey: poolsKeys.lists.all,
    queryFn: () => getAllPools(),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to fetch available pools (active with liquidity)
 */
export function useAvailablePools() {
  return useQuery({
    queryKey: poolsKeys.lists.available,
    queryFn: () => getAvailablePools(),
    staleTime: 30000, // 30 seconds
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
    staleTime: 30000, // 30 seconds
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
    staleTime: 60000, // 1 minute
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

