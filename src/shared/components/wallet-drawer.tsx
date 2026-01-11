'use client';

import { cn } from '@/lib/utils';
import { AccountSelection } from './account-selection';
import { WalletSelection } from './wallet-selection';
import { useTypink } from 'typink';

interface WalletDrawerProps {
  isOpen: boolean;
}

export function WalletDrawer({ isOpen }: WalletDrawerProps) {
  const { accounts } = useTypink();

  return (
    <div
      className={cn(
        'fixed left-20 top-0 z-30 h-screen w-80 bg-card border-r border-border/50 transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex flex-col h-full p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Wallet</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your wallet connection</p>
        </div>
        <div className="flex flex-col gap-4 flex-1">
          {accounts.length > 0 ? <AccountSelection /> : <WalletSelection />}
        </div>
      </div>
    </div>
  );
}
