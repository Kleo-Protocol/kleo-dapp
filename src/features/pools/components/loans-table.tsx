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
import { AlertCircle, Calendar, DollarSign, Inbox } from 'lucide-react';
import { RepayModal } from './repay-modal';
import { EmptyState } from '@/shared/components/empty-state';
import { formatBalance } from '@/shared/utils/format';
import type { LoanDetails } from '@/services/mock/loans.mock';

interface LoansTableProps {
  loans: LoanDetails[];
  isLoading?: boolean;
}

// Mock active loans data
const mockLoans: LoanDetails[] = [
  {
    loanId: '0x1111111111111111111111111111111111111111111111111111111111111111',
    borrower: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    requestedAmount: 10000000000000000000n,
    fundedAmount: 10000000000000000000n,
    lenderCount: 5,
    interestRate: 500n,
    penaltyRate: 200n,
    duration: BigInt(90 * 24 * 60 * 60),
    startTime: BigInt(Date.now() - 30 * 24 * 60 * 60 * 1000),
    dueTime: BigInt(Date.now() + 60 * 24 * 60 * 60 * 1000),
    status: 'active',
    poolId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    lenders: [],
    remainingAmount: 0n,
    progress: 100,
    daysRemaining: 60,
    totalRepayment: 10500000000000000000n,
    isOverdue: false,
  },
];

export function LoansTable({ loans = mockLoans, isLoading = false }: LoansTableProps) {
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null);

  const formatDate = (timestamp: bigint) => {
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
              {loans.map((loan) => (
                <TableRow key={loan.loanId}>
                  <TableCell className="font-medium">
                    {formatBalance(loan.fundedAmount)} tokens
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
                    {loan.isOverdue ? (
                      <span className="text-red-600 font-medium">Overdue</span>
                    ) : (
                      <span>{loan.daysRemaining} days</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {loan.isOverdue ? (
                      <Badge variant="rojo">Overdue</Badge>
                    ) : (
                      <Badge variant="verde">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setRepayLoanId(loan.loanId)}
                    >
                      Repay
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {repayLoanId && (
        <RepayModal
          loanId={repayLoanId}
          loan={loans.find((l) => l.loanId === repayLoanId)}
          open={!!repayLoanId}
          onOpenChange={(open) => !open && setRepayLoanId(null)}
        />
      )}
    </>
  );
}

