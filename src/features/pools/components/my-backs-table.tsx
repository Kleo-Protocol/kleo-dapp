'use client';

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
import { Skeleton } from '@/shared/ui/skeleton';
import { TrendingUp, Calendar, AlertTriangle, CheckCircle, Inbox } from 'lucide-react';
import { EmptyState } from '@/shared/components/empty-state';
import { formatBalance, formatInterestRate, formatDate } from '@/shared/utils/format';

interface BackedLoan {
  loanId: string;
  borrower: string;
  loanAmount: bigint;
  myContribution: bigint;
  interestRate: bigint;
  dueDate: bigint;
  status: 'active' | 'completed' | 'defaulted';
  expectedReturn: bigint;
  isOverdue: boolean;
  backedAt: number;
}

interface MyBacksTableProps {
  backs: BackedLoan[];
  isLoading?: boolean;
}

// Mock backed loans data
const mockBacks: BackedLoan[] = [
  {
    loanId: '0x1111111111111111111111111111111111111111111111111111111111111111',
    borrower: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    loanAmount: 10000000000000000000n,
    myContribution: 2000000000000000000n, // 2 tokens
    interestRate: 500n,
    dueDate: BigInt(Math.floor((Date.now() + 60 * 24 * 60 * 60 * 1000) / 1000)),
    status: 'active',
    expectedReturn: 100000000000000000n, // 0.1 tokens
    isOverdue: false,
    backedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    loanId: '0x3333333333333333333333333333333333333333333333333333333333333333',
    borrower: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    loanAmount: 20000000000000000000n,
    myContribution: 2500000000000000000n, // 2.5 tokens
    interestRate: 300n,
    dueDate: BigInt(Math.floor((Date.now() - 10 * 24 * 60 * 60 * 1000) / 1000)),
    status: 'active',
    expectedReturn: 62500000000000000n, // 0.0625 tokens
    isOverdue: true,
    backedAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
  },
  {
    loanId: '0x4444444444444444444444444444444444444444444444444444444444444444',
    borrower: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    loanAmount: 15000000000000000000n,
    myContribution: 3000000000000000000n, // 3 tokens
    interestRate: 450n,
    dueDate: BigInt(Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)),
    status: 'completed',
    expectedReturn: 135000000000000000n, // 0.135 tokens
    isOverdue: false,
    backedAt: Date.now() - 150 * 24 * 60 * 60 * 1000,
  },
];

export function MyBacksTable({ backs = mockBacks, isLoading = false }: MyBacksTableProps) {

  const calculateDaysRemaining = (dueDate: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const days = Math.floor((Number(dueDate) - now) / (24 * 60 * 60));
    return days;
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

  if (backs.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="size-12" />}
        title="No Backed Loans"
        description="You haven't backed any loans in this pool yet. Browse pending requests to start earning returns."
      />
    );
  }

  const activeBacks = backs.filter((b) => b.status === 'active');
  const totalContributed = activeBacks.reduce((sum, b) => sum + b.myContribution, 0n);
  const totalExpectedReturn = activeBacks.reduce((sum, b) => sum + b.expectedReturn, 0n);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5" />
          My Backed Loans
        </CardTitle>
        <CardDescription>Loans you have funded in this pool</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>My Contribution</TableHead>
              <TableHead>Loan Amount</TableHead>
              <TableHead>Interest Rate</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Expected Return</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backs.map((back) => {
              const daysRemaining = calculateDaysRemaining(back.dueDate);
              return (
                <TableRow key={back.loanId}>
                  <TableCell className="font-medium">
                    {formatBalance(back.myContribution)} tokens
                  </TableCell>
                  <TableCell>{formatBalance(back.loanAmount)} tokens</TableCell>
                  <TableCell>{formatInterestRate(back.interestRate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-slate-400" />
                      <div>
                        <div>{formatDate(back.dueDate)}</div>
                        {back.status === 'active' && (
                          <div className="text-xs text-slate-500">
                            {back.isOverdue ? (
                              <span className="text-red-600">Overdue by {Math.abs(daysRemaining)} days</span>
                            ) : (
                              <span>{daysRemaining} days remaining</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {formatBalance(back.expectedReturn)} tokens
                  </TableCell>
                  <TableCell>
                    {back.status === 'completed' ? (
                      <Badge variant="verde" className="gap-1">
                        <CheckCircle className="size-3" />
                        Completed
                      </Badge>
                    ) : back.isOverdue ? (
                      <Badge variant="rojo" className="gap-1">
                        <AlertTriangle className="size-3" />
                        Overdue
                      </Badge>
                    ) : (
                      <Badge variant="verde">Active</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">Total Active Capital at Risk</span>
            <span className="font-semibold text-slate-900">{formatBalance(totalContributed)} tokens</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">Total Expected Returns</span>
            <span className="font-semibold text-slate-900">{formatBalance(totalExpectedReturn)} tokens</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
            <span className="font-medium text-slate-900">Active Backs</span>
            <span className="font-semibold text-slate-900">{activeBacks.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

