'use client';

import { useMemo } from 'react';
import { cn, shortenAddress } from '@/lib/utils';
import { AccountSelection } from './account-selection';
import { WalletSelection } from './wallet-selection';
import { useTypink, formatBalance, useBalances } from 'typink';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Wallet, Network, CreditCard, Activity } from 'lucide-react';
import { AccountAvatar } from './account-avatar';

interface WalletDrawerProps {
  isOpen: boolean;
}

export function WalletDrawer({ isOpen }: WalletDrawerProps) {
  const { accounts, connectedAccount, network, connectedWallets } = useTypink();
  const addresses = useMemo(() => (connectedAccount ? [connectedAccount.address] : []), [connectedAccount]);
  const balances = useBalances(addresses);

  const balance = connectedAccount ? balances[connectedAccount.address] : null;
  const formattedBalance = balance ? formatBalance(balance.free, network) : '0';
  const connectedWallet = connectedWallets[0];

  return (
    <div
      className={cn(
        'fixed left-20 top-0 z-30 h-screen w-80 bg-card border-r border-border/50 transition-transform duration-300 ease-in-out overflow-y-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex flex-col h-full p-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground font-sora">Wallet</h2>
          <p className="text-sm text-muted-foreground mt-1 font-inter">Manage your wallet connection</p>
        </div>

        {/* Wallet Cards */}
        {connectedAccount && (
          <div className="grid gap-3 mb-4">
            {/* Balance Card */}
            <Card className="border-atomic-tangerine/20 bg-atomic-tangerine/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-atomic-tangerine" />
                  <span className="font-inter text-xs text-muted-foreground">Balance</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-sora text-2xl font-bold tracking-tight text-foreground">
                      {formattedBalance.split(' ')[0]}
                    </span>
                    <span className="font-inter text-sm text-muted-foreground ml-2">{network.symbol}</span>
                  </div>
                  {balance && balance.reserved > 0n && (
                    <p className="font-inter text-xs text-muted-foreground">
                      Reserved: {formatBalance(balance.reserved, network)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Card */}
            <Card className="border-forest-green/20 bg-forest-green/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-forest-green" />
                  <span className="font-inter text-xs text-muted-foreground">Account</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <AccountAvatar account={connectedAccount} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="font-inter text-sm font-semibold text-foreground truncate">
                        {connectedAccount.name || 'Unnamed'}
                      </p>
                      <p className="font-inter text-xs text-muted-foreground font-mono truncate">
                        {shortenAddress(connectedAccount.address)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Card */}
            <Card className="border-oxford-blue/20 bg-oxford-blue/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-oxford-blue" />
                  <span className="font-inter text-xs text-muted-foreground">Network</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-sora text-lg font-bold tracking-tight text-foreground">
                      {network.name}
                    </span>
                  </div>
                  {connectedWallet && (
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={connectedWallet.logo}
                        alt={connectedWallet.name}
                        className="w-4 h-4 rounded"
                      />
                      <span className="font-inter text-xs text-muted-foreground">{connectedWallet.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Card */}
            <Card className="border-amber-honey/20 bg-amber-honey/5 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-honey" />
                  <span className="font-inter text-xs text-muted-foreground">Connection</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-forest-green rounded-full animate-pulse" />
                    <span className="font-inter text-sm text-foreground">Connected</span>
                  </div>
                  <p className="font-inter text-xs text-muted-foreground">
                    {accounts.length} account{accounts.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Account Selection / Wallet Selection */}
        <div className="flex-1">
          {accounts.length > 0 ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground font-inter mb-2">Accounts</h3>
                <AccountSelection />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground font-inter mb-2">Connect Wallet</h3>
                <WalletSelection />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
