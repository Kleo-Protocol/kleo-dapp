import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useKleoClient } from '@/providers/kleo-client-provider';
import {
  getPoolStats,
  updatePoolLiquidity,
  type Pool,
  type PoolStats,
} from '@/services/mock/pools.mock';
import { useTypink } from 'typink';

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
  state: (poolId: string) => [...poolsBaseKey, poolId, 'state'] as const,
};

/**
 * Transform SDK pool data to our Pool interface
 */
function transformSdkPool(sdkPool: any): Pool {
  return {
    poolId: sdkPool.id ?? sdkPool.pool_id ?? '',
    name: sdkPool.name ?? 'Unnamed Pool',
    description: sdkPool.description ?? '',
    totalLiquidity: BigInt(sdkPool.total_liquidity ?? sdkPool.totalLiquidity ?? 0),
    availableLiquidity: BigInt(sdkPool.available_liquidity ?? sdkPool.availableLiquidity ?? 0),
    totalLoans: Number(sdkPool.total_loans ?? sdkPool.totalLoans ?? 0),
    activeLoans: Number(sdkPool.active_loans ?? sdkPool.activeLoans ?? 0),
    baseInterestRate: BigInt(sdkPool.base_interest_rate ?? sdkPool.baseInterestRate ?? 0),
    minLenders: Number(sdkPool.min_lenders ?? sdkPool.minLenders ?? 1),
    overfundingFactor: BigInt(sdkPool.overfunding_factor ?? sdkPool.overfundingFactor ?? 10000),
    createdAt: Number(sdkPool.created_at ?? sdkPool.createdAt ?? Date.now()),
    status: (sdkPool.status ?? 'active') as 'active' | 'paused' | 'closed',
  };
}

/**
 * Hook to fetch all pools using kleo-sdk
 */
export function usePools() {
  const { client, isConnected } = useKleoClient();

  return useQuery({
    queryKey: poolsKeys.lists.all,
    queryFn: async (): Promise<Pool[]> => {
      if (!client) {
        throw new Error('Kleo client is not connected');
      }
      const pools = await client.getPools();
      return pools.map(transformSdkPool);
    },
    enabled: isConnected && !!client,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to fetch available pools (active with liquidity) using kleo-sdk
 */
export function useAvailablePools() {
  const { client, isConnected } = useKleoClient();

  return useQuery({
    queryKey: poolsKeys.lists.available,
    queryFn: async (): Promise<Pool[]> => {
      if (!client) {
        throw new Error('Kleo client is not connected');
      }
      const pools = await client.getPools();
      // Filter for active pools with available liquidity
      return pools
        .map(transformSdkPool)
        .filter((pool) => pool.status === 'active' && pool.availableLiquidity > 0n);
    },
    enabled: isConnected && !!client,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch pool state from the contract using kleo-sdk
 */
export function usePoolState(poolId: string | undefined) {
  const { client, isConnected } = useKleoClient();
  const { connectedAccount } = useTypink();

  return useQuery({
    queryKey: poolId ? poolsKeys.state(poolId) : ['pools', 'state', 'null'],
    queryFn: async () => {
      if (!poolId) {
        throw new Error('Pool ID is required');
      }
      if (!client) {
        throw new Error('Kleo client is not connected');
      }
      console.log('Fetching pool state for poolId:', poolId);
      try {
        const result = await client.getPoolState(poolId, connectedAccount.address);
        console.log('Pool state result:', result);
        return result;
      } catch (error) {
        console.error('Error fetching pool state:', error);
        throw error;
      }
    },
    enabled: !!poolId && isConnected && !!client,
    staleTime: 60000, // 1 minute
    retry: false, // Don't retry on error to see the actual error
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
      queryClient.invalidateQueries({ queryKey: poolsKeys.state(variables.poolId) });
      queryClient.invalidateQueries({ queryKey: poolsKeys.lists.all });
      queryClient.invalidateQueries({ queryKey: poolsKeys.lists.available });
    },
  });
}

