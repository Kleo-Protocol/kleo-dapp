'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatBalance } from 'typink';
import { useTypink } from 'typink';
import { Skeleton } from '@/shared/ui/skeleton';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import type { UserDepositPosition, UserLoanPosition } from '../hooks/use-personal-dashboard';

interface ActivePositionsTableProps {
  deposits: UserDepositPosition[];
  loans: UserLoanPosition[];
  isLoading: boolean;
  onWithdraw?: (poolId: string) => void;
  onRepay?: (loanId: bigint) => void;
}

export function ActivePositionsTable({
  deposits,
  loans,
  isLoading,
  onWithdraw,
  onRepay,
}: ActivePositionsTableProps) {
  const { network } = useTypink();

  if (isLoading) {
    return (
      <Card className='border-border backdrop-blur-sm'>
        <CardHeader>
          <Skeleton className='h-6 w-48 mb-2' />
          <Skeleton className='h-4 w-64' />
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const allPositions = [
    ...deposits.map((dep) => ({
      type: 'deposit' as const,
      poolId: dep.poolId,
      poolName: dep.poolName,
      amount: dep.amount,
      rate: dep.currentAPY,
      status: 'Active' as const,
      availableToWithdraw: dep.availableToWithdraw,
    })),
    ...loans.map((loan) => ({
      type: 'loan' as const,
      poolId: null,
      poolName: 'Loan',
      amount: loan.amount,
      rate: 0, // Would need interest rate from loan
      status: loan.status,
      amountToRepay: loan.amountToRepay,
      loanId: loan.loanId,
      isOverdue: loan.isOverdue,
    })),
  ];

  if (allPositions.length === 0) {
    return (
      <Card className='border-border backdrop-blur-sm'>
        <CardHeader>
          <CardTitle className='font-sora text-lg font-semibold'>My Active Positions</CardTitle>
          <CardDescription className='font-inter text-sm'>
            Tus posiciones activas de depósitos y préstamos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-center py-12'>
            <p className='font-inter text-muted-foreground'>No active positions yet</p>
            <p className='font-inter text-sm text-muted-foreground mt-2'>
              Start by depositing to a pool or requesting a loan
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border backdrop-blur-sm'>
      <CardHeader>
        <CardTitle className='font-sora text-lg font-semibold'>My Active Positions</CardTitle>
        <CardDescription className='font-inter text-sm'>
          Tus posiciones activas de depósitos y préstamos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-border'>
                <th className='text-left py-3 px-4 font-inter text-sm text-muted-foreground font-medium'>
                  Pool
                </th>
                <th className='text-left py-3 px-4 font-inter text-sm text-muted-foreground font-medium'>
                  Type
                </th>
                <th className='text-left py-3 px-4 font-inter text-sm text-muted-foreground font-medium'>
                  Amount
                </th>
                <th className='text-left py-3 px-4 font-inter text-sm text-muted-foreground font-medium'>
                  Rate
                </th>
                <th className='text-left py-3 px-4 font-inter text-sm text-muted-foreground font-medium'>
                  Status
                </th>
                <th className='text-right py-3 px-4 font-inter text-sm text-muted-foreground font-medium'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {allPositions.map((position, index) => (
                <tr
                  key={`${position.type}-${index}`}
                  className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                    position.type === 'deposit' ? 'bg-forest-green/5' : 'bg-oxford-blue/5'
                  }`}
                >
                  <td className='py-4 px-4'>
                    <span className='font-inter text-sm font-medium'>{position.poolName}</span>
                  </td>
                  <td className='py-4 px-4'>
                    {position.type === 'deposit' ? (
                      <Badge variant='secondary' className='bg-forest-green/20 text-forest-green border-forest-green/30'>
                        Deposit
                      </Badge>
                    ) : (
                      <Badge variant='secondary' className='bg-oxford-blue/20 text-oxford-blue border-oxford-blue/30'>
                        Loan
                      </Badge>
                    )}
                  </td>
                  <td className='py-4 px-4'>
                    <span className='font-inter text-sm font-medium'>
                      {formatBalance(position.amount, network)}
                    </span>
                  </td>
                  <td className='py-4 px-4'>
                    <span className='font-inter text-sm'>
                      {position.type === 'deposit'
                        ? `${position.rate.toFixed(2)}% APY`
                        : '—'}
                    </span>
                  </td>
                  <td className='py-4 px-4'>
                    {position.status === 'Active' ? (
                      <Badge variant='secondary' className='bg-forest-green/20 text-forest-green border-forest-green/30'>
                        Active
                      </Badge>
                    ) : position.status === 'Repaid' ? (
                      <Badge variant='secondary' className='bg-muted text-muted-foreground'>
                        Repaid
                      </Badge>
                    ) : position.isOverdue ? (
                      <Badge variant='rojo'>Overdue</Badge>
                    ) : (
                      <Badge variant='secondary'>{position.status}</Badge>
                    )}
                  </td>
                  <td className='py-4 px-4 text-right'>
                    {position.type === 'deposit' ? (
                      <Button
                        size='sm'
                        variant='secondary'
                        onClick={() => onWithdraw?.(position.poolId!)}
                        className='font-inter'
                      >
                        <ArrowUpCircle className='h-4 w-4 mr-1' />
                        Withdraw
                      </Button>
                    ) : (
                      <Button
                        size='sm'
                        variant='secondary'
                        onClick={() => onRepay?.(position.loanId!)}
                        className='font-inter'
                      >
                        <ArrowDownCircle className='h-4 w-4 mr-1' />
                        Repay
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
