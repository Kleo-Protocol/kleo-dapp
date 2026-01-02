'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { formatBalance } from '@/shared/utils/format';
import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import type { Loan } from '@/services/mock/loans.mock';
import { Skeleton } from '@/shared/ui/skeleton';

interface DashboardActivityProps {
  userRole: 'lender' | 'borrower' | null;
  activeLoans: Loan[];
  isLoading: boolean;
}

const statusColors = {
  pending: 'bg-amber-honey/10 text-amber-honey border-amber-honey/20',
  funding: 'bg-atomic-tangerine/10 text-atomic-tangerine border-atomic-tangerine/20',
  active: 'bg-forest-green/20 text-forest-green border-forest-green/30',
  completed: 'bg-forest-green/20 text-forest-green border-forest-green/30',
  defaulted: 'bg-atomic-tangerine/10 text-atomic-tangerine border-atomic-tangerine/20',
  cancelled: 'bg-oxford-blue/50 text-anti-flash-white border-oxford-blue/30',
};

const statusLabels = {
  pending: 'Pending',
  funding: 'Funding',
  active: 'Active',
  completed: 'Completed',
  defaulted: 'Defaulted',
  cancelled: 'Cancelled',
};

function formatDaysRemaining(dueTime: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const diff = Number(dueTime - now);
  const days = Math.floor(diff / (24 * 60 * 60));
  
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export function DashboardActivity({ userRole, activeLoans, isLoading }: DashboardActivityProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const title = userRole === 'borrower' 
    ? 'Your Active Loans' 
    : userRole === 'lender'
    ? 'Your Active Lending'
    : 'Recent Activity';

  const description = userRole === 'borrower'
    ? 'Track your current borrowing activities'
    : userRole === 'lender'
    ? 'Monitor your active lending positions'
    : 'No activity to display';

  if (activeLoans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No active loans</p>
            {userRole && (
              <Button asChild variant="outline">
                <Link href={userRole === 'borrower' ? '/borrow' : '/lend'}>
                  {userRole === 'borrower' ? 'Request a Loan' : 'Start Lending'}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {userRole && (
            <Button asChild variant="ghost" size="sm">
              <Link href={userRole === 'borrower' ? '/borrow' : '/lend'}>
                View All
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeLoans.slice(0, 5).map((loan) => (
            <div
              key={loan.loanId}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-atomic-tangerine/5 hover:border-atomic-tangerine/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={`${statusColors[loan.status]} border`}>
                    {statusLabels[loan.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {loan.loanId.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold">{formatBalance(loan.fundedAmount)}</span>
                  {loan.status === 'active' && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3" />
                      <span>{formatDaysRemaining(loan.dueTime)}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/pools/${loan.poolId}`}>
                  View
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
