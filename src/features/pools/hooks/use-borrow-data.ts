import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoanStatus } from '@/lib/types';

// Query keys - base keys to avoid circular reference
const borrowBaseKey = ['borrow'] as const;
const loansBaseKey = [...borrowBaseKey, 'loans'] as const;

export const borrowKeys = {
  all: borrowBaseKey,
  loans: {
    all: loansBaseKey,
    byBorrower: (address: string) => [...loansBaseKey, 'borrower', address] as const,
    byStatus: (status: LoanStatus) => [...loansBaseKey, 'status', status] as const,
    active: [...loansBaseKey, 'active'] as const,
    funding: [...loansBaseKey, 'funding'] as const,
  },
  detail: (loanId: string) => [...borrowBaseKey, 'loan', loanId] as const,
};

/**
 * Hook to fetch all loans
 */
export function useAllLoans() {
  return useQuery({
    queryKey: borrowKeys.loans.all,
    queryFn: () => {
      throw new Error('getAllLoans not implemented - mock removed');
    },
    enabled: false, // Disabled until real implementation
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch loans by borrower address
 */
export function useBorrowerLoans(borrowerAddress: string | undefined) {
  return useQuery({
    queryKey: borrowerAddress
      ? borrowKeys.loans.byBorrower(borrowerAddress)
      : ['borrow', 'loans', 'borrower', 'null'],
    queryFn: () => {
      if (!borrowerAddress) {
        throw new Error('Borrower address is required');
      }
      throw new Error('getLoansByBorrower not implemented - mock removed');
    },
    enabled: false, // Disabled until real implementation
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch loans by status
 */
export function useLoansByStatus(status: LoanStatus) {
  return useQuery({
    queryKey: borrowKeys.loans.byStatus(status),
    queryFn: () => {
      throw new Error('getLoansByStatus not implemented - mock removed');
    },
    enabled: false, // Disabled until real implementation
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch active loans
 */
export function useActiveLoans() {
  return useQuery({
    queryKey: borrowKeys.loans.active,
    queryFn: () => {
      throw new Error('getActiveLoans not implemented - mock removed');
    },
    enabled: false, // Disabled until real implementation
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch loans currently being funded
 */
export function useFundingLoans() {
  return useQuery({
    queryKey: borrowKeys.loans.funding,
    queryFn: () => {
      throw new Error('getFundingLoans not implemented - mock removed');
    },
    enabled: false, // Disabled until real implementation
    staleTime: 15000, // 15 seconds (more frequent for funding status)
  });
}

/**
 * Hook to fetch loan details by ID
 */
export function useLoanDetail(loanId: string | undefined) {
  return useQuery({
    queryKey: loanId ? borrowKeys.detail(loanId) : ['borrow', 'loan', 'null'],
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
 * Hook to create a new loan request
 */
export function useCreateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      borrower: string;
      requestedAmount: bigint;
      interestRate: bigint;
      penaltyRate: bigint;
      duration: bigint;
      poolId: string;
    }) => {
      throw new Error('createLoan not implemented - mock removed');
    },
    onSuccess: (_, variables) => {
      // Invalidate borrower's loans
      queryClient.invalidateQueries({
        queryKey: borrowKeys.loans.byBorrower(variables.borrower),
      });
      // Invalidate funding loans
      queryClient.invalidateQueries({ queryKey: borrowKeys.loans.funding });
      // Invalidate all loans list
      queryClient.invalidateQueries({ queryKey: borrowKeys.loans.all });
    },
  });
}

/**
 * Main hook for borrow page data
 * Combines borrower loans and funding loans
 */
export function useBorrowData(borrowerAddress: string | undefined) {
  const borrowerLoans = useBorrowerLoans(borrowerAddress);
  const fundingLoans = useFundingLoans();

  return {
    borrowerLoans,
    fundingLoans,
    isLoading: borrowerLoans.isLoading || fundingLoans.isLoading,
    isError: borrowerLoans.isError || fundingLoans.isError,
  };
}

