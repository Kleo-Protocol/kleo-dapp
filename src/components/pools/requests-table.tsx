'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, TrendingUp, Users, Inbox } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { formatBalance, formatInterestRate } from '@/utils/format';
import type { LoanDetails } from '@/services/mock/loans.mock';

interface RequestsTableProps {
  requests: LoanDetails[];
  isLoading?: boolean;
}

// Mock requests data
const mockRequests: LoanDetails[] = [
  {
    loanId: '0x2222222222222222222222222222222222222222222222222222222222222222',
    borrower: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    requestedAmount: 5000000000000000000n,
    fundedAmount: 3500000000000000000n,
    lenderCount: 2,
    interestRate: 800n,
    penaltyRate: 300n,
    duration: BigInt(60 * 24 * 60 * 60),
    startTime: BigInt(0),
    dueTime: BigInt(Date.now() + 60 * 24 * 60 * 60 * 1000),
    status: 'funding',
    poolId: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    lenders: [],
    remainingAmount: 1500000000000000000n,
    progress: 70,
    daysRemaining: 60,
    totalRepayment: 5400000000000000000n,
    isOverdue: false,
  },
];

export function RequestsTable({ requests = mockRequests, isLoading = false }: RequestsTableProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
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

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="size-12" />}
        title="No Loan Requests"
        description="You haven't created any loan requests yet. Submit a request to start borrowing from this pool."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5" />
          Loan Requests
        </CardTitle>
        <CardDescription>Your pending and funding loan requests</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Interest Rate</TableHead>
              <TableHead>Lenders</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.loanId}>
                <TableCell className="font-medium">
                  {formatBalance(request.requestedAmount)} tokens
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full"
                        style={{ width: `${request.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600 w-12 text-right">{request.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>{formatInterestRate(request.interestRate)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="size-4 text-slate-400" />
                    {request.lenderCount}
                  </div>
                </TableCell>
                <TableCell>{formatDate(request.createdAt)}</TableCell>
                <TableCell>
                  {request.status === 'pending' ? (
                    <Badge variant="amarillo">Pending</Badge>
                  ) : (
                    <Badge variant="verde">Funding</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

