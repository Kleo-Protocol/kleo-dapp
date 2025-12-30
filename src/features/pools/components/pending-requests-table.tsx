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
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { Users, Clock, TrendingUp, AlertCircle, Inbox } from 'lucide-react';
import { SimulationModal } from './simulation-modal';
import { BackModal } from './back-modal';
import { EmptyState } from '@/shared/components/empty-state';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { formatBalance, formatInterestRate } from '@/shared/utils/format';
import type { LoanDetails } from '@/services/mock/loans.mock';

interface PendingRequestsTableProps {
  requests: LoanDetails[];
  isLoading?: boolean;
}

// Mock pending requests data
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
  {
    loanId: '0x5555555555555555555555555555555555555555555555555555555555555555',
    borrower: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    requestedAmount: 3000000000000000000n,
    fundedAmount: 0n,
    lenderCount: 0,
    interestRate: 1200n,
    penaltyRate: 400n,
    duration: BigInt(30 * 24 * 60 * 60),
    startTime: BigInt(0),
    dueTime: BigInt(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'pending',
    poolId: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    lenders: [],
    remainingAmount: 3000000000000000000n,
    progress: 0,
    daysRemaining: 30,
    totalRepayment: 3300000000000000000n,
    isOverdue: false,
  },
];

export function PendingRequestsTable({ requests = mockRequests, isLoading = false }: PendingRequestsTableProps) {
  const [simulationLoanId, setSimulationLoanId] = useState<string | null>(null);
  const [backLoanId, setBackLoanId] = useState<string | null>(null);

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
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="size-4 text-slate-400" />
                      {formatInterestRate(request.interestRate)}
                    </div>
                  </TableCell>
                  <TableCell>{Math.floor(Number(request.duration) / (24 * 60 * 60))} days</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="size-4 text-slate-400" />
                      {request.lenderCount}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSimulationLoanId(request.loanId)}
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
                              onClick={() => setBackLoanId(request.loanId)}
                              disabled={isLoading}
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
              ))}
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

