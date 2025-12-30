import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLoansByLender,
  getLoansByPool,
  getLoansByStatus,
  getActiveLoans,
  getFundingLoans,
  getLoanDetails,
  updateLoanFunding,
  type LoanStatus,
} from '@/services/mock/loans.mock';
import { poolsKeys, useAvailablePools } from './use-pools';
import { borrowKeys } from './use-borrow-data';

// Query keys
export const lendKeys = {
  all: ['lend'] as const,
  loans: {
    all: [...lendKeys.all, 'loans'] as const,
    byLender: (address: string) => [...lendKeys.loans.all, 'lender', address] as const,
    byPool: (poolId: string) => [...lendKeys.loans.all, 'pool', poolId] as const,
    byStatus: (status: LoanStatus) => [...lendKeys.loans.all, 'status', status] as const,
    active: [...lendKeys.loans.all, 'active'] as const,
    funding: [...lendKeys.loans.all, 'funding'] as const,
  },
  detail: (loanId: string) => [...lendKeys.all, 'loan', loanId] as const,
};

/**
 * Hook to fetch loans by lender address
 */
export function useLenderLoans(lenderAddress: string | undefined) {
  return useQuery({
    queryKey: lenderAddress
      ? lendKeys.loans.byLender(lenderAddress)
      : ['lend', 'loans', 'lender', 'null'],
    queryFn: () => {
      if (!lenderAddress) {
        throw new Error('Lender address is required');
      }
      return getLoansByLender(lenderAddress);
    },
    enabled: !!lenderAddress,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch loans by pool ID
 */
export function useLoansByPool(poolId: string | undefined) {
  return useQuery({
    queryKey: poolId ? lendKeys.loans.byPool(poolId) : ['lend', 'loans', 'pool', 'null'],
    queryFn: () => {
      if (!poolId) {
        throw new Error('Pool ID is required');
      }
      return getLoansByPool(poolId);
    },
    enabled: !!poolId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch loans by status (for lending context)
 */
export function useLendLoansByStatus(status: LoanStatus) {
  return useQuery({
    queryKey: lendKeys.loans.byStatus(status),
    queryFn: () => getLoansByStatus(status),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch active loans (for lending)
 */
export function useLendActiveLoans() {
  return useQuery({
    queryKey: lendKeys.loans.active,
    queryFn: () => getActiveLoans(),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch loans available for funding
 */
export function useLendFundingLoans() {
  return useQuery({
    queryKey: lendKeys.loans.funding,
    queryFn: () => getFundingLoans(),
    staleTime: 15000, // 15 seconds (more frequent for funding opportunities)
  });
}

/**
 * Hook to fetch loan details by ID (for lending context)
 */
export function useLendLoanDetail(loanId: string | undefined) {
  return useQuery({
    queryKey: loanId ? lendKeys.detail(loanId) : ['lend', 'loan', 'null'],
    queryFn: () => {
      if (!loanId) {
        throw new Error('Loan ID is required');
      }
      return getLoanDetails(loanId);
    },
    enabled: !!loanId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to contribute to a loan (lend funds)
 */
export function useContributeToLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { loanId: string; lenderAddress: string; amount: bigint }) =>
      updateLoanFunding(params.loanId, params.lenderAddress, params.amount),
    onSuccess: (_, variables) => {
      // Invalidate loan detail
      queryClient.invalidateQueries({ queryKey: lendKeys.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: borrowKeys.detail(variables.loanId) });
      // Invalidate lender's loans
      queryClient.invalidateQueries({
        queryKey: lendKeys.loans.byLender(variables.lenderAddress),
      });
      // Invalidate funding loans
      queryClient.invalidateQueries({ queryKey: lendKeys.loans.funding });
      queryClient.invalidateQueries({ queryKey: borrowKeys.loans.funding });
      // Invalidate pool stats if loan has poolId
      // Note: We'd need to fetch the loan first to get poolId, but for now we'll invalidate all pools
      queryClient.invalidateQueries({ queryKey: poolsKeys.all });
    },
  });
}

/**
 * Main hook for lend page data
 * Combines available pools, funding loans, and lender's active loans
 */
export function useLendData(lenderAddress: string | undefined) {
  const availablePools = useAvailablePools();
  const fundingLoans = useLendFundingLoans();
  const lenderLoans = useLenderLoans(lenderAddress);

  return {
    availablePools,
    fundingLoans,
    lenderLoans,
    isLoading: availablePools.isLoading || fundingLoans.isLoading || lenderLoans.isLoading,
    isError: availablePools.isError || fundingLoans.isError || lenderLoans.isError,
  };
}

