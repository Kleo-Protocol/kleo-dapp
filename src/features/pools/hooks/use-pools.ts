import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useKleoClient } from '@/providers/kleo-client-provider';
import { useTypink, useContract } from 'typink';
import { ContractId } from '@/contracts/deployments';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import type { Pool, PoolStats } from '@/lib/types';
import type { LoanManagerLoan } from '@/contracts/types/loan-manager/types';
import { usePoolContractData } from './use-pool-contract-data';
import { usePendingLoans, useActiveLoans } from './use-loan-queries';

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
 * Hook to fetch all pools using kleo-sdk and enrich with contract data
 */
export function usePools() {
  const { client, isConnected } = useKleoClient();
  const contractData = usePoolContractData();

  const poolsQuery = useQuery({
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

  // Merge contract data into pools
  const enrichedPools = useMemo(() => {
    if (!poolsQuery.data) {
      return [];
    }

    return poolsQuery.data.map((pool) => ({
      ...pool,
      // Replace with contract data if available
      totalLiquidity: contractData.totalLiquidity,
      availableLiquidity: contractData.availableLiquidity,
      activeLoans: contractData.activeLoansCount,
      baseInterestRate: contractData.currentRateBasisPoints,
    }));
  }, [poolsQuery.data, contractData]);

  return {
    ...poolsQuery,
    data: enrichedPools,
    isLoading: poolsQuery.isLoading || contractData.isLoading,
  };
}

/**
 * Hook to fetch available pools (active with liquidity) using kleo-sdk and enrich with contract data
 */
export function useAvailablePools() {
  const { client, isConnected } = useKleoClient();
  const contractData = usePoolContractData();

  const poolsQuery = useQuery({
    queryKey: poolsKeys.lists.available,
    queryFn: async (): Promise<Pool[]> => {
      if (!client) {
        throw new Error('Kleo client is not connected');
      }
      const pools = await client.getPools();
      return pools.map(transformSdkPool);
    },
    enabled: isConnected && !!client,
    staleTime: 30000, // 30 seconds
  });

  // Merge contract data into pools and filter
  const enrichedPools = useMemo(() => {
    if (!poolsQuery.data) {
      return [];
    }

    return poolsQuery.data
      .map((pool) => ({
        ...pool,
        // Replace with contract data if available
        totalLiquidity: contractData.totalLiquidity,
        availableLiquidity: contractData.availableLiquidity,
        activeLoans: contractData.activeLoansCount,
        baseInterestRate: contractData.currentRateBasisPoints,
      }))
      .filter((pool) => pool.status === 'active' && pool.availableLiquidity > 0n);
  }, [poolsQuery.data, contractData]);

  return {
    ...poolsQuery,
    data: enrichedPools,
    isLoading: poolsQuery.isLoading || contractData.isLoading,
  };
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
      if (!connectedAccount) {
        throw new Error('No connected account');
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
    enabled: !!poolId && isConnected && !!client && !!connectedAccount,
    staleTime: 60000, // 1 minute
    retry: false, // Don't retry on error to see the actual error
  });
}

/**
 * Hook to fetch pool statistics
 * Calculates stats from pool state and loans
 */
export function usePoolStats(poolId: string | undefined) {
  const { data: pools = [] } = usePools();
  const poolContractData = usePoolContractData();
  const { contract } = useContract(ContractId.LOAN_MANAGER);
  const { data: pendingLoans = [] } = usePendingLoans();
  const { data: activeLoans = [] } = useActiveLoans();

  return useQuery({
    queryKey: poolId ? poolsKeys.stats(poolId) : ['pools', 'stats', 'null'],
    queryFn: async () => {
      if (!poolId) {
        throw new Error('Pool ID is required');
      }
      if (!contract) {
        throw new Error('Contract not available');
      }

      // Combine all loan IDs
      const allLoanIds = [...pendingLoans, ...activeLoans].map((id) =>
        typeof id === 'bigint' ? id : BigInt(id)
      );

      // Fetch all loan details
      const loanPromises = allLoanIds.map(async (loanId) => {
        try {
          const result = await contract.query.getLoan(loanId);
          return (result as any).data as LoanManagerLoan | null;
        } catch (error) {
          console.error(`Error fetching loan ${loanId}:`, error);
          return null;
        }
      });

      const loans = (await Promise.all(loanPromises)).filter(
        (loan): loan is LoanManagerLoan => loan !== null
      );

      // Calculate statistics
      const totalLoans = loans.length;
      const activeLoansCount = loans.filter((l) => l.status === 'Active').length;
      const completedLoans = loans.filter((l) => l.status === 'Repaid').length;
      const defaultedLoans = loans.filter((l) => l.status === 'Defaulted').length;

      const totalLent = loans.reduce((sum, loan) => sum + BigInt(loan.amount || 0), 0n);
      
      // For now, totalRepaid is estimated (would need repayment tracking)
      const totalRepaid = loans
        .filter((l) => l.status === 'Repaid')
        .reduce((sum, loan) => {
          // Estimate repayment as amount + interest
          const amount = BigInt(loan.amount || 0);
          const interestRate = BigInt(loan.interestRate || 0);
          const term = BigInt(loan.term || 0);
          const divisor = 365n * 86400n * 10000n;
          const interestAmount = (amount * interestRate * term) / divisor;
          return sum + amount + interestAmount;
        }, 0n);

      const averageLoanAmount =
        totalLoans > 0 ? totalLent / BigInt(totalLoans) : 0n;

      const defaultRate =
        totalLoans > 0 ? (defaultedLoans / totalLoans) * 100 : 0;

      // Get liquidity from pool data or contract data
      const pool = pools.find((p) => p.poolId === poolId);
      const totalLiquidity = pool?.totalLiquidity ?? poolContractData.totalLiquidity ?? 0n;
      const availableLiquidity = pool?.availableLiquidity ?? poolContractData.availableLiquidity ?? 0n;

      return {
        poolId,
        totalLiquidity,
        availableLiquidity,
        totalLoans,
        activeLoans: activeLoansCount,
        completedLoans,
        defaultRate,
        averageLoanAmount,
        totalLent,
        totalRepaid,
      } as PoolStats;
    },
    enabled: !!poolId && !!contract,
    staleTime: QUERY_STALE_TIMES.POOL_STATS,
  });
}

/**
 * Hook to update pool liquidity
 * TODO: Implement with real API/SDK
 */
export function useUpdatePoolLiquidity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      throw new Error('Update pool liquidity not implemented - mock removed');
    },
    onSuccess: () => {
      // Invalidate pool-related queries
      queryClient.invalidateQueries({ queryKey: poolsKeys.lists.all });
      queryClient.invalidateQueries({ queryKey: poolsKeys.lists.available });
    },
  });
}

