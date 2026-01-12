import { useQuery } from '@tanstack/react-query';
import { useContract } from 'typink';
import { ContractId } from '@/contracts/deployments';
import type { LoanManagerLoan } from '@/contracts/types/loan-manager/types';

/**
 * Hook to query loan details from the loan manager contract
 * @param loanId - The loan ID to query
 * @returns Loan details including status, amount, borrower, interest rate, etc.
 */
export function useLoan(loanId: bigint | number | string | undefined) {
  const { contract } = useContract(ContractId.LOAN_MANAGER);

  return useQuery({
    queryKey: ['loan', loanId?.toString()],
    queryFn: async (): Promise<LoanManagerLoan | null> => {
      if (loanId === undefined || loanId === null || !contract) {
        return null;
      }

      try {
        const loanIdBigInt = typeof loanId === 'bigint' ? loanId : BigInt(loanId);
        const result = await contract.query.getLoan(loanIdBigInt);
        
        // Extract data from GenericContractCallResult
        const loan = (result as any).data;
        
        return loan ?? null;
      } catch (error) {
        console.error('Error fetching loan:', error);
        return null;
      }
    },
    enabled: loanId !== undefined && loanId !== null && !!contract,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to query the repayment amount for a loan
 * Returns the fixed repayment amount (principal + interest) in 18 decimals
 * @param loanId - The loan ID to query
 * @returns Repayment amount in 18 decimals (chain format)
 */
export function useRepaymentAmount(loanId: bigint | number | string | undefined) {
  const { contract } = useContract(ContractId.LOAN_MANAGER);

  return useQuery({
    queryKey: ['loan', 'repaymentAmount', loanId?.toString()],
    queryFn: async (): Promise<bigint | null> => {
      if (loanId === undefined || loanId === null || !contract) {
        return null;
      }

      try {
        const loanIdBigInt = typeof loanId === 'bigint' ? loanId : BigInt(loanId);
        const result = await contract.query.getRepaymentAmount(loanIdBigInt);
        
        // Extract data from Result<bigint, LoanManagerError>
        const repaymentResult = (result as any).data;
        
        if (!repaymentResult || repaymentResult.isErr) {
          return null;
        }
        
        return repaymentResult.isOk ? repaymentResult.value : null;
      } catch (error) {
        console.error('Error fetching repayment amount:', error);
        return null;
      }
    },
    enabled: loanId !== undefined && loanId !== null && !!contract,
    staleTime: 30000,
  });
}

/**
 * Hook to query all pending loan IDs
 * @returns Array of loan IDs that are currently pending
 */
export function usePendingLoans() {
  const { contract } = useContract(ContractId.LOAN_MANAGER);

  return useQuery({
    queryKey: ['loans', 'pending'],
    queryFn: async (): Promise<bigint[]> => {
      if (!contract) {
        return [];
      }

      try {
        const result = await contract.query.getAllPendingLoans();
        const loanIds = (result as any).data ?? [];
        console.log('Pending loans:', result);
        return Array.isArray(loanIds) ? loanIds : [];
      } catch (error) {
        console.error('Error fetching pending loans:', error);
        return [];
      }
    },
    enabled: !!contract,
    staleTime: 30000,
  });
}

/**
 * Hook to query all active loan IDs
 * @returns Array of loan IDs that are currently active
 */
export function useActiveLoans() {
  const { contract } = useContract(ContractId.LOAN_MANAGER);

  return useQuery({
    queryKey: ['loans', 'active'],
    queryFn: async (): Promise<bigint[]> => {
      if (!contract) {
        return [];
      }

      try {
        const result = await contract.query.getAllActiveLoans();
        const loanIds = (result as any).data ?? [];
        console.log('Active loans:', result);
        return Array.isArray(loanIds) ? loanIds : [];
        
      } catch (error) {
        console.error('Error fetching active loans:', error);
        return [];
      }
    },
    enabled: !!contract,
    staleTime: 30000,
  });
}

/**
 * Helper hook to determine if a loan is overdue or defaulted
 * Checks if loan term has expired (startTime + term + gracePeriod < current time)
 * @param loanId - The loan ID to check
 * @returns Object with isOverdue, isDefaulted, and timeUntilDue status
 */
export function useLoanStatus(loanId: bigint | number | string | undefined) {
  const { data: loan } = useLoan(loanId);

  return useQuery({
    queryKey: ['loan', 'status', loanId?.toString(), loan?.startTime?.toString(), loan?.term?.toString()],
    queryFn: async () => {
      if (!loan || loan.status === 'Repaid' || loan.status === 'Defaulted') {
        return {
          isOverdue: loan?.status === 'Defaulted',
          isDefaulted: loan?.status === 'Defaulted',
          isRepaid: loan?.status === 'Repaid',
          timeUntilDue: null,
        };
      }

      if (loan.status !== 'Active' || !loan.startTime) {
        return {
          isOverdue: false,
          isDefaulted: false,
          isRepaid: false,
          timeUntilDue: null,
        };
      }

      // Calculate due date: startTime + term (in milliseconds)
      // Note: grace period is handled by the contract's checkDefault function
      const startTime = Number(loan.startTime);
      const term = Number(loan.term);
      const dueTime = startTime + term;
      const currentTime = Date.now();
      
      const isOverdue = currentTime > dueTime;
      const timeUntilDue = isOverdue ? 0 : dueTime - currentTime;

      return {
        isOverdue,
        isDefaulted: false, // Loan is Active, so it's not defaulted
        isRepaid: false, // Loan is Active, so it's not repaid
        timeUntilDue: isOverdue ? null : timeUntilDue,
      };
    },
    enabled: !!loan,
    staleTime: 10000, // 10 seconds (more frequent for time-sensitive status)
  });
}

