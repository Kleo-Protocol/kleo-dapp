'use client';

import { useEffect, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Copy, User, Wallet, Shield, TrendingUp, Settings } from 'lucide-react';
import { formatBalance, useBalances, useTypink } from 'typink';
import { toast } from 'sonner';
import { shortenAddress } from '@/lib/utils';
import { AccountAvatar } from '@/shared/components/account-avatar';
import { useAuthStore } from '@/store/authStore';
import { useSyncWalletState } from '@/features/auth/hooks/use-sync-wallet-state';

function ProfileContent() {
  const router = useRouter();
  const { connectedAccount, network, accounts } = useTypink();
  const { userRole, isRegistered } = useAuthStore();

  // Sincronizar estado de typink con nuestro store
  useSyncWalletState();

  const addresses = useMemo(() => (connectedAccount ? [connectedAccount.address] : []), [connectedAccount]);
  const balances = useBalances(addresses);

  useEffect(() => {
    if (accounts.length === 0) {
      router.replace('/');
    }
  }, [accounts.length, router]);

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
          <div className='flex items-center gap-2 text-muted-foreground'>
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
            {userRole === 'lender' ? '💰 Lender' : '📊 Borrower'}
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
            <div className='flex flex-col items-center justify-center py-8 space-y-4'>
              <div className='text-4xl font-bold text-primary'>—</div>
              <p className='text-sm text-muted-foreground text-center'>
                Trust score will be displayed here once available
              </p>
            </div>
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
              <span className='text-sm font-medium'>—</span>
            </div>
            <div className='flex justify-between items-center py-2'>
              <span className='text-sm text-muted-foreground'>Total Lends</span>
              <span className='text-sm font-medium'>—</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Section */}
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Settings className='h-5 w-5' />
            <CardTitle>Quick Actions</CardTitle>
          </div>
          <CardDescription>Manage your account and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-3'>
            <Button
              variant='secondary'
              onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
            {userRole === 'lender' && (
              <Button
                variant='secondary'
                onClick={() => router.push('/lend')}>
                Lend Assets
              </Button>
            )}
            {userRole === 'borrower' && (
              <Button
                variant='secondary'
                onClick={() => router.push('/borrow')}>
                Borrow Assets
              </Button>
            )}
            {!userRole && (
              <Button
                variant='secondary'
                onClick={() => router.push('/')}>
                Select Role
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
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

