'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useTypink } from 'typink';
import { useSyncWalletState } from '@/hooks/use-sync-wallet-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, DollarSign, Clock, Shield, Plus } from 'lucide-react';

function BorrowContent() {
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
        Preparing your borrower dashboard...
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-6xl'>
      <div className='mb-8'>
        <h1 className='text-4xl font-bold mb-2'>Borrower Dashboard</h1>
        <p className='text-muted-foreground'>
          Request loans and manage your borrowing activity
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Borrowed</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0 DOT</div>
            <p className='text-xs text-muted-foreground'>All-time borrowing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Loans</CardTitle>
            <TrendingDown className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
            <p className='text-xs text-muted-foreground'>Loans you're repaying</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Repayment Rate</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>100%</div>
            <p className='text-xs text-muted-foreground'>On-time payments</p>
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
            <CardTitle>Request New Loan</CardTitle>
            <CardDescription>Create a new loan request</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <p className='text-sm text-muted-foreground'>
                Request a collateral-free loan based on your trust score.
              </p>
              <Button className='w-full'>
                <Plus className='mr-2 h-4 w-4' />
                Create Loan Request
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Loans</CardTitle>
            <CardDescription>Manage your active loan requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <p className='text-sm text-muted-foreground'>
                You don't have any active loans.
              </p>
              <Button className='w-full' variant='outline'>
                View Loan History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BorrowPage() {
  return (
    <Suspense
      fallback={
        <div className='py-16 text-center text-muted-foreground'>Loading borrower dashboard...</div>
      }>
      <BorrowContent />
    </Suspense>
  );
}

