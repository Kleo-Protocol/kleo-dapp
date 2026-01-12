'use client';

import { usePendingLoans, useActiveLoans, useLoan } from '@/features/pools/hooks/use-loan-queries';
import { useVouchesForLoan } from '@/features/pools/hooks/use-vouch-queries';
import { useMemo, useState } from 'react';
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
import { Clock, Users, DollarSign, Inbox, Shield } from 'lucide-react';
import { EmptyState } from '@/shared/components/empty-state';
import { formatBalance, formatInterestRate } from '@/shared/utils/format';
import { VouchModal } from './vouch-modal';

interface LoansListTableProps {
  showVouchButton?: boolean;
  showOnlyPending?: boolean;
}

/**
 * Component to display all loans in a table format
 * Gets loan IDs from pending/active loans, then fetches full loan details for each
 */
export function LoansListTable({ showVouchButton = false, showOnlyPending = false }: LoansListTableProps = {}) {
  const { data: pendingLoans, isLoading: isLoadingPending } = usePendingLoans();
  const { data: activeLoans, isLoading: isLoadingActive } = useActiveLoans();

  // Combine all loan IDs (pending + active), or only pending if showOnlyPending is true
  const allLoanIds = useMemo(() => {
    const pending = (pendingLoans ?? []).map(id => typeof id === 'bigint' ? id : BigInt(id));
    if (showOnlyPending) {
      return pending;
    }
    const active = (activeLoans ?? []).map(id => typeof id === 'bigint' ? id : BigInt(id));
    return [...pending, ...active];
  }, [pendingLoans, activeLoans, showOnlyPending]);

  const isLoading = isLoadingPending || isLoadingActive;

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

  if (allLoanIds.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="size-12" />}
        title="No Loans Found"
        description="There are no loans in the system yet. Create a loan request to get started."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="size-5" />
          All Loans ({allLoanIds.length})
        </CardTitle>
        <CardDescription>All pending and active loans in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loan ID</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Interest Rate</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Total Repayment</TableHead>
              <TableHead>Vouches</TableHead>
              <TableHead>Days Left</TableHead>
              <TableHead>Status</TableHead>
              {showVouchButton && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {allLoanIds.map((loanId) => {
              const loanIdStr = typeof loanId === 'bigint' ? loanId.toString() : String(loanId);
              return (
                <LoanTableRow key={loanIdStr} loanId={loanId} showVouchButton={showVouchButton} />
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Component for each loan row - uses useLoan directly like LoanCard
function LoanTableRow({ loanId, showVouchButton = false }: { loanId: bigint; showVouchButton?: boolean }) {
  const [vouchModalOpen, setVouchModalOpen] = useState(false);
  // Fetch full loan details using getLoan - same as LoansList
  const { data: loan, isLoading } = useLoan(loanId);
  const { data: vouchCount } = useVouchesForLoan(loanId);

  // Loans use 10 decimals for amounts (based on dry run: 500000000000 = 50 tokens)
  const LOAN_DECIMALS = 10;

  const formatTokenAmount = (amount: bigint, decimals: number): string => {
    if (amount === 0n) return '0.0000';
    return (Number(amount) / 10 ** decimals).toFixed(4);
  };

  const formatAddress = (address: string | { raw?: string } | any): string => {
    // Handle AccountId32 which might be an object with raw property
    if (typeof address === 'object' && address !== null) {
      if ('raw' in address) {
        return String(address.raw);
      }
      if (typeof address.toString === 'function') {
        return address.toString();
      }
      return String(address);
    }
    return String(address);
  };

  const getStatusColor = (status: string): 'verde' | 'amarillo' | 'rojo' => {
    switch (status) {
      case 'Pending': return 'amarillo';
      case 'Active': return 'verde';
      case 'Repaid': return 'verde';
      case 'Defaulted': return 'rojo';
      default: return 'amarillo';
    }
  };

  // Calculate days left until due date
  // startTime is in seconds (block timestamp), term is in seconds
  // dueTime = startTime (s) + term (s)
  const calculateDaysLeft = (): number | string => {
    if (loan?.status !== 'Active' || !loan?.startTime || loan.startTime === 0n) return 'N/A';
    
    // Both startTime and term are in seconds
    const dueTime = loan.startTime + loan.term;
    // Current time in seconds (Unix timestamp)
    const now = BigInt(Math.floor(Date.now() / 1000));
    
    if (now > dueTime) {
      return 'Overdue';
    }
    
    // Calculate days remaining (in seconds)
    const secondsRemaining = dueTime - now;
    const daysRemaining = Math.floor(Number(secondsRemaining) / (60 * 60 * 24));
    return daysRemaining;
  };

  // Calculate term in days (term is in seconds: 25920000 seconds = 300 days)
  const termInDays = loan?.term && loan.term > 0n 
    ? Math.floor(Number(loan.term) / (60 * 60 * 24)) 
    : 0;

  // Use totalRepaymentAmount from contract if available, otherwise calculate
  const totalRepayment = loan && 'totalRepaymentAmount' in loan && loan.totalRepaymentAmount
    ? loan.totalRepaymentAmount
    : null;

  // Interest rate: contract stores it as basis points
  // From dry run: interest_rate: 5000000000 = 5%
  // So divide by 10^8 to get percentage (5000000000 / 100000000 = 5)
  const interestRatePercent = loan?.interestRate && loan.interestRate > 0n 
    ? (Number(loan.interestRate) / 100000000).toFixed(2)
    : '0.00';

  const colSpan = showVouchButton ? 10 : 9;

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan}>
          <Skeleton className="h-12 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  if (!loan) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
          Loan {loanId.toString()} not found
        </TableCell>
      </TableRow>
    );
  }

  // Calculate days left once
  const daysLeft = calculateDaysLeft();
  const borrowerAddress = formatAddress(loan.borrower);

  // Convert loan to LoanDetails format for the modal (only if showVouchButton is true)
  const loanDetails = showVouchButton ? {
    loanId: BigInt(loanId),
    borrower: borrowerAddress,
    amount: loan.amount,
    interestRate: loan.interestRate,
    term: loan.term,
    purpose: loan.purpose || new Uint8Array(),
    startTime: loan.startTime || 0n,
    status: loan.status as 'Active' | 'Repaid' | 'Defaulted' | 'Pending',
    vouchers: [],
    dueTime: (loan.startTime || 0n) + loan.term,
    totalRepayment: totalRepayment || 0n,
    daysRemaining: typeof daysLeft === 'number' ? daysLeft : 0,
    isOverdue: false,
  } : null;

  return (
    <TableRow>
      <TableCell className="font-medium">
        #{loanId.toString()}
      </TableCell>
      <TableCell>
        <div className="font-mono text-xs">
          {borrowerAddress.slice(0, 10)}...{borrowerAddress.slice(-8)}
        </div>
      </TableCell>
      <TableCell className="font-medium">
        {formatTokenAmount(loan.amount, LOAN_DECIMALS)} tokens
      </TableCell>
      <TableCell>
        {interestRatePercent}%
      </TableCell>
      <TableCell>
        {termInDays} days
      </TableCell>
      <TableCell className="font-medium">
        {totalRepayment ? formatTokenAmount(totalRepayment, LOAN_DECIMALS) : 'N/A'} tokens
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Users className="size-4 text-muted-foreground" />
          {loan.status === 'Pending' ? (vouchCount ?? 0) : 'N/A'}
        </div>
      </TableCell>
      <TableCell>
        {loan.status === 'Active' && loan.startTime && loan.startTime !== 0n ? (
          <div className="flex items-center gap-1">
            <Clock className="size-4 text-muted-foreground" />
            {typeof daysLeft === 'number' 
              ? `${daysLeft} days`
              : daysLeft}
          </div>
        ) : (
          'N/A'
        )}
      </TableCell>
      <TableCell>
        <Badge variant={getStatusColor(loan.status)}>
          {loan.status}
        </Badge>
      </TableCell>
      {showVouchButton && (
        <TableCell>
          {loan.status === 'Pending' ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setVouchModalOpen(true)}
                className="gap-2"
                disabled={!loanDetails}
              >
                <Shield className="size-4" />
                Vouch
              </Button>
              {loanDetails && (
                <VouchModal
                  loanId={loanId.toString()}
                  loan={loanDetails}
                  open={vouchModalOpen}
                  onOpenChange={setVouchModalOpen}
                />
              )}
            </>
          ) : (
            <span className="text-muted-foreground text-sm">N/A</span>
          )}
        </TableCell>
      )}
    </TableRow>
  );
}
