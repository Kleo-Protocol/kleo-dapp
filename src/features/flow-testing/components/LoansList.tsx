'use client';

import { usePendingLoans, useActiveLoans, useLoan } from '@/features/pools/hooks/use-loan-queries';
import { useVouchesForLoan } from '@/features/pools/hooks/use-vouch-queries';
import { useMemo } from 'react';

/**
 * Component to display all loans with their details
 * Gets loan IDs from pending/active loans, then fetches full loan details for each
 */
export function LoansList() {
  const { data: pendingLoans, isLoading: isLoadingPending } = usePendingLoans();
  const { data: activeLoans, isLoading: isLoadingActive } = useActiveLoans();

  // Combine all loan IDs (pending + active)
    const allLoanIds = useMemo(() => {
      const pending = (pendingLoans ?? []).map(id => typeof id === 'bigint' ? id : BigInt(id));
      const active = (activeLoans ?? []).map(id => typeof id === 'bigint' ? id : BigInt(id));
      return [...pending, ...active];
    }, [pendingLoans, activeLoans]);

  const isLoading = isLoadingPending || isLoadingActive;

  if (isLoading) {
    return (
      <div className="p-4 text-center text-slate-600">
        Loading loans...
      </div>
    );
  }

  if (allLoanIds.length === 0) {
    return (
      <div className="p-4 text-center text-slate-600">
        No loans found
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-900">
        All Loans ({allLoanIds.length})
      </h3>
      <div className="grid gap-4 max-h-[500px] overflow-y-auto">
        {allLoanIds.map((loanId) => {
          const loanIdStr = typeof loanId === 'bigint' ? loanId.toString() : String(loanId);
          return <LoanCard key={loanIdStr} loanId={loanId} />;
        })}
      </div>
    </div>
  );
}

function LoanCard({ loanId }: { loanId: bigint }) {
  // Fetch full loan details using getLoan
  const { data: loan, isLoading } = useLoan(loanId);
  const { data: vouchCount } = useVouchesForLoan(loanId);

  if (isLoading) {
    return (
      <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
        <p className="text-slate-600">Loading loan {loanId.toString()}...</p>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
        <p className="text-slate-600">Loan {loanId.toString()} not found</p>
      </div>
    );
  }

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
      // Try to stringify if it has a toString method
      if (typeof address.toString === 'function') {
        return address.toString();
      }
      // Fallback: try to get string representation
      return String(address);
    }
    return String(address);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Pending': return '#ffa500';
      case 'Active': return '#007bff';
      case 'Repaid': return '#28a745';
      case 'Defaulted': return '#dc3545';
      default: return '#666';
    }
  };

  // Calculate days left until due date
  // startTime is in seconds (block timestamp), term is in seconds
  // dueTime = startTime (s) + term (s)
  const calculateDaysLeft = (): number | string => {
    if (loan.status !== 'Active' || !loan.startTime || loan.startTime === 0n) return 'N/A';
    
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
  const termInDays = loan.term > 0n 
    ? Math.floor(Number(loan.term) / (60 * 60 * 24)) 
    : 0;

  // Use totalRepaymentAmount from contract if available, otherwise calculate
  const totalRepayment = 'totalRepaymentAmount' in loan && loan.totalRepaymentAmount
    ? loan.totalRepaymentAmount
    : null;

  // Interest rate: contract stores it as basis points
  // From dry run: interest_rate: 5000000000 = 5%
  // So divide by 10^8 to get percentage (5000000000 / 100000000 = 5)
  const interestRatePercent = loan.interestRate > 0n 
    ? (Number(loan.interestRate) / 100000000).toFixed(2)
    : '0.00';

  // Calculate days left once
  const daysLeft = calculateDaysLeft();

  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <strong className="text-lg text-slate-900">Loan #{loanId.toString()}</strong>
          <span
            className="px-2 py-1 text-xs font-semibold text-white rounded"
            style={{ backgroundColor: getStatusColor(loan.status) }}
          >
            {loan.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <strong className="text-slate-600 font-medium">Borrower:</strong>
          <div className="mt-1 font-mono text-xs text-slate-800">
            {formatAddress(loan.borrower).slice(0, 10)}...{formatAddress(loan.borrower).slice(-8)}
          </div>
        </div>

        <div>
          <strong className="text-slate-600 font-medium">Amount:</strong>
          <div className="mt-1 text-slate-800 font-medium">
            {formatTokenAmount(loan.amount, LOAN_DECIMALS)} tokens
          </div>
        </div>

        {totalRepayment && (
          <div>
            <strong className="text-slate-600 font-medium">Total Repayment:</strong>
            <div className="mt-1 text-slate-800 font-medium">
              {formatTokenAmount(totalRepayment, LOAN_DECIMALS)} tokens
            </div>
          </div>
        )}

        <div>
          <strong className="text-slate-600 font-medium">Interest Rate:</strong>
          <div className="mt-1 text-slate-800">
            {interestRatePercent}%
          </div>
        </div>

        {loan.status === 'Pending' && (
          <div>
            <strong className="text-slate-600 font-medium">Vouches:</strong>
            <div className="mt-1 text-slate-800">
              {vouchCount ?? 0}
            </div>
          </div>
        )}

        {loan.status === 'Active' && loan.startTime && loan.startTime !== 0n && (
          <div>
            <strong className="text-slate-600 font-medium">Days Left:</strong>
            <div className="mt-1 text-slate-800">
              {typeof daysLeft === 'number' 
                ? `${daysLeft} days`
                : daysLeft}
            </div>
          </div>
        )}

        <div>
          <strong className="text-slate-600 font-medium">Term:</strong>
          <div className="mt-1 text-slate-800">
            {termInDays} days
          </div>
        </div>
      </div>
    </div>
  );
}

