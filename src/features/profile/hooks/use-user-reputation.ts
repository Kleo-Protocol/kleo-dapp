import { useQuery } from '@tanstack/react-query';
import { useContract } from 'typink';
import { ContractId } from '@/contracts/deployments';
import type { ReputationUserReputation } from '@/contracts/types/reputation/types';

export function useUserReputation(userAddress: string | undefined) {
  const { contract } = useContract(ContractId.REPUTATION);

  return useQuery({
    queryKey: ['userReputation', userAddress],
    queryFn: async (): Promise<ReputationUserReputation | null> => {
      if (!userAddress || !contract) {
        return null;
      }

      try {
        // Get root storage
        if (!contract.storage) {
          throw new Error('Storage API not available');
        }
        
        const root = await contract.storage.root();
        
        // Access userReps mapping from root storage
        const userReputation = await root.user_reps.get(userAddress);
        
        return userReputation ?? null;
      } catch (error) {
        console.error('Error fetching user reputation:', error);
        return null;
      }
    },
    enabled: !!userAddress && !!contract,
    staleTime: 30000, // 30 seconds
  });
}

