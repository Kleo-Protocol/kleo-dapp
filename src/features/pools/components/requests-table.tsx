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
import { Clock, Users, Inbox } from 'lucide-react';
import { EmptyState } from '@/shared/components/empty-state';
import { formatBalance, formatInterestRate } from '@/shared/utils/format';
import type { LoanDetails } from '@/lib/types';

interface RequestsTableProps {
  requests: LoanDetails[];
  isLoading?: boolean;
}

export function RequestsTable({ requests = [], isLoading = false }: RequestsTableProps) {
  const formatDate = (timestamp: number | bigint) => {
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) * 1000 : timestamp;
    return new Date(ts).toLocaleDateString('en-US', {
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
            {requests.map((request) => {
              const loanIdStr = request.loanId.toString();
              const vouchersCount = request.vouchers?.length || 0;
              
              return (
                <TableRow key={loanIdStr}>
                  <TableCell className="font-medium">
                    {formatBalance(request.amount)} tokens
                  </TableCell>
                  <TableCell>
                    {/* Progress not applicable - loans are immediately Active when created */}
                    <span className="text-sm text-slate-600">N/A</span>
                  </TableCell>
                  <TableCell>{formatInterestRate(request.interestRate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="size-4 text-slate-400" />
                      {vouchersCount} {vouchersCount === 1 ? 'voucher' : 'vouchers'}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(request.startTime)}</TableCell>
                  <TableCell>
                    {request.status === 'Active' ? (
                      <Badge variant="verde">Active</Badge>
                    ) : request.status === 'Repaid' ? (
                      <Badge variant="verde">Repaid</Badge>
                    ) : (
                      <Badge variant="rojo">Defaulted</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

