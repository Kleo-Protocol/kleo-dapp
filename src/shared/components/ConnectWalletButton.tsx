'use client';

import { useAuthStore } from '@/store/authStore';
import { connectWallet, disconnectWallet } from '@/services/polkadotAuth';
import { Button } from '@/shared/ui/button';
import { useState } from 'react';

function formatAddress(address: string): string {
  if (address.length <= 10) {
    return address;
  }
  return `${address.slice(0, 3)}…${address.slice(-3)}`;
}

export function ConnectWalletButton() {
  const { status, error, selectedAddress } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    if (isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);

      if (status === 'idle' || status === 'error') {
        await connectWallet();
      } else if (status === 'connected') {
        disconnectWallet();
      }
    } catch {
      // Error is already handled in the store
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = (): string => {
    if (status === 'connected' && selectedAddress) {
      return formatAddress(selectedAddress);
    }
    return 'Connect Wallet';
  };

  const isDisabled = isProcessing || status === 'connecting';

  return (
    <div className='flex flex-col gap-2'>
      <Button onClick={handleClick} disabled={isDisabled} variant='secondary' size='sm'>
        {isProcessing && status === 'connecting' ? 'Connecting...' : getButtonText()}
      </Button>
      {error && <p className='text-xs text-destructive'>{error}</p>}
    </div>
  );
}
