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
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Users, Clock, TrendingUp, Inbox } from 'lucide-react';
import { SimulationModal } from './simulation-modal';
import { BackModal } from './back-modal';
import { EmptyState } from '@/shared/components/empty-state';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { formatBalance, formatInterestRate } from '@/shared/utils/format';
import { getDaysRemaining } from '@/lib/loan-utils';
import type { LoanDetails } from '@/lib/types';

interface PendingRequestsTableProps {
  requests: LoanDetails[];
  isLoading?: boolean;
}

export function PendingRequestsTable({ requests = [], isLoading = false }: PendingRequestsTableProps) {
  const [simulationLoanId, setSimulationLoanId] = useState<string | null>(null);
  const [backLoanId, setBackLoanId] = useState<string | null>(null);

  const formatDate = (timestamp: number | bigint) => {
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
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
        title="No Pending Requests"
        description="There are no loan requests available for funding at this time. Check back later for new opportunities."
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Pending Loan Requests
          </CardTitle>
          <CardDescription>Loan requests available for funding. Review carefully before backing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Interest Rate</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Lenders</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                const loanIdStr = request.loanId.toString();
                const daysRemaining = getDaysRemaining(request);
                const termDays = Math.floor(Number(request.term) / (24 * 60 * 60));
                const vouchersCount = request.vouchers?.length || 0;
                
                return (
                  <TableRow key={loanIdStr}>
                    <TableCell className="font-medium">
                      {formatBalance(request.amount)} tokens
                    </TableCell>
                    <TableCell>
                      {/* Progress not applicable for contract loans - they're either Active or not */}
                      <span className="text-sm text-slate-600">N/A</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="size-4 text-slate-400" />
                        {formatInterestRate(request.interestRate)}
                      </div>
                    </TableCell>
                    <TableCell>{termDays} days</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="size-4 text-slate-400" />
                        {vouchersCount} {vouchersCount === 1 ? 'voucher' : 'vouchers'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(Number(request.startTime) * 1000)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSimulationLoanId(loanIdStr)}
                                disabled={isLoading}
                              >
                                Simulate
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Preview returns and risks before backing</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setBackLoanId(loanIdStr)}
                                disabled={isLoading || request.status !== 'Active'}
                              >
                                Back
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Fund this loan request</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {simulationLoanId && (
        <SimulationModal
          loanId={simulationLoanId}
          loan={requests.find((r) => r.loanId === simulationLoanId)}
          open={!!simulationLoanId}
          onOpenChange={(open) => !open && setSimulationLoanId(null)}
        />
      )}

      {backLoanId && (
        <BackModal
          loanId={backLoanId}
          loan={requests.find((r) => r.loanId === backLoanId)}
          open={!!backLoanId}
          onOpenChange={(open) => !open && setBackLoanId(null)}
        />
      )}
    </>
  );
}

