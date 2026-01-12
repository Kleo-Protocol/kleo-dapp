'use client';

import { useCallback } from 'react';
import { useContract, useTypink, txToaster, checkBalanceSufficiency } from 'typink';
import { useQueryClient } from '@tanstack/react-query';
import { ContractId } from '@/contracts/deployments';
import { toast } from 'sonner';

/**
 * Hook to bootstrap stars for test accounts (admin function)
 * TEMPORARY - Only used in flow-testing page
 * @returns Function to set stars for a user account
 */
export function useBootstrapStars() {
  const { contract } = useContract(ContractId.REPUTATION);
  const { client, connectedAccount } = useTypink();
  const queryClient = useQueryClient();

  const setStars = useCallback(
    async (userAddress: string, stars: number) => {
      if (!contract || !connectedAccount || !client) {
        throw new Error('Wallet not connected or contract not available');
      }

      const toaster = txToaster();

      try {
        // Check balance sufficiency (for transaction fees)
        await checkBalanceSufficiency(client, connectedAccount.address);

        // Execute admin_set_stars transaction
        await contract.tx
          .adminSetStars(userAddress, stars)
          .signAndSend(connectedAccount.address, (progress) => {
            toaster.onTxProgress(progress);

            if (progress.status.type === 'BestChainBlockIncluded' || progress.status.type === 'Finalized') {
              // Invalidate reputation queries
              queryClient.invalidateQueries({ queryKey: ['reputation', 'stars', userAddress] });
              queryClient.invalidateQueries({ queryKey: ['userReputation', userAddress] });
              
              toast.success(`Set ${stars} stars for ${userAddress}`);
            }
          })
          .untilFinalized();
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error setting stars:', err);
        toaster.onTxError(err);
        throw err;
      }
    },
    [contract, connectedAccount, client, queryClient]
  );

  return { setStars };
}

