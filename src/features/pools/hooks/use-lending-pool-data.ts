import { useQuery } from '@tanstack/react-query';
import { useContract, useTypink } from 'typink';
import { ContractId } from '@/contracts/deployments';

/**
 * Hook to fetch the current interest rate from the lending pool contract
 */
export function useCurrentRate() {
  const { contract } = useContract(ContractId.LENDING_POOL);
  const { network } = useTypink();
  const decimals = network?.decimals ?? 12;

  return useQuery({
    queryKey: ['lendingPool', 'currentRate'],
    queryFn: async (): Promise<number | null> => {
      if (!contract) {
        return null;
      }

      try {
        const rateResult = await contract.query.getCurrentRate();
        
        // GenericContractCallResult has a 'data' property with the actual value
        // The result structure is: { data: bigint, ... }
        const rateValue = (rateResult as any).data;
        
        if (rateValue === undefined || rateValue === null) {
          console.error('Rate value is undefined. Result keys:', Object.keys(rateResult));
          return null;
        }

        // Rate is returned as u64 (bigint in JS)
        // According to the contract code, get_current_rate() returns a u64
        // The rate calculation uses config values (base_interest_rate, slope1, slope2, max_rate)
        // These config values are stored with precision (typically divided by 100000 to get percentage)
        // The returned rate is in the same format - a number that needs to be divided by 100000
        // to get the actual percentage (e.g., 500 = 0.5%, 5000 = 5%)
        const rateNumber = typeof rateValue === 'bigint' ? Number(rateValue) : Number(rateValue);
        
        // Convert to decimal percentage - dividing by 100000 to match the precision format
        // This gives us a decimal (e.g., 0.05 = 5%, 0.5 = 50%)
        const percentage = rateNumber / 100000;
        
        return percentage;
      } catch (error) {
        console.error('Error fetching current rate:', error);
        return null;
      }
    },
    enabled: !!contract,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch user's deposit balance from the lending pool contract
 */
export function useUserDeposits(userAddress: string | undefined) {
  const { contract } = useContract(ContractId.LENDING_POOL);
  const { network } = useTypink();
  const decimals = network?.decimals ?? 12;

  return useQuery({
    queryKey: ['lendingPool', 'userDeposits', userAddress],
    queryFn: async (): Promise<bigint> => {
      if (!userAddress || !contract) {
        return 0n;
      }

      try {
        // Access storage to get user deposits
        if (!contract.storage) {
          throw new Error('Storage API not available');
        }
        
        const root = await contract.storage.root();
        
        // Debug: Log all available storage keys to verify the structure
        const storageKeys = Object.keys(root);
        console.log('Available storage keys:', storageKeys);
        
        // Access userDeposits mapping from root storage
        // Try both camelCase (from TypeScript types) and snake_case (from contract)
        // The reputation hook uses snake_case (user_reps), so let's try that first
        const userDepositsMapping = (root as any).user_deposits || root.userDeposits;
        
        if (!userDepositsMapping) {
          console.error('userDeposits mapping not found in storage root.');
          console.error('Available keys:', storageKeys);
          console.error('Root object keys:', Object.keys(root));
          // Try to log the root object structure (without BigInt serialization issues)
          console.error('Root object structure:', {
            keys: Object.keys(root),
            hasUserDeposits: 'userDeposits' in root,
            hasUser_deposits: 'user_deposits' in root,
          });
          return 0n;
        }
        
        // Verify the mapping has a get method
        if (typeof userDepositsMapping.get !== 'function') {
          console.error('userDeposits.get is not a function. Type:', typeof userDepositsMapping.get);
          console.error('userDeposits object:', userDepositsMapping);
          return 0n;
        }
        
        console.log('Fetching deposit for address:', userAddress);
        const userDeposit = await userDepositsMapping.get(userAddress);
        
        console.log('User deposit fetched:', {
          userAddress,
          deposit: userDeposit,
          depositType: typeof userDeposit,
          isUndefined: userDeposit === undefined,
          isNull: userDeposit === null,
          depositString: userDeposit?.toString(),
        });
        
        // If undefined, it means the user has no deposits (this is normal for new users)
        // This is NOT a contract issue - it's expected behavior when a user hasn't deposited yet
        // Return 0n instead of undefined to maintain type consistency
        if (userDeposit === undefined) {
          console.log('No deposits found for this address (this is normal if user has not deposited yet)');
        }
        
        return userDeposit ?? 0n;
      } catch (error) {
        console.error('Error fetching user deposits:', error);
        return 0n;
      }
    },
    enabled: !!userAddress && !!contract,
    staleTime: 30000,
  });
}
