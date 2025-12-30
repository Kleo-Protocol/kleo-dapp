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
import { Clock, TrendingUp, Inbox } from 'lucide-react';
import { EmptyState } from '@/shared/components/empty-state';
import { formatBalance } from '@/shared/utils/format';

interface Deposit {
  id: string;
  amount: bigint;
  depositedAt: number;
  status: 'active' | 'withdrawn';
  estimatedReturn: bigint;
}

interface MyDepositsTableProps {
  deposits: Deposit[];
  isLoading?: boolean;
}

// Mock deposits data
const mockDeposits: Deposit[] = [
  {
    id: '1',
    amount: 100000000000000000000n, // 100 tokens
    depositedAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    status: 'active',
    estimatedReturn: 5000000000000000000n, // 5 tokens
  },
  {
    id: '2',
    amount: 50000000000000000000n, // 50 tokens
    depositedAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
    status: 'active',
    estimatedReturn: 2500000000000000000n, // 2.5 tokens
  },
  {
    id: '3',
    amount: 75000000000000000000n, // 75 tokens
    depositedAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
    status: 'withdrawn',
    estimatedReturn: 3750000000000000000n, // 3.75 tokens
  },
];

export function MyDepositsTable({ deposits = mockDeposits, isLoading = false }: MyDepositsTableProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDaysSince = (timestamp: number) => {
    const days = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
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

  if (deposits.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="size-12" />}
        title="No Deposits Yet"
        description="You haven't made any deposits to this pool. Make your first deposit to start earning returns."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5" />
          My Deposits
        </CardTitle>
        <CardDescription>Your deposit history in this pool</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Deposited</TableHead>
              <TableHead>Days Active</TableHead>
              <TableHead>Estimated Return</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deposits.map((deposit) => (
              <TableRow key={deposit.id}>
                <TableCell className="font-medium">{formatBalance(deposit.amount)} tokens</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-slate-400" />
                    {formatDate(deposit.depositedAt)}
                  </div>
                </TableCell>
                <TableCell>{calculateDaysSince(deposit.depositedAt)} days</TableCell>
                <TableCell className="font-medium text-slate-900">
                  {formatBalance(deposit.estimatedReturn)} tokens
                </TableCell>
                <TableCell>
                  {deposit.status === 'active' ? (
                    <Badge variant="verde">Active</Badge>
                  ) : (
                    <Badge variant="rojo">Withdrawn</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-900">Total Deposited</span>
            <span className="text-sm font-semibold text-slate-900">
              {formatBalance(
                deposits
                  .filter((d) => d.status === 'active')
                  .reduce((sum, d) => sum + d.amount, 0n)
              )}{' '}
              tokens
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium text-slate-900">Total Estimated Returns</span>
            <span className="text-sm font-semibold text-slate-900">
              {formatBalance(
                deposits
                  .filter((d) => d.status === 'active')
                  .reduce((sum, d) => sum + d.estimatedReturn, 0n)
              )}{' '}
              tokens
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

