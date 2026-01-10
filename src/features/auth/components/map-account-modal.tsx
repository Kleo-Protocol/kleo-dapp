'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCheckMappedAccount, useTypink } from 'typink';
import { useMapAccount } from '@/features/auth/hooks/use-map-account';
import { useEffect, useState } from 'react';

export function MapAccountModal() {
  const { connectedAccount } = useTypink();
  const { isMapped, isLoading: isChecking, refresh } = useCheckMappedAccount();
  const [showModal, setShowModal] = useState(false);

  const handleMappingSuccess = async () => {
    await refresh();
    // Modal will close automatically when isMapped becomes true
  };

  const { isLoading: isMappingInProgress, handleMapAccount } = useMapAccount(handleMappingSuccess);

  // Show modal when account is not mapped and checking is complete
  useEffect(() => {
    if (connectedAccount && !isChecking) {
      if (isMapped === false) {
        setShowModal(true);
      } else if (isMapped === true) {
        setShowModal(false);
      }
    } else {
      setShowModal(false);
    }
  }, [isMapped, isChecking, connectedAccount]);

  // Don't render if no connected account, still checking, or if mapped
  if (!connectedAccount || isChecking || isMapped !== false) {
    return null;
  }

  const handleMapClick = async () => {
    try {
      await handleMapAccount();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={(open) => !isMappingInProgress && setShowModal(open)}>
      <DialogContent showCloseButton={!isMappingInProgress} className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertCircle className='h-5 w-5 text-amber-honey' />
            Account Mapping Required
          </DialogTitle>
          <DialogDescription>
            Your Polkadot account (AccountId32) needs to be mapped to interact with ink! v6 contracts on this network.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='rounded-lg border border-amber-honey/20 bg-amber-honey/10 p-4'>
            <p className='text-sm text-foreground'>
              This one-time operation will map your AccountId32 address to enable contract interactions. You only need to do this once per account.
            </p>
          </div>

          {isMappingInProgress && (
            <div className='flex items-center gap-2 rounded-lg border border-forest-green/20 bg-forest-green/10 p-4'>
              <Loader2 className='h-4 w-4 animate-spin text-forest-green' />
              <p className='text-sm text-foreground'>
                Mapping your account... Please confirm the transaction in your wallet.
              </p>
            </div>
          )}
        </div>

        <div className='flex flex-col gap-3'>
          <Button
            onClick={handleMapClick}
            disabled={isMappingInProgress}
            size='lg'
            className='w-full'
            variant='primary'>
            {isMappingInProgress ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Mapping Account...
              </>
            ) : (
              <>
                <CheckCircle2 className='mr-2 h-4 w-4' />
                Map Account
              </>
            )}
          </Button>
        </div>

        <p className='text-xs text-center text-muted-foreground'>
          This transaction requires a small amount of network fees
        </p>
      </DialogContent>
    </Dialog>
  );
}
