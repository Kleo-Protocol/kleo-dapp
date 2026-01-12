'use client';

import { useState, useMemo } from 'react';
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
import { EmptyState } from '@/shared/components/empty-state';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { formatBalance, formatInterestRate } from '@/shared/utils/format';
import { usePendingLoans, useLoan } from '@/features/pools/hooks/use-loan-queries';
import { contractLoanToLoan } from '@/lib/loan-utils';
import type { LoanDetails } from '@/lib/types';
import { SimulationModal } from './simulation-modal';
import { BackModal } from './back-modal';

export function PendingRequestsTable() {
  const [simulationLoanId, setSimulationLoanId] = useState<string | null>(null);
  const [backLoanId, setBackLoanId] = useState<string | null>(null);
  
  // Load pending loan IDs - same as LoansList
  const { data: pendingLoanIds, isLoading: isLoadingIds } = usePendingLoans();

  // Convert IDs to bigints - same as LoansList
  const loanIds = useMemo(() => {
    if (!pendingLoanIds) return [];
    return pendingLoanIds.map(id => typeof id === 'bigint' ? id : BigInt(id));
  }, [pendingLoanIds]);

  if (isLoadingIds) {
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

  if (loanIds.length === 0) {
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
              {loanIds.map((loanId) => {
                const loanIdStr = typeof loanId === 'bigint' ? loanId.toString() : String(loanId);
                return (
                  <PendingLoanRow
                    key={loanIdStr}
                    loanId={loanId}
                    onSimulate={() => setSimulationLoanId(loanIdStr)}
                    onBack={() => setBackLoanId(loanIdStr)}
                  />
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {simulationLoanId && (
        <PendingLoanModal
          loanId={BigInt(simulationLoanId)}
          type="simulation"
          onClose={() => setSimulationLoanId(null)}
        />
      )}

      {backLoanId && (
        <PendingLoanModal
          loanId={BigInt(backLoanId)}
          type="back"
          onClose={() => setBackLoanId(null)}
        />
      )}
    </>
  );
}

// Component for each loan row - uses useLoan directly like LoanCard
function PendingLoanRow({ 
  loanId, 
  onSimulate, 
  onBack 
}: { 
  loanId: bigint; 
  onSimulate: () => void;
  onBack: () => void;
}) {
  // Fetch full loan details using getLoan - same as LoansList
  const { data: loan, isLoading } = useLoan(loanId);

  const formatDate = (timestamp: bigint) => {
    // startTime is in seconds (block timestamp), convert to milliseconds for Date constructor
    const ts = Number(timestamp) * 1000;
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={7}>
          <Skeleton className="h-12 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  if (!loan) {
    return null;
  }

  // Convert to LoanDetails for display
  const uiLoan = contractLoanToLoan(loan);
  
  // Term is in seconds, convert to days
  const termDays = Math.floor(Number(uiLoan.term) / (60 * 60 * 24));
  const vouchersCount = uiLoan.vouchers?.length || 0;
  
  return (
    <TableRow>
      <TableCell className="font-medium">
        {formatBalance(uiLoan.amount)} tokens
      </TableCell>
      <TableCell>
        {/* Progress not applicable for contract loans - they're either Active or not */}
        <span className="text-sm text-slate-600">N/A</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <TrendingUp className="size-4 text-slate-400" />
          {formatInterestRate(uiLoan.interestRate)}
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
        {uiLoan.startTime ? formatDate(uiLoan.startTime) : 'N/A'}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onSimulate}
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
                  onClick={onBack}
                  disabled={isLoading || uiLoan.status === 'Repaid' || uiLoan.status === 'Defaulted'}
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
}

// Component to load loan and show modal
function PendingLoanModal({ loanId, type, onClose }: { loanId: bigint; type: 'simulation' | 'back'; onClose: () => void }) {
  const { data: loan } = useLoan(loanId);

  if (!loan) {
    return null;
  }

  const loanDetails: LoanDetails = {
    ...contractLoanToLoan(loan),
    progress: 100,
    remainingAmount: contractLoanToLoan(loan).totalRepayment,
  };

  if (type === 'simulation') {
    return (
      <SimulationModal
        loanId={loanId.toString()}
        loan={loanDetails}
        open={true}
        onOpenChange={(open) => !open && onClose()}
      />
    );
  }

  return (
    <BackModal
      loanId={loanId.toString()}
      loan={loanDetails}
      open={true}
      onOpenChange={(open) => !open && onClose()}
    />
  );
}

