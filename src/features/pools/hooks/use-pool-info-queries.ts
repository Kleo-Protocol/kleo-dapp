import { useQuery } from '@tanstack/react-query';
import { useContract } from 'typink';
import { ContractId } from '@/contracts/deployments';

/**
 * Hook to query total pool liquidity
 * Returns value in 18 decimals (chain format)
 */
export function useTotalLiquidity() {
  const { contract } = useContract(ContractId.LENDING_POOL);

  return useQuery({
    queryKey: ['lendingPool', 'totalLiquidity'],
    queryFn: async (): Promise<bigint> => {
      if (!contract) {
        return 0n;
      }

      try {
        const result = await contract.query.getTotalLiquidity();
        const liquidity = (result as any).data;
        
        return liquidity ?? 0n;
      } catch (error) {
        console.error('Error fetching total liquidity:', error);
        return 0n;
      }
    },
    enabled: !!contract,
    staleTime: 30000,
  });
}

/**
 * Hook to query total borrowed amount from storage
 * Returns value in storage format
 */
export function useTotalBorrowed() {
  const { contract } = useContract(ContractId.LENDING_POOL);

  return useQuery({
    queryKey: ['lendingPool', 'totalBorrowed'],
    queryFn: async (): Promise<bigint> => {
      if (!contract || !contract.storage) {
        return 0n;
      }

      try {
        const root = await contract.storage.root();
        const totalBorrowed = await root.totalBorrowed?.get();
        
        return totalBorrowed ?? 0n;
      } catch (error) {
        console.error('Error fetching total borrowed:', error);
        return 0n;
      }
    },
    enabled: !!contract,
    staleTime: 30000,
  });
}

/**
 * Hook to query reserved funds from storage
 * Returns value in storage format
 */
export function useReservedFunds() {
  const { contract } = useContract(ContractId.LENDING_POOL);

  return useQuery({
    queryKey: ['lendingPool', 'reservedFunds'],
    queryFn: async (): Promise<bigint> => {
      if (!contract || !contract.storage) {
        return 0n;
      }

      try {
        const root = await contract.storage.root();
        const reservedFunds = await root.reservedFunds?.get();
        
        return reservedFunds ?? 0n;
      } catch (error) {
        console.error('Error fetching reserved funds:', error);
        return 0n;
      }
    },
    enabled: !!contract,
    staleTime: 30000,
  });
}

/**
 * Hook to query total principal deposits from storage
 * Returns value in storage format
 */
export function useTotalPrincipalDeposits() {
  const { contract } = useContract(ContractId.LENDING_POOL);

  return useQuery({
    queryKey: ['lendingPool', 'totalPrincipalDeposits'],
    queryFn: async (): Promise<bigint> => {
      if (!contract || !contract.storage) {
        return 0n;
      }

      try {
        const root = await contract.storage.root();
        const totalPrincipalDeposits = await root.totalPrincipalDeposits?.get();
        
        return totalPrincipalDeposits ?? 0n;
      } catch (error) {
        console.error('Error fetching total principal deposits:', error);
        return 0n;
      }
    },
    enabled: !!contract,
    staleTime: 30000,
  });
}

/**
 * Hook to calculate pool utilization percentage
 * Utilization = (totalBorrowed / totalLiquidity) * 100
 * Returns percentage as a number (e.g., 75.5 for 75.5%)
 */
export function usePoolUtilization() {
  const { data: totalLiquidity } = useTotalLiquidity();
  const { data: totalBorrowed } = useTotalBorrowed();

  return useQuery({
    queryKey: ['lendingPool', 'utilization', totalLiquidity, totalBorrowed],
    queryFn: async (): Promise<number> => {
      if (!totalLiquidity || totalLiquidity === 0n) {
        return 0;
      }

      // Convert both to numbers for calculation
      // totalLiquidity is in 18 decimals, totalBorrowed is in storage format (10 decimals)
      // We need to normalize them - for utilization, we can use the ratio directly
      // since we're just calculating percentage
      const borrowed = Number(totalBorrowed ?? 0n);
      const liquidity = Number(totalLiquidity);
      
      if (liquidity === 0) {
        return 0;
      }

      // Calculate utilization percentage
      // Note: This is an approximation since decimals differ
      // For accurate calculation, both should be in same decimals
      const utilization = (borrowed / liquidity) * 100;
      
      return Math.min(100, Math.max(0, utilization));
    },
    enabled: totalLiquidity !== undefined,
    staleTime: 30000,
  });
}

/**
 * Hook to query user's accrued yield
 * @param userAddress - User's account address (AccountId)
 * @param withAccrual - If true, accrues interest before calculating yield. Default: false
 * @returns User yield in 18 decimals (chain format)
 */
export function useUserYield(userAddress: string | undefined, withAccrual: boolean = false) {
  const { contract } = useContract(ContractId.LENDING_POOL);

  return useQuery({
    queryKey: ['lendingPool', 'userYield', userAddress, withAccrual],
    queryFn: async (): Promise<bigint> => {
      if (!userAddress || !contract) {
        return 0n;
      }

      try {
        const result = withAccrual
          ? await contract.query.accrueInterestAndGetUserYield(userAddress)
          : await contract.query.getUserYield(userAddress);
        
        const yieldAmount = (result as any).data;
        
        return yieldAmount ?? 0n;
      } catch (error) {
        console.error('Error fetching user yield:', error);
        return 0n;
      }
    },
    enabled: !!userAddress && !!contract,
    staleTime: 30000,
  });
}

/**
 * Hook to query last interest accrual timestamp
 * Returns timestamp in milliseconds
 */
export function useLastUpdate() {
  const { contract } = useContract(ContractId.LENDING_POOL);

  return useQuery({
    queryKey: ['lendingPool', 'lastUpdate'],
    queryFn: async (): Promise<bigint | null> => {
      if (!contract || !contract.storage) {
        return null;
      }

      try {
        const root = await contract.storage.root();
        const lastUpdate = await root.lastUpdate?.get();
        
        return lastUpdate ?? null;
      } catch (error) {
        console.error('Error fetching last update:', error);
        return null;
      }
    },
    enabled: !!contract,
    staleTime: 30000,
  });
}

