'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { usePendingLoans } from './use-loan-queries';
import { useContract } from 'typink';
import { ContractId } from '@/contracts/deployments';
import type { LoanDetails } from '@/lib/types';
import type { LoanManagerLoan } from '@/contracts/types/loan-manager/types';

/**
 * Convert LoanManagerLoan (from contract) to LoanDetails (for UI)
 */
function convertToLoanDetails(loan: LoanManagerLoan | null): LoanDetails | null {
  if (!loan) return null;

  // Format borrower address
  const borrowerAddress = typeof loan.borrower === 'string' 
    ? loan.borrower 
    : (loan.borrower as any)?.raw || String(loan.borrower);

  // Calculate dueTime: startTime + term (both in seconds)
  const dueTime = loan.startTime && loan.startTime > 0n ? loan.startTime + loan.term : 0n;
  
  // Use totalRepaymentAmount from contract
  const repaymentAmount = loan.totalRepaymentAmount || 0n;
  
  // Calculate days remaining
  const currentTime = BigInt(Math.floor(Date.now() / 1000)); // Current time in seconds
  const isOverdue = dueTime > 0n && currentTime > dueTime && loan.status === 'Active';
  const daysRemaining = dueTime > 0n && dueTime > currentTime
    ? Math.floor(Number(dueTime - currentTime) / (60 * 60 * 24))
    : 0;

  return {
    loanId: loan.loanId,
    borrower: borrowerAddress,
    amount: loan.amount,
    interestRate: loan.interestRate,
    term: loan.term,
    purpose: new Uint8Array(), // LoanManagerLoan doesn't have purpose
    startTime: loan.startTime,
    status: loan.status as 'Active' | 'Repaid' | 'Defaulted',
    vouchers: [], // Will be loaded separately if needed
    dueTime,
    totalRepayment: repaymentAmount,
    daysRemaining,
    isOverdue,
    purposeText: undefined,
    progress: 100, // Loans are either funded or not
    remainingAmount: repaymentAmount, // Full repayment required
  };
}

/**
 * Hook to load all pending loan details
 * Fetches loan IDs from contract, then fetches full details for each
 */
export function usePendingLoanDetails() {
  const { data: pendingLoanIds, isLoading: isLoadingIds } = usePendingLoans();
  const { contract } = useContract(ContractId.LOAN_MANAGER);

  // Convert IDs to bigints
  const loanIds = useMemo(() => {
    if (!pendingLoanIds) return [];
    return pendingLoanIds.map(id => typeof id === 'bigint' ? id : BigInt(id));
  }, [pendingLoanIds]);

  // Fetch details for each loan using useQueries
  const loanQueries = useQueries({
    queries: loanIds.map((loanId) => ({
      queryKey: ['loan', loanId.toString()],
      queryFn: async (): Promise<LoanManagerLoan | null> => {
        if (!contract) return null;

        try {
          const result = await contract.query.getLoan(loanId);
          const loan = (result as any).data;
          return loan ?? null;
        } catch (error) {
          console.error('Error fetching loan:', error);
          return null;
        }
      },
      enabled: !!contract && loanIds.length > 0,
      staleTime: 30000,
    })),
  });

  const isLoading = isLoadingIds || loanQueries.some(q => q.isLoading);
  const hasError = loanQueries.some(q => q.isError);

  // Convert to LoanDetails
  const loans = useMemo(() => {
    const results: LoanDetails[] = [];
    
    loanQueries.forEach((query) => {
      if (query.data) {
        const loanDetails = convertToLoanDetails(query.data);
        if (loanDetails) {
          results.push(loanDetails);
        }
      }
    });
    
    return results;
  }, [loanQueries]);

  return {
    data: loans,
    isLoading,
    isError: hasError,
  };
}
