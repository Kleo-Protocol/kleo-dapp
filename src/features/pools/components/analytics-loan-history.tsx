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
import { Calendar, DollarSign, AlertTriangle, CheckCircle, XCircle, Inbox } from 'lucide-react';
import { DefaultActionModal } from './default-action-modal';
import { EmptyState } from '@/shared/components/empty-state';
import { formatBalance, formatInterestRate, formatAddress, formatDate } from '@/shared/utils/format';

interface LoanHistoryItem {
  loanId: string;
  borrower: string;
  amount: bigint;
  interestRate: bigint;
  dueDate: bigint;
  status: 'active' | 'completed' | 'defaulted' | 'overdue';
  repaidAmount: bigint;
  isOverdue: boolean;
  createdAt: number;
}

interface AnalyticsLoanHistoryProps {
  loans: LoanHistoryItem[];
  isLoading?: boolean;
  isCreator?: boolean;
}

// Mock loan history data
const mockLoans: LoanHistoryItem[] = [
  {
    loanId: '0x1111111111111111111111111111111111111111111111111111111111111111',
    borrower: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    amount: 10000000000000000000n,
    interestRate: 500n,
    dueDate: BigInt(Math.floor((Date.now() + 60 * 24 * 60 * 60 * 1000) / 1000)),
    status: 'active',
    repaidAmount: 0n,
    isOverdue: false,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    loanId: '0x2222222222222222222222222222222222222222222222222222222222222222',
    borrower: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    amount: 5000000000000000000n,
    interestRate: 800n,
    dueDate: BigInt(Math.floor((Date.now() - 5 * 24 * 60 * 60 * 1000) / 1000)),
    status: 'overdue',
    repaidAmount: 0n,
    isOverdue: true,
    createdAt: Date.now() - 65 * 24 * 60 * 60 * 1000,
  },
  {
    loanId: '0x4444444444444444444444444444444444444444444444444444444444444444',
    borrower: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    amount: 15000000000000000000n,
    interestRate: 450n,
    dueDate: BigInt(Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)),
    status: 'completed',
    repaidAmount: 15750000000000000000n,
    isOverdue: false,
    createdAt: Date.now() - 150 * 24 * 60 * 60 * 1000,
  },
  {
    loanId: '0x6666666666666666666666666666666666666666666666666666666666666666',
    borrower: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    amount: 8000000000000000000n,
    interestRate: 1200n,
    dueDate: BigInt(Math.floor((Date.now() - 45 * 24 * 60 * 60 * 1000) / 1000)),
    status: 'defaulted',
    repaidAmount: 0n,
    isOverdue: true,
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
  },
];

export function AnalyticsLoanHistory({ loans = mockLoans, isLoading = false, isCreator = true }: AnalyticsLoanHistoryProps) {
  const [defaultLoanId, setDefaultLoanId] = useState<string | null>(null);

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (status === 'completed') {
      return (
        <Badge variant="verde" className="gap-1">
          <CheckCircle className="size-3" />
          Completed
        </Badge>
      );
    }
    if (status === 'defaulted') {
      return (
        <Badge variant="rojo" className="gap-1">
          <XCircle className="size-3" />
          Defaulted
        </Badge>
      );
    }
    if (isOverdue) {
      return (
        <Badge variant="rojo" className="gap-1">
          <AlertTriangle className="size-3" />
          Overdue
        </Badge>
      );
    }
    return <Badge variant="verde">Active</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loans.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="size-12" />}
        title="No Loan History"
        description="No loans have been created in this pool yet."
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            Loan History
          </CardTitle>
          <CardDescription>Complete history of all loans in this pool</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan ID</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Interest Rate</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Repaid</TableHead>
                <TableHead>Status</TableHead>
                {isCreator && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan) => (
                <TableRow key={loan.loanId}>
                  <TableCell className="font-mono text-xs">
                    {loan.loanId.slice(0, 12)}...
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {formatAddress(loan.borrower)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatBalance(loan.amount)} tokens
                  </TableCell>
                  <TableCell>{formatInterestRate(loan.interestRate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-slate-400" />
                      {formatDate(loan.dueDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {loan.status === 'completed' ? (
                      <span className="font-medium text-forest-green">
                        {formatBalance(loan.repaidAmount)} tokens
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(loan.status, loan.isOverdue)}</TableCell>
                  {isCreator && (
                    <TableCell>
                      {(loan.status === 'overdue' || loan.isOverdue) && loan.status !== 'defaulted' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDefaultLoanId(loan.loanId)}
                        >
                          Mark Default
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {defaultLoanId && isCreator && (
        <DefaultActionModal
          loanId={defaultLoanId}
          loan={loans.find((l) => l.loanId === defaultLoanId)}
          open={!!defaultLoanId}
          onOpenChange={(open) => !open && setDefaultLoanId(null)}
        />
      )}
    </>
  );
}

