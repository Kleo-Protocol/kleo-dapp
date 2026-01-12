'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { DollarSign, Clock, AlertCircle } from 'lucide-react';
import { useTypink } from 'typink';
import { useActiveLoans, useLoan, useRepaymentAmount } from '@/features/pools/hooks/use-loan-queries';
import { useRepayLoan } from '@/features/pools/hooks/use-loan-transactions';
import { AddressConverter } from '@/lib/address-converter';
import { toast } from 'sonner';

export function MyLoansCard() {
  const { connectedAccount, network } = useTypink();
  const { data: activeLoans, isLoading } = useActiveLoans();
  const { repayLoan } = useRepayLoan();
  const decimals = network?.decimals ?? 12;

  // Get all active loan IDs
  const allLoanIds = useMemo(() => {
    if (!activeLoans) return [];
    
    return activeLoans.map(id => {
      const loanIdBigInt = typeof id === 'bigint' ? id : BigInt(id);
      return loanIdBigInt;
    });
  }, [activeLoans]);

  if (!connectedAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            My Loans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Connect your wallet to view your loans
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            My Loans
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {allLoanIds.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isLoading ? 'Loading...' : 'You don\'t have any active loans'}
            </p>
          ) : (
            allLoanIds.map((loanId) => (
              <LoanItem
                key={loanId.toString()}
                loanId={loanId}
                connectedAddress={connectedAccount.address}
                repayLoan={repayLoan}
                decimals={decimals}
              />
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}

function LoanItem({
  loanId,
  connectedAddress,
  repayLoan,
  decimals,
}: {
  loanId: bigint;
  connectedAddress: string;
  repayLoan: (loanId: bigint, repaymentAmount: bigint) => Promise<void>;
  decimals: number;
}) {
  const { data: loan, isLoading } = useLoan(loanId);
  const { data: repaymentAmount } = useRepaymentAmount(loanId);
  const [isRepaying, setIsRepaying] = useState(false);
  const LOAN_DECIMALS = 10;

  const formatTokenAmount = (amount: bigint, decimals: number): string => {
    if (amount === 0n) return '0.0000';
    return (Number(amount) / 10 ** decimals).toFixed(4);
  };

  const formatAddress = (address: string | { raw?: string } | any): string => {
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
      <div className="rounded-lg border border-border p-4">
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">Loan {loanId.toString()} not found</p>
      </div>
    );
  }

  // Check if this loan belongs to the connected user
  const borrowerAddress = formatAddress(loan.borrower);
  
  // Try multiple comparison methods for address matching
  const isMyLoan = (() => {
    if (!borrowerAddress || !connectedAddress) {
      return false;
    }
    
    // Helper to detect if address is SS58 format (starts with number/letter, typically 47-48 chars)
    const isSS58 = (addr: string): boolean => {
      return /^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(addr.trim());
    };
    
    // Helper to detect if address is H160 hex format (starts with 0x, 42 chars total)
    const isH160 = (addr: string): boolean => {
      return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
    };
    
    // Try direct comparison (case-insensitive)
    const borrowerLower = borrowerAddress.toLowerCase().trim();
    const connectedLower = connectedAddress.toLowerCase().trim();
    
    if (borrowerLower === connectedLower) {
      return true;
    }
    
    // If both are SS58, compare directly
    if (isSS58(borrowerAddress) && isSS58(connectedAddress)) {
      return borrowerAddress === connectedAddress;
    }
    
    // If both are H160, compare directly
    if (isH160(borrowerAddress) && isH160(connectedAddress)) {
      return borrowerLower === connectedLower;
    }
    
    // Try using AddressConverter only when formats are different (SS58 <-> H160)
    try {
      const borrowerIsSS58 = isSS58(borrowerAddress);
      const connectedIsSS58 = isSS58(connectedAddress);
      const borrowerIsH160 = isH160(borrowerAddress);
      const connectedIsH160 = isH160(connectedAddress);
      
      // Only use AddressConverter if one is SS58 and the other is H160
      if ((borrowerIsSS58 && connectedIsH160) || (borrowerIsH160 && connectedIsSS58)) {
        if (AddressConverter.isEqual(connectedAddress, borrowerAddress)) {
          return true;
        }
        // Try reverse order
        if (AddressConverter.isEqual(borrowerAddress, connectedAddress)) {
          return true;
        }
      }
    } catch (error) {
      // Silently continue to other comparison methods
    }
    
    // Try normalized hex comparison (remove 0x prefix and compare)
    const normalizedBorrower = borrowerLower.replace(/^0x/, '');
    const normalizedConnected = connectedLower.replace(/^0x/, '');
    if (normalizedBorrower === normalizedConnected && normalizedBorrower.length === 40) {
      return true;
    }
    
    // Try comparing last 40 chars (hex address without prefix)
    if (normalizedBorrower.length >= 40 && normalizedConnected.length >= 40) {
      if (normalizedBorrower.slice(-40) === normalizedConnected.slice(-40)) {
        return true;
      }
    }
    
    return false;
  })();

  if (!isMyLoan) {
    return null; // Don't render loans that don't belong to the user
  }

  // Calculate days left
  const calculateDaysLeft = (): number | string => {
    if (loan.status !== 'Active' || !loan.startTime || loan.startTime === 0n) return 'N/A';
    
    const dueTime = loan.startTime + loan.term;
    const now = BigInt(Math.floor(Date.now() / 1000));
    
    if (now > dueTime) {
      return 'Overdue';
    }
    
    const secondsRemaining = dueTime - now;
    const daysRemaining = Math.floor(Number(secondsRemaining) / (60 * 60 * 24));
    return daysRemaining;
  };

  const daysLeft = calculateDaysLeft();
  const isOverdue = daysLeft === 'Overdue';
  const totalRepayment = 'totalRepaymentAmount' in loan && loan.totalRepaymentAmount
    ? loan.totalRepaymentAmount
    : null;

  const handleRepay = async () => {
    if (!repaymentAmount) {
      toast.error('Repayment amount not available');
      return;
    }

    setIsRepaying(true);
    try {
      // Convert repayment amount from 18 decimals (loan contract) to network decimals
      // Loans use 18 decimals, but transaction value must be in network decimals
      const loanDecimals = 18;
      const conversionFactor = 10n ** BigInt(loanDecimals - decimals);
      const repaymentAmountInNetworkDecimals = repaymentAmount / conversionFactor;
      await repayLoan(loanId, repaymentAmountInNetworkDecimals);
      toast.success('Loan repaid successfully');
    } catch (error) {
      console.error('Error repaying loan:', error);
      toast.error('Failed to repay loan');
    } finally {
      setIsRepaying(false);
    }
  };

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-card-foreground">Loan #{loanId.toString()}</span>
            <Badge variant={isOverdue ? 'rojo' : 'verde'}>
              {loan.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Amount:</span>
              <span className="ml-2 font-medium text-card-foreground">
                {formatTokenAmount(loan.amount, LOAN_DECIMALS)} tokens
              </span>
            </div>
            {totalRepayment && (
              <div>
                <span className="text-muted-foreground">Total Repayment:</span>
                <span className="ml-2 font-medium text-card-foreground">
                  {formatTokenAmount(totalRepayment, LOAN_DECIMALS)} tokens
                </span>
              </div>
            )}
            {repaymentAmount && (
              <div>
                <span className="text-muted-foreground">Repayment Amount:</span>
                <span className="ml-2 font-medium text-card-foreground">
                  {formatTokenAmount(repaymentAmount, LOAN_DECIMALS)} tokens
                </span>
              </div>
            )}
            {daysLeft !== 'N/A' && (
              <div className="flex items-center gap-1">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Days Left:</span>
                <span className={`ml-2 font-medium ${isOverdue ? 'text-red-600' : 'text-card-foreground'}`}>
                  {typeof daysLeft === 'number' ? `${daysLeft} days` : daysLeft}
                </span>
              </div>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="default"
          onClick={handleRepay}
          disabled={isRepaying || !repaymentAmount}
          className="gap-2"
        >
          <DollarSign className="size-4" />
          {isRepaying ? 'Repaying...' : 'Repay'}
        </Button>
      </div>
      {isOverdue && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm text-red-800">
          <AlertCircle className="size-4" />
          <span>This loan is overdue. Please repay as soon as possible.</span>
        </div>
      )}
    </div>
  );
}

