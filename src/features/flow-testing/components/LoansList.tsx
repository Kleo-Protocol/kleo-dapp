'use client';

import { usePendingLoans, useActiveLoans, useLoan, useRepaymentAmount } from '@/features/pools/hooks/use-loan-queries';
import { useVouchesForLoan } from '@/features/pools/hooks/use-vouch-queries';

/**
 * Component to display all loans with their details
 */
export function LoansList() {
  const { data: pendingLoans } = usePendingLoans();
  const { data: activeLoans } = useActiveLoans();

  // Convert BigInt loan IDs to strings for React rendering
  const allLoanIds = [
    ...(pendingLoans ?? []).map(id => typeof id === 'bigint' ? id : BigInt(id)),
    ...(activeLoans ?? []).map(id => typeof id === 'bigint' ? id : BigInt(id)),
  ];

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
  const { data: loan, isLoading } = useLoan(loanId);
  const { data: repaymentAmount } = useRepaymentAmount(loanId);
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

  const formatTokenAmount = (amount: bigint, decimals: number): string => {
    return (Number(amount) / 10 ** decimals).toFixed(4);
  };

  // Format repayment amount - contract returns it 10^8 times too large
  const formatRepaymentAmount = (amount: bigint): string => {
    // Divide by 10^8 to correct the scaling, then by 10^18 for decimals
    return (Number(amount) / 10 ** 26).toFixed(4);
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

  const formatDate = (timestamp: bigint): string => {
    if (timestamp === 0n) return 'N/A';
    const date = new Date(Number(timestamp));
    return date.toLocaleString();
  };

  const calculateDueDate = (): string => {
    if (loan.status !== 'Active' || !loan.startTime) return 'N/A';
    const dueTime = Number(loan.startTime) + Number(loan.term);
    return formatDate(BigInt(dueTime));
  };

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
          <div className="mt-1 text-slate-800">
            {formatTokenAmount(loan.amount, 18)} tokens
          </div>
        </div>

        {repaymentAmount && (
          <div>
            <strong className="text-slate-600 font-medium">Repayment:</strong>
            <div className="mt-1 text-slate-800 font-medium">
              {formatRepaymentAmount(repaymentAmount)} tokens
            </div>
          </div>
        )}

        <div>
          <strong className="text-slate-600 font-medium">Interest Rate:</strong>
          <div className="mt-1 text-slate-800">
            {(Number(loan.interestRate) / 1000000000).toFixed(2)}%
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

        {loan.status === 'Active' && loan.startTime && (
          <div>
            <strong className="text-slate-600 font-medium">Due Date:</strong>
            <div className="mt-1 text-xs text-slate-700">
              {calculateDueDate()}
            </div>
          </div>
        )}

        {loan.startTime && loan.startTime !== 0n && (
          <div>
            <strong className="text-slate-600 font-medium">Start Time:</strong>
            <div className="mt-1 text-xs text-slate-700">
              {formatDate(loan.startTime)}
            </div>
          </div>
        )}

        <div>
          <strong className="text-slate-600 font-medium">Term:</strong>
          <div className="mt-1 text-slate-800">
            {Math.floor(Number(loan.term) / (1000 * 60 * 60 * 24))} days
          </div>
        </div>
      </div>
    </div>
  );
}

