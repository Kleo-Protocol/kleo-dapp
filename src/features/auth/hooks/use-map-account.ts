'use client';

import { useState } from 'react';
import { txToaster, useTypink, checkBalanceSufficiency } from 'typink';

export function useMapAccount(onSuccess?: () => void) {
  const { client, connectedAccount } = useTypink();
  const [isLoading, setIsLoading] = useState(false);

  const handleMapAccount = async () => {
    const toaster = txToaster();
    try {
      setIsLoading(true);

      if (!client || !connectedAccount) {
        throw new Error('No connected account or client available');
      }

      await checkBalanceSufficiency(client, connectedAccount.address);

      await client.tx.revive
        .mapAccount()
        .signAndSend(connectedAccount.address, (progress) => {
          toaster.onTxProgress(progress);

          if (progress.status.type === 'BestChainBlockIncluded' || progress.status.type === 'Finalized') {
            onSuccess?.();
          }
        })
        .untilFinalized();
    } catch (error: unknown) {
      console.error('Error mapping account:', error);
      toaster.onTxError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isDisabled: !connectedAccount || isLoading,
    handleMapAccount,
  };
}
