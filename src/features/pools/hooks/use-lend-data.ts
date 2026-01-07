import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoanStatus, Loan } from '@/lib/types';
import { poolsKeys, useAvailablePools } from './use-pools';
import { borrowKeys } from './use-borrow-data';

// Query keys - base keys to avoid circular reference
const lendBaseKey = ['lend'] as const;
const lendLoansBaseKey = [...lendBaseKey, 'loans'] as const;

export const lendKeys = {
  all: lendBaseKey,
  loans: {
    all: lendLoansBaseKey,
    byLender: (address: string) => [...lendLoansBaseKey, 'lender', address] as const,
    byPool: (poolId: string) => [...lendLoansBaseKey, 'pool', poolId] as const,
    byStatus: (status: LoanStatus) => [...lendLoansBaseKey, 'status', status] as const,
    active: [...lendLoansBaseKey, 'active'] as const,
    funding: [...lendLoansBaseKey, 'funding'] as const,
  },
  detail: (loanId: string) => [...lendBaseKey, 'loan', loanId] as const,
};

/**
 * Hook to fetch loans by lender address
 */
export function useLenderLoans(lenderAddress: string | undefined) {
  return useQuery<Loan[]>({
    queryKey: lenderAddress
      ? lendKeys.loans.byLender(lenderAddress)
      : ['lend', 'loans', 'lender', 'null'],
    queryFn: () => {
      if (!lenderAddress) {
        throw new Error('Lender address is required');
      }
      throw new Error('getLoansByLender not implemented - mock removed');
    },
    enabled: false, // Disabled until real implementation
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
      throw new Error('getLoansByPool not implemented - mock removed');
    },
    enabled: false, // Disabled until real implementation
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch loans by status (for lending context)
 */
export function useLendLoansByStatus(status: LoanStatus) {
  return useQuery({
    queryKey: lendKeys.loans.byStatus(status),
    queryFn: () => {
      throw new Error('getLoansByStatus not implemented - mock removed');
    },
    enabled: false, // Disabled until real implementation
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch active loans (for lending)
 */
export function useLendActiveLoans() {
  return useQuery({
    queryKey: lendKeys.loans.active,
    queryFn: () => {
      throw new Error('getActiveLoans not implemented - mock removed');
    },
    enabled: false, // Disabled until real implementation
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch loans available for funding
 */
export function useLendFundingLoans() {
  return useQuery({
    queryKey: lendKeys.loans.funding,
    queryFn: () => {
      throw new Error('getFundingLoans not implemented - mock removed');
    },
    enabled: false, // Disabled until real implementation
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
      throw new Error('getLoanDetails not implemented - mock removed');
    },
    enabled: false, // Disabled until real implementation
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to contribute to a loan (lend funds)
 */
export function useContributeToLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: (_params: { loanId: string; lenderAddress: string; amount: bigint }) => {
      throw new Error('updateLoanFunding not implemented - mock removed');
    },
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

