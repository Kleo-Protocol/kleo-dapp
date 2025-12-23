'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useTypink } from 'typink';
import { useSyncWalletState } from '@/hooks/use-sync-wallet-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Users, Shield } from 'lucide-react';

function LendContent() {
  const router = useRouter();
  const { accounts } = useTypink();

  // Sincronizar estado de typink con nuestro store
  useSyncWalletState();

  // Verificar que haya wallet conectada
  useEffect(() => {
    if (accounts.length === 0) {
      router.replace('/');
    }
  }, [accounts.length, router]);

  if (accounts.length === 0) {
    return (
      <div className='py-16 text-center text-muted-foreground'>
        Preparing your lender dashboard...
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-6xl'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold mb-2'>Lender Dashboard</h1>
        <p className='text-muted-foreground'>
          Fund loans and earn returns while helping borrowers access capital
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Invested</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0 DOT</div>
            <p className='text-xs text-muted-foreground'>+0% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Loans</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
            <p className='text-xs text-muted-foreground'>Loans you're funding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Returns</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0 DOT</div>
            <p className='text-xs text-muted-foreground'>Earned from loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Trust Score</CardTitle>
            <Shield className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>--</div>
            <p className='text-xs text-muted-foreground'>Your trust rating</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Available Loans</CardTitle>
            <CardDescription>Browse loan requests from borrowers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <p className='text-sm text-muted-foreground'>
                No loan requests available at the moment.
              </p>
              <Button className='w-full' variant='outline'>
                Browse Loans
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Investments</CardTitle>
            <CardDescription>Track your active loan investments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <p className='text-sm text-muted-foreground'>
                You haven't funded any loans yet.
              </p>
              <Button className='w-full' variant='outline'>
                View Portfolio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LendPage() {
  return (
    <Suspense
      fallback={
        <div className='py-16 text-center text-muted-foreground'>Loading lender dashboard...</div>
      }>
      <LendContent />
    </Suspense>
  );
}

