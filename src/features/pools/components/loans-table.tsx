'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Calendar, DollarSign, Inbox } from 'lucide-react';
import { RepayModal } from './repay-modal';
import { EmptyState } from '@/shared/components/empty-state';
import { formatBalance } from '@/shared/utils/format';
import { getDaysRemaining, isLoanOverdue } from '@/lib/loan-utils';
import type { LoanDetails } from '@/lib/types';

interface LoansTableProps {
  loans: LoanDetails[];
  isLoading?: boolean;
}

export function LoansTable({ loans = [], isLoading = false }: LoansTableProps) {
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null);

  const formatDate = (timestamp: bigint) => {
    // Timestamp is in seconds, convert to milliseconds
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (loans.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="size-12" />}
        title="No Active Loans"
        description="You don't have any active loans in this pool. Create a loan request to start borrowing."
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            Active Loans
          </CardTitle>
          <CardDescription>Your active loans in this pool</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Total Repayment</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan) => {
                const overdue = isLoanOverdue(loan);
                const daysRemaining = getDaysRemaining(loan);
                const loanIdStr = loan.loanId.toString();
                
                return (
                  <TableRow key={loanIdStr}>
                    <TableCell className="font-medium">
                      {formatBalance(loan.amount)} tokens
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatBalance(loan.totalRepayment)} tokens
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-slate-400" />
                        {formatDate(loan.dueTime)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {overdue ? (
                        <span className="text-red-600 font-medium">Overdue</span>
                      ) : (
                        <span>{daysRemaining} days</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {loan.status === 'Defaulted' ? (
                        <Badge variant="rojo">Defaulted</Badge>
                      ) : loan.status === 'Repaid' ? (
                        <Badge variant="verde">Repaid</Badge>
                      ) : overdue ? (
                        <Badge variant="rojo">Overdue</Badge>
                      ) : (
                        <Badge variant="verde">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {loan.status === 'Active' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setRepayLoanId(loanIdStr)}
                        >
                          Repay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {repayLoanId && (
        <RepayModal
          loanId={repayLoanId}
          loan={loans.find((l) => l.loanId.toString() === repayLoanId)}
          open={!!repayLoanId}
          onOpenChange={(open) => !open && setRepayLoanId(null)}
        />
      )}
    </>
  );
}

