import { useQuery } from '@tanstack/react-query';
import { useContract } from 'typink';
import { ContractId } from '@/contracts/deployments';
import type { AccountId32 } from 'dedot/codecs';

/**
 * Hook to query user's star count from the reputation contract
 * @param userAddress - User's account address (AccountId)
 * @returns Number of stars the user has
 */
export function useStars(userAddress: string | undefined) {
  const { contract } = useContract(ContractId.REPUTATION);

  return useQuery({
    queryKey: ['reputation', 'stars', userAddress],
    queryFn: async (): Promise<number> => {
      if (!userAddress || !contract) {
        return 0;
      }

      try {
        const result = await contract.query.getStars(userAddress);
        const stars = (result as any).data;
        
        return typeof stars === 'number' ? stars : 0;
      } catch (error) {
        console.error('Error fetching stars:', error);
        return 0;
      }
    },
    enabled: !!userAddress && !!contract,
    staleTime: 30000,
  });
}

/**
 * Hook to check if a user can vouch for others
 * Checks if user has minimum stars required to vouch
 * @param userAddress - User's account address (AccountId)
 * @returns Boolean indicating if user can vouch
 */
export function useCanVouch(userAddress: string | undefined) {
  const { contract } = useContract(ContractId.REPUTATION);

  return useQuery({
    queryKey: ['reputation', 'canVouch', userAddress],
    queryFn: async (): Promise<boolean> => {
      if (!userAddress || !contract) {
        return false;
      }

      try {
        const result = await contract.query.canVouch(userAddress);
        const canVouch = (result as any).data;
        
        return typeof canVouch === 'boolean' ? canVouch : false;
      } catch (error) {
        console.error('Error checking if user can vouch:', error);
        return false;
      }
    },
    enabled: !!userAddress && !!contract,
    staleTime: 30000,
  });
}

/**
 * Hook to query the admin address of the reputation contract
 * Useful for verification purposes
 * @returns Admin account address (AccountId32)
 */
export function useReputationAdmin() {
  const { contract } = useContract(ContractId.REPUTATION);

  return useQuery({
    queryKey: ['reputation', 'admin'],
    queryFn: async (): Promise<AccountId32 | null> => {
      if (!contract) {
        return null;
      }

      try {
        const result = await contract.query.getAdmin();
        const admin = (result as any).data;
        
        return admin ?? null;
      } catch (error) {
        console.error('Error fetching reputation admin:', error);
        return null;
      }
    },
    enabled: !!contract,
    staleTime: 300000, // 5 minutes (admin doesn't change often)
  });
}

