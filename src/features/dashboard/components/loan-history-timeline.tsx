'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { formatBalance, useTypink } from 'typink';
import { Skeleton } from '@/shared/ui/skeleton';
import { Clock, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import type { Loan } from '@/lib/types';

interface LoanHistoryTimelineProps {
  loans: Loan[];
  isLoading: boolean;
}

export function LoanHistoryTimeline({ loans, isLoading }: LoanHistoryTimelineProps) {
  const { network } = useTypink();

  if (isLoading) {
    return (
      <Card className='border-border backdrop-blur-sm'>
        <CardHeader>
          <Skeleton className='h-6 w-48 mb-2' />
          <Skeleton className='h-4 w-64' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-64 w-full' />
        </CardContent>
      </Card>
    );
  }

  if (loans.length === 0) {
    return (
      <Card className='border-border backdrop-blur-sm'>
        <CardHeader>
          <CardTitle className='font-sora text-lg font-semibold'>My Loan History</CardTitle>
          <CardDescription className='font-inter text-sm'>
            Complete history of your loans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-center py-12'>
            <p className='font-inter text-muted-foreground'>No loan history yet</p>
            <p className='font-inter text-sm text-muted-foreground mt-2'>
              Request your first loan to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort loans by start time (most recent first)
  const sortedLoans = [...loans].sort((a, b) => {
    const timeA = Number(a.startTime);
    const timeB = Number(b.startTime);
    return timeB - timeA;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Repaid':
        return <CheckCircle2 className='h-4 w-4 text-forest-green' />;
      case 'Active':
        return <Clock className='h-4 w-4 text-amber-honey' />;
      case 'Defaulted':
        return <XCircle className='h-4 w-4 text-atomic-tangerine' />;
      default:
        return <TrendingUp className='h-4 w-4' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Repaid':
        return 'bg-forest-green/20 text-forest-green border-forest-green/30';
      case 'Active':
        return 'bg-amber-honey/20 text-amber-honey border-amber-honey/30';
      case 'Defaulted':
        return 'bg-atomic-tangerine/20 text-atomic-tangerine border-atomic-tangerine/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className='border-border backdrop-blur-sm'>
      <CardHeader>
        <CardTitle className='font-sora text-lg font-semibold'>My Loan History</CardTitle>
        <CardDescription className='font-inter text-sm'>
          Complete history of your loans ({loans.length} {loans.length === 1 ? 'loan' : 'loans'})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='relative'>
          {/* Timeline line */}
          <div className='absolute left-4 top-0 bottom-0 w-0.5 bg-border' />
          
          {/* Timeline items */}
          <div className='space-y-6'>
            {sortedLoans.map((loan) => {
              const startDate = new Date(Number(loan.startTime) * 1000);
              const dueDate = new Date(Number(loan.dueTime) * 1000);
              
              return (
                <div key={loan.loanId.toString()} className='relative pl-12'>
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center ${
                      loan.status === 'Repaid'
                        ? 'bg-forest-green'
                        : loan.status === 'Active'
                        ? 'bg-amber-honey'
                        : 'bg-atomic-tangerine'
                    }`}
                  >
                    {getStatusIcon(loan.status)}
                  </div>
                  
                  {/* Content */}
                  <div className='pb-6'>
                    <div className='flex items-start justify-between mb-2'>
                      <div>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='font-sora text-base font-semibold'>
                            {formatBalance(loan.amount, network)}
                          </span>
                          <Badge variant='secondary' className={getStatusColor(loan.status)}>
                            {loan.status}
                          </Badge>
                        </div>
                        <p className='font-inter text-sm text-muted-foreground'>
                          {startDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {' → '}
                          {dueDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className='mt-2 p-3 rounded-lg bg-muted/30 backdrop-blur-sm'>
                      <div className='grid grid-cols-2 gap-2 text-sm'>
                        <div>
                          <span className='font-inter text-xs text-muted-foreground'>Loan ID:</span>
                          <span className='font-inter font-mono text-xs ml-2'>
                            #{loan.loanId.toString()}
                          </span>
                        </div>
                        <div>
                          <span className='font-inter text-xs text-muted-foreground'>Repayment:</span>
                          <span className='font-inter text-xs font-medium ml-2'>
                            {formatBalance(loan.totalRepayment, network)}
                          </span>
                        </div>
                        {loan.status === 'Active' && (
                          <div>
                            <span className='font-inter text-xs text-muted-foreground'>Days remaining:</span>
                            <span className='font-inter text-xs font-medium ml-2'>
                              {loan.daysRemaining}
                            </span>
                          </div>
                        )}
                        {loan.purposeText && (
                          <div className='col-span-2'>
                            <span className='font-inter text-xs text-muted-foreground'>Purpose:</span>
                            <span className='font-inter text-xs ml-2'>{loan.purposeText}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
