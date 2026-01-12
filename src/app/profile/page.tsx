'use client';

import { Suspense, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Copy, User, Wallet, Shield, TrendingUp, Star, History, CheckCircle2, XCircle } from 'lucide-react';
import { formatBalance, useBalances, useTypink } from 'typink';
import { toast } from 'sonner';
import { shortenAddress } from '@/lib/utils';
import { AccountAvatar } from '@/shared/components/account-avatar';
import { useAuthStore } from '@/store/authStore';
import { useSyncWalletState } from '@/features/auth/hooks/use-sync-wallet-state';
import { useUserStore } from '@/store/user.store';
import { useUserReputation } from '@/features/profile/hooks/use-user-reputation';

function ProfileContent() {
  const { connectedAccount, network, accounts } = useTypink();
  const { userRole, isRegistered } = useAuthStore();
  const { tier } = useUserStore();

  // Sincronizar estado de typink con nuestro store
  useSyncWalletState();

  // Query user reputation from contract
  const { data: userReputation, isLoading: isLoadingReputation } = useUserReputation(
    connectedAccount?.address
  );

  // Get stars from contract or fallback to 0
  const stars = userReputation?.stars ?? 0;
  const starsAtStake = userReputation?.starsAtStake ?? 0;
  const loanHistory = userReputation?.loanHistory ?? [];
  const vouchHistory = userReputation?.vouchHistory ?? [];

  // Get tier display info
  const tierInfo = useMemo(() => {
    const tierMap = {
      rojo: { label: 'Rojo', color: 'rojo' as const, description: 'Basic Tier' },
      amarillo: { label: 'Amarillo', color: 'amarillo' as const, description: 'Intermediate Tier' },
      verde: { label: 'Verde', color: 'verde' as const, description: 'Premium Tier' },
    };
    return tierMap[tier] || tierMap.rojo;
  }, [tier]);

  const addresses = useMemo(() => (connectedAccount ? [connectedAccount.address] : []), [connectedAccount]);
  const balances = useBalances(addresses);

  // No redirigir automáticamente - permitir que el usuario vea la página sin wallet

  const copyAddress = () => {
    if (connectedAccount) {
      navigator.clipboard.writeText(connectedAccount.address);
      toast.success('Address copied to clipboard');
    }
  };

  const balance = connectedAccount ? balances[connectedAccount.address] : null;
  const formattedBalance = balance ? formatBalance(balance.free, network) : '0';

  if (accounts.length === 0) {
    return (
      <div className='py-16 text-center text-muted-foreground'>
        Preparing your profile...
      </div>
    );
  }

  if (!connectedAccount) {
    return (
      <div className='py-16 text-center text-muted-foreground'>
        Please connect your wallet to view your profile
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      {/* Header Section */}
      <div className='flex flex-col items-center gap-4 pb-6 border-b'>
        <AccountAvatar account={connectedAccount} size={80} className='border-4 border-background shadow-lg' />
        <div className='text-center space-y-2'>
          <h1 className='text-3xl font-bold'>{connectedAccount.name || 'Unnamed Account'}</h1>
          <div className='flex items-center justify-center gap-2 text-muted-foreground'>
            <span className='font-mono text-sm'>{shortenAddress(connectedAccount.address)}</span>
            <Button
              variant='ghost'
              size='icon'
              onClick={copyAddress}
              className='h-6 w-6'>
              <Copy className='h-3.5 w-3.5' />
            </Button>
          </div>
        </div>
        {userRole && (
          <Badge variant='verde' className='text-base px-4 py-1.5'>
            {userRole === 'lender' ? 'Lender' : 'Borrower'}
          </Badge>
        )}
      </div>

      {/* Main Content Grid */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              <CardTitle>Account Information</CardTitle>
            </div>
            <CardDescription>Your wallet and account details</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex justify-between items-center py-2 border-b'>
              <span className='text-sm text-muted-foreground'>Account Name</span>
              <span className='text-sm font-medium'>{connectedAccount.name || 'Unnamed'}</span>
            </div>
            <div className='flex justify-between items-center py-2 border-b'>
              <span className='text-sm text-muted-foreground'>Wallet Source</span>
              <span className='text-sm font-medium capitalize'>{connectedAccount.source || 'Unknown'}</span>
            </div>
            <div className='flex justify-between items-center py-2 border-b'>
              <span className='text-sm text-muted-foreground'>Network</span>
              <span className='text-sm font-medium'>{network.name}</span>
            </div>
            <div className='flex justify-between items-center py-2'>
              <span className='text-sm text-muted-foreground'>Registration Status</span>
              <Badge variant={isRegistered ? 'verde' : 'amarillo'}>
                {isRegistered ? 'Registered' : 'Not Registered'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Wallet className='h-5 w-5' />
              <CardTitle>Balance</CardTitle>
            </div>
            <CardDescription>Your current account balance</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex justify-between items-center py-2 border-b'>
              <span className='text-sm text-muted-foreground'>Available Balance</span>
              <div className='flex items-center gap-2'>
                <span className='text-lg font-bold'>{formattedBalance.split(' ')[0]}</span>
                <span className='text-sm font-semibold text-primary'>{network.symbol}</span>
              </div>
            </div>
            {balance && (
              <>
                <div className='flex justify-between items-center py-2 border-b'>
                  <span className='text-sm text-muted-foreground'>Reserved</span>
                  <span className='text-sm font-medium'>
                    {formatBalance(balance.reserved, network).split(' ')[0]} {network.symbol}
                  </span>
                </div>
                <div className='flex justify-between items-center py-2'>
                  <span className='text-sm text-muted-foreground'>Total Balance</span>
                  <span className='text-sm font-medium'>
                    {formatBalance(balance.free + balance.reserved, network).split(' ')[0]} {network.symbol}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Trust Score Card */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Shield className='h-5 w-5' />
              <CardTitle>Trust Score</CardTitle>
            </div>
            <CardDescription>Your reputation in the Kleo network</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingReputation ? (
              <div className='flex flex-col items-center justify-center py-8'>
                <p className='text-sm text-muted-foreground'>Loading reputation data...</p>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-6 space-y-6'>
                {/* Tier Badge */}
                <div className='flex flex-col items-center gap-2'>
                  <Badge variant={tierInfo.color} className='text-base px-4 py-1.5'>
                    {tierInfo.label} Tier
                  </Badge>
                  <p className='text-xs text-muted-foreground'>{tierInfo.description}</p>
                </div>

                {/* Star Rating */}
                <div className='flex flex-col items-center gap-3'>
                  <div className='flex items-center gap-2'>
                    <Star className='h-6 w-6 fill-amber-honey text-amber-honey' />
                    <p className='text-lg font-semibold text-card-foreground'>
                      {stars > 0 ? stars : '0'}
                    </p>
                  </div>
                  {starsAtStake > 0 && (
                    <p className='text-xs text-muted-foreground'>
                      {starsAtStake} stars at stake
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Card */}
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              <CardTitle>Activity</CardTitle>
            </div>
            <CardDescription>Your recent activity and statistics</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex justify-between items-center py-2 border-b'>
              <span className='text-sm text-muted-foreground'>User Role</span>
              <Badge variant='verde' className='capitalize'>
                {userRole || 'Not Set'}
              </Badge>
            </div>
            <div className='flex justify-between items-center py-2 border-b'>
              <span className='text-sm text-muted-foreground'>Total Loans</span>
              <span className='text-sm font-medium'>{loanHistory.length}</span>
            </div>
            <div className='flex justify-between items-center py-2 border-b'>
              <span className='text-sm text-muted-foreground'>Repaid Loans</span>
              <span className='text-sm font-medium'>
                {loanHistory.filter((loan) => loan.repaid).length}
              </span>
            </div>
            <div className='flex justify-between items-center py-2'>
              <span className='text-sm text-muted-foreground'>Total Vouches</span>
              <span className='text-sm font-medium'>{vouchHistory.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Section */}
      {(loanHistory.length > 0 || vouchHistory.length > 0) && (
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <History className='h-5 w-5' />
              <CardTitle>History</CardTitle>
            </div>
            <CardDescription>Your loan and vouch history</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Loan History */}
            {loanHistory.length > 0 && (
              <div className='space-y-3'>
                <h3 className='text-sm font-semibold text-card-foreground'>Loan History</h3>
                <div className='space-y-2'>
                  {loanHistory.map((loan, index) => {
                    const amount = Number(loan.amount) / 1e18;
                    return (
                      <div
                        key={index}
                        className='flex items-center justify-between p-3 rounded-lg border border-border bg-card'>
                        <div className='flex items-center gap-3'>
                          {loan.repaid ? (
                            <CheckCircle2 className='h-4 w-4 text-green-600' />
                          ) : (
                            <XCircle className='h-4 w-4 text-atomic-tangerine' />
                          )}
                          <div>
                            <p className='text-sm font-medium'>
                              {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              {loan.repaid ? 'Repaid' : 'Not Repaid'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Vouch History */}
            {vouchHistory.length > 0 && (
              <div className='space-y-3'>
                <h3 className='text-sm font-semibold text-card-foreground'>Vouch History</h3>
                <div className='space-y-2'>
                  {vouchHistory.map((vouch, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 rounded-lg border border-border bg-card'>
                      <div className='flex items-center gap-3'>
                        {vouch.successful ? (
                          <CheckCircle2 className='h-4 w-4 text-green-600' />
                        ) : (
                          <XCircle className='h-4 w-4 text-atomic-tangerine' />
                        )}
                        <div>
                          <p className='text-sm font-medium font-mono'>
                            {shortenAddress(vouch.borrower.toString())}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {vouch.successful ? 'Successful' : 'Failed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className='py-16 text-center text-muted-foreground'>
          Loading profile...
        </div>
      }>
      <ProfileContent />
    </Suspense>
  );
}

