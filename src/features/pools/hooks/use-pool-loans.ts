import { useQueries } from '@tanstack/react-query';
import { useContract } from 'typink';
import { ContractId } from '@/contracts/deployments';
import { usePendingLoans, useActiveLoans } from './use-loan-queries';
import type { LoanManagerLoan } from '@/contracts/types/loan-manager/types';

/**
 * Hook to fetch all loans (pending + active) for a pool
 * Returns loan details for all loans
 */
export function usePoolLoans() {
  const { contract } = useContract(ContractId.LOAN_MANAGER);
  const { data: pendingLoans = [], isLoading: isLoadingPending } = usePendingLoans();
  const { data: activeLoans = [], isLoading: isLoadingActive } = useActiveLoans();

  // Combine all loan IDs
  const allLoanIds = [...pendingLoans, ...activeLoans].map((id) =>
    typeof id === 'bigint' ? id : BigInt(id)
  );

  // Fetch details for each loan
  const loanQueries = useQueries({
    queries: allLoanIds.map((loanId) => ({
      queryKey: ['pool', 'loans', loanId.toString()],
      queryFn: async (): Promise<LoanManagerLoan | null> => {
        if (!contract) return null;
        try {
          const result = await contract.query.getLoan(loanId);
          const loan = (result as any).data;
          return loan ?? null;
        } catch (error) {
          console.error(`Error fetching loan ${loanId}:`, error);
          return null;
        }
      },
      enabled: !!contract && allLoanIds.length > 0,
      staleTime: 30000,
    })),
  });

  const loans = loanQueries
    .map((query) => query.data)
    .filter((loan): loan is LoanManagerLoan => loan !== null);

  const isLoading = isLoadingPending || isLoadingActive || loanQueries.some((query) => query.isLoading);

  return {
    loans,
    isLoading,
    totalCount: allLoanIds.length,
  };
}
