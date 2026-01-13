'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { Skeleton } from '@/shared/ui/skeleton';
import { ArrowLeft, TrendingUp, DollarSign, Shield } from 'lucide-react';
import { DepositForm } from '@/features/pools/components/deposit-form';
import { WithdrawForm } from '@/features/pools/components/withdraw-form';
import { ApyPreview } from '@/features/pools/components/apy-preview';
import { MyDepositsTable } from '@/features/pools/components/my-deposits-table';
import { BorrowForm } from '@/features/pools/components/borrow-form';
import { RepayLoanSection } from '@/features/pools/components/repay-loan-section';
import { LoansListTable } from '@/features/pools/components/loans-list-table';
import { LenderPositionCard } from '@/features/pools/components/lender-position-card';
import { PendingRequestsTable } from '@/features/pools/components/pending-requests-table';
import { MyBacksTable } from '@/features/pools/components/my-backs-table';
import { AnalyticsKpiCards } from '@/features/pools/components/analytics-kpi-cards';
import { AnalyticsCharts } from '@/features/pools/components/analytics-charts';
import { PoolHistory } from '@/features/pools/components/pool-history';
import { usePoolDetailLogic } from '@/features/pools/hooks/use-pool-detail';
import { usePoolLoans } from '@/features/pools/hooks/use-pool-loans';
import type { LoanManagerLoan } from '@/contracts/types/loan-manager/types';

// Helper function to transform loans for AnalyticsLoanHistory
function transformLoansForAnalytics(loans: LoanManagerLoan[]): Array<{
  loanId: string;
  borrower: string;
  amount: bigint;
  interestRate: bigint;
  dueDate: bigint;
  status: 'active' | 'completed' | 'defaulted' | 'overdue';
  repaidAmount: bigint;
  isOverdue: boolean;
  createdAt: number;
}> {
  const now = BigInt(Math.floor(Date.now() / 1000));
  
  return loans.map((loan) => {
    const startTime = BigInt(loan.startTime || 0);
    const term = BigInt(loan.term || 0);
    const dueDate = startTime + term;
    const isOverdue = loan.status === 'Active' && now > dueDate;
    
    // Calculate repayment amount (principal + interest)
    const amount = BigInt(loan.amount || 0);
    const interestRate = BigInt(loan.interestRate || 0);
    const divisor = 365n * 86400n * 10000n;
    const interestAmount = (amount * interestRate * term) / divisor;
    const repaidAmount = loan.status === 'Repaid' ? amount + interestAmount : 0n;
    
    // Map status
    let status: 'active' | 'completed' | 'defaulted' | 'overdue';
    if (loan.status === 'Repaid') {
      status = 'completed';
    } else if (loan.status === 'Defaulted') {
      status = 'defaulted';
    } else if (isOverdue) {
      status = 'overdue';
    } else {
      status = 'active';
    }
    
    return {
      loanId: String(loan.loanId || ''),
      borrower: typeof loan.borrower === 'string' ? loan.borrower : String(loan.borrower),
      amount,
      interestRate,
      dueDate,
      status,
      repaidAmount,
      isOverdue,
      createdAt: Number(startTime),
    };
  });
}

export function PoolDetailPage() {
  const {
    pool,
    poolState,
    poolStats,
    isLoading,
    error,
    activePoolTab,
    setActivePoolTab,
    isPoolCreator,
    maxBorrow,
    depositAmount,
    setDepositAmount,
    getStatusBadge,
    formatPoolStateValue,
    formatBaseInterestRate,
  } = usePoolDetailLogic();
  
  const { loans: poolLoans, isLoading: isLoadingLoans } = usePoolLoans();

  const statusBadge = getStatusBadge();

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-10 w-10 rounded-lg' />
          <div className='space-y-2'>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-4 w-96' />
          </div>
        </div>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className='h-24 rounded-lg' />
          ))}
        </div>
        <Skeleton className='h-96 w-full rounded-lg' />
      </div>
    );
  }

  if (!poolState || error) {
    return (
      <div className='space-y-6'>
        <Link href='/pools'>
          <Button variant='ghost' size='sm' className='gap-2'>
            <ArrowLeft className='size-4' />
            Back to Pools
          </Button>
        </Link>
        <Card>
          <CardContent className='py-12 text-center space-y-2'>
            <p className='text-slate-600'>
              {error ? 'Error loading pool' : 'Pool not found'}
            </p>
            {error && (
              <p className='text-sm text-red-500'>
                {error.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='space-y-4'>
        <Link href='/pools'>
          <Button variant='ghost' size='sm' className='gap-2'>
            <ArrowLeft className='size-4' />
            Back to Pools
          </Button>
        </Link>

        <div className='flex items-start justify-between'>
          <div>
            <div className='flex items-center gap-3'>
              <h1 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
                {pool?.name ?? 'Lending Pool'}
              </h1>
              {statusBadge && <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}
            </div>
            <p className='mt-2 text-lg text-muted-foreground'>
              {pool?.description ?? 'Pool details and configuration'}
            </p>
          </div>
        </div>

        {/* Key Metrics - Pool State */}
        <div className='grid gap-4 sm:grid-cols-3'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <TrendingUp className='size-4' />
                <span className='text-sm'>Base Interest Rate</span>
              </div>
              <p className='text-2xl font-bold text-card-foreground'>
                {formatBaseInterestRate(poolState?.baseInterestRate ?? pool?.baseInterestRate)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <Shield className='size-4' />
                <span className='text-sm'>Reserve Factor</span>
              </div>
              <p className='text-2xl font-bold text-card-foreground'>
                {poolState.reserveFactor}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 text-muted-foreground mb-2'>
                <DollarSign className='size-4' />
                <span className='text-sm'>Exposure Cap</span>
              </div>
              <p className='text-2xl font-bold text-card-foreground'>
                {formatPoolStateValue(poolState.exposureCap)} tokens
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activePoolTab} onValueChange={(value) => setActivePoolTab(value as typeof activePoolTab)}>
        <TabsList>
          <TabsTrigger value='lend'>Lend</TabsTrigger>
          <TabsTrigger value='borrow'>Borrow</TabsTrigger>
          <TabsTrigger value='vouch'>Vouch</TabsTrigger>
          <TabsTrigger value='history'>History</TabsTrigger>
          {isPoolCreator && <TabsTrigger value='analytics'>Analytics</TabsTrigger>}
        </TabsList>

        {/* Tab Panels */}

        <TabsContent value='lend'>
          {pool && (
            <div className='space-y-6'>
              <div className='grid gap-6 lg:grid-cols-2'>
                <DepositForm pool={pool} onAmountChange={setDepositAmount} />
                <ApyPreview pool={pool} depositAmount={depositAmount} />
              </div>
              <div className='grid gap-6 lg:grid-cols-2'>
                <WithdrawForm pool={pool} />
              </div>
              <LenderPositionCard />
              <MyDepositsTable deposits={[]} />
              <PendingRequestsTable />
              <MyBacksTable backs={[]} />
            </div>
          )}
        </TabsContent>

        <TabsContent value='borrow'>
          {pool && (
            <div className='space-y-6'>
              <div className='grid gap-6 lg:grid-cols-2'>
                <RepayLoanSection />
                <BorrowForm pool={pool} maxBorrow={maxBorrow} />
              </div>
              <LoansListTable />
            </div>
          )}
        </TabsContent>

        <TabsContent value='vouch'>
          <LoansListTable showVouchButton={true} showOnlyPending={true} />
        </TabsContent>

        <TabsContent value='history'>
          <PoolHistory />
        </TabsContent>

        <TabsContent value='analytics'>
          {isPoolCreator && pool ? (
            <div className='space-y-6'>
              {poolStats && <AnalyticsKpiCards stats={poolStats} />}
              <AnalyticsCharts isLoading={isLoadingLoans} />
            </div>
          ) : (
            <Card>
              <CardContent className='py-12 text-center'>
                <p className='text-slate-600'>Analytics are only available to pool creators.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
