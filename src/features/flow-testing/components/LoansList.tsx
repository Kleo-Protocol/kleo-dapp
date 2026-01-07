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
      <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
        No loans found
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem' }}>
        All Loans ({allLoanIds.length})
      </h3>
      <div style={{ 
        display: 'grid', 
        gap: '1rem',
        maxHeight: '500px',
        overflowY: 'auto',
      }}>
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
      <div style={{
        padding: '1rem',
        border: '1px solid #ddd',
        borderRadius: '6px',
        backgroundColor: '#f9f9f9',
      }}>
        Loading loan {loanId.toString()}...
      </div>
    );
  }

  if (!loan) {
    return (
      <div style={{
        padding: '1rem',
        border: '1px solid #ddd',
        borderRadius: '6px',
        backgroundColor: '#f9f9f9',
      }}>
        Loan {loanId.toString()} not found
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
    <div style={{
      padding: '1rem',
      border: '1px solid #ddd',
      borderRadius: '6px',
      backgroundColor: '#fff',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
        <div>
          <strong style={{ fontSize: '1.1rem' }}>Loan #{loanId.toString()}</strong>
          <span style={{
            marginLeft: '0.5rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: getStatusColor(loan.status),
            color: 'white',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
          }}>
            {loan.status}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
        <div>
          <strong style={{ color: '#666' }}>Borrower:</strong>
          <div style={{ marginTop: '0.25rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {formatAddress(loan.borrower).slice(0, 10)}...{formatAddress(loan.borrower).slice(-8)}
          </div>
        </div>

        <div>
          <strong style={{ color: '#666' }}>Amount:</strong>
          <div style={{ marginTop: '0.25rem' }}>
            {formatTokenAmount(loan.amount, 18)} tokens
          </div>
        </div>

        {repaymentAmount && (
          <div>
            <strong style={{ color: '#666' }}>Repayment:</strong>
            <div style={{ marginTop: '0.25rem' }}>
              {formatRepaymentAmount(repaymentAmount)} tokens
            </div>
          </div>
        )}

        <div>
          <strong style={{ color: '#666' }}>Interest Rate:</strong>
          <div style={{ marginTop: '0.25rem' }}>
            {(Number(loan.interestRate) / 1000000000).toFixed(2)}%
          </div>
        </div>

        {loan.status === 'Pending' && (
          <div>
            <strong style={{ color: '#666' }}>Vouches:</strong>
            <div style={{ marginTop: '0.25rem' }}>
              {vouchCount ?? 0}
            </div>
          </div>
        )}

        {loan.status === 'Active' && loan.startTime && (
          <div>
            <strong style={{ color: '#666' }}>Due Date:</strong>
            <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
              {calculateDueDate()}
            </div>
          </div>
        )}

        {loan.startTime && loan.startTime !== 0n && (
          <div>
            <strong style={{ color: '#666' }}>Start Time:</strong>
            <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
              {formatDate(loan.startTime)}
            </div>
          </div>
        )}

        <div>
          <strong style={{ color: '#666' }}>Term:</strong>
          <div style={{ marginTop: '0.25rem' }}>
            {Math.floor(Number(loan.term) / (1000 * 60 * 60 * 24))} days
          </div>
        </div>
      </div>
    </div>
  );
}

