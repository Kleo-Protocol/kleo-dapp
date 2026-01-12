'use client';

import { useMemo } from 'react';
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
import { usePendingLoans, useLoan } from '@/features/pools/hooks/use-loan-queries';
import { useVouchesForLoan } from '@/features/pools/hooks/use-vouch-queries';
import { contractLoanToLoan } from '@/lib/loan-utils';
import { useTypink } from 'typink';

/**
 * Component to display loan requests - same pattern as LoansList
 * Gets loan IDs from pending loans, then fetches full loan details for each
 * Only shows loans for the connected user
 */
export function RequestsTable() {
  const { connectedAccount } = useTypink();
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

  // We'll filter loans by user in the RequestRow component
  // So we pass all loanIds and let each row check if it belongs to the user
  const userLoanIds = loanIds;

  if (loanIds.length === 0 && !isLoadingIds) {
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
            {userLoanIds.map((loanId) => {
              const loanIdStr = typeof loanId === 'bigint' ? loanId.toString() : String(loanId);
              return (
                <RequestRow key={loanIdStr} loanId={loanId} userAddress={connectedAccount?.address} />
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Component for each loan row - uses useLoan directly like LoanCard
function RequestRow({ loanId, userAddress }: { loanId: bigint; userAddress?: string }) {
  // Fetch full loan details using getLoan - same as LoansList
  const { data: loan, isLoading } = useLoan(loanId);
  const { data: vouchCount } = useVouchesForLoan(loanId);

  const formatDate = (timestamp: bigint) => {
    // startTime is in seconds (block timestamp), convert to milliseconds for Date constructor
    const ts = Number(timestamp) * 1000;
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <Skeleton className="h-12 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  if (!loan) {
    return null;
  }

  // Check if this loan belongs to the connected user
  if (!userAddress) {
    return null; // No user connected
  }
  
  const borrowerAddress = formatAddress(loan.borrower);
  const isUserLoan = borrowerAddress.toLowerCase() === userAddress.toLowerCase();
  
  // Don't render if it's not the user's loan
  if (!isUserLoan) {
    return null;
  }

  // Convert to LoanDetails for display
  const uiLoan = contractLoanToLoan(loan);
  const vouchersCount = vouchCount ?? 0;
  
  return (
    <TableRow>
      <TableCell className="font-medium">
        {formatBalance(uiLoan.amount)} tokens
      </TableCell>
      <TableCell>
        {/* Progress not applicable - loans are immediately Active when created */}
        <span className="text-sm text-slate-600">N/A</span>
      </TableCell>
      <TableCell>{formatInterestRate(uiLoan.interestRate)}</TableCell>
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
        {uiLoan.status === 'Active' ? (
          <Badge variant="verde">Active</Badge>
        ) : uiLoan.status === 'Repaid' ? (
          <Badge variant="verde">Repaid</Badge>
        ) : uiLoan.status === 'Defaulted' ? (
          <Badge variant="rojo">Defaulted</Badge>
        ) : (
          <Badge variant="amarillo">{uiLoan.status}</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

