import { useQuery } from '@tanstack/react-query';
import { useContract } from 'typink';
import { ContractId } from '@/contracts/deployments';
import type { AccountId32 } from 'dedot/codecs';
import type { VouchVouchRelationship } from '@/contracts/types/vouch/types';

/**
 * Hook to query the count of active vouches for a specific loan
 * @param loanId - The loan ID to query
 * @returns Number of active vouches for the loan
 */
export function useVouchesForLoan(loanId: bigint | number | string | undefined) {
  const { contract } = useContract(ContractId.VOUCH);

  return useQuery({
    queryKey: ['vouch', 'count', loanId?.toString()],
    queryFn: async (): Promise<number> => {
      if (loanId === undefined || loanId === null || !contract) {
        return 0;
      }

      try {
        const loanIdBigInt = typeof loanId === 'bigint' ? loanId : BigInt(loanId);
        const result = await contract.query.getVouchesForLoan(loanIdBigInt);
        const count = (result as any).data;
        
        return typeof count === 'number' ? count : 0;
      } catch (error) {
        console.error('Error fetching vouches for loan:', error);
        return 0;
      }
    },
    enabled: loanId !== undefined && loanId !== null && !!contract,
    staleTime: 30000,
  });
}

/**
 * Hook to query all voucher addresses for a specific loan
 * @param loanId - The loan ID to query
 * @returns Array of voucher account addresses (AccountId32)
 */
export function useVouchersForLoan(loanId: bigint | number | string | undefined) {
  const { contract } = useContract(ContractId.VOUCH);

  return useQuery({
    queryKey: ['vouch', 'vouchers', loanId?.toString()],
    queryFn: async (): Promise<AccountId32[]> => {
      if (loanId === undefined || loanId === null || !contract) {
        return [];
      }

      try {
        const loanIdBigInt = typeof loanId === 'bigint' ? loanId : BigInt(loanId);
        const result = await contract.query.getVouchersForLoan(loanIdBigInt);
        const vouchers = (result as any).data;
        
        return Array.isArray(vouchers) ? vouchers : [];
      } catch (error) {
        console.error('Error fetching vouchers for loan:', error);
        return [];
      }
    },
    enabled: loanId !== undefined && loanId !== null && !!contract,
    staleTime: 30000,
  });
}

/**
 * Hook to query borrower's total exposure
 * Returns the total exposure amount for a borrower
 * @param borrowerAddress - Borrower's account address (AccountId)
 * @returns Total exposure amount
 */
export function useBorrowerExposure(borrowerAddress: string | undefined) {
  const { contract } = useContract(ContractId.VOUCH);

  return useQuery({
    queryKey: ['vouch', 'borrowerExposure', borrowerAddress],
    queryFn: async (): Promise<bigint> => {
      if (!borrowerAddress || !contract) {
        return 0n;
      }

      try {
        // Access storage to get borrower exposure
        if (!contract.storage) {
          throw new Error('Storage API not available');
        }
        
        const root = await contract.storage.root();
        const exposure = await root.borrowerExposure?.get(borrowerAddress);
        
        return exposure ?? 0n;
      } catch (error) {
        console.error('Error fetching borrower exposure:', error);
        return 0n;
      }
    },
    enabled: !!borrowerAddress && !!contract,
    staleTime: 30000,
  });
}

/**
 * Hook to query all vouchers for a borrower (backward compatibility)
 * @param borrowerAddress - Borrower's account address (AccountId)
 * @returns Array of voucher account addresses
 */
export function useBorrowerVouchers(borrowerAddress: string | undefined) {
  const { contract } = useContract(ContractId.VOUCH);

  return useQuery({
    queryKey: ['vouch', 'borrowerVouchers', borrowerAddress],
    queryFn: async (): Promise<AccountId32[]> => {
      if (!borrowerAddress || !contract) {
        return [];
      }

      try {
        const result = await contract.query.getAllVouchers(borrowerAddress);
        const vouchers = (result as any).data;
        
        return Array.isArray(vouchers) ? vouchers : [];
      } catch (error) {
        console.error('Error fetching borrower vouchers:', error);
        return [];
      }
    },
    enabled: !!borrowerAddress && !!contract,
    staleTime: 30000,
  });
}

/**
 * Hook to query a specific vouch relationship from storage
 * @param voucherAddress - Voucher's account address (AccountId)
 * @param borrowerAddress - Borrower's account address (AccountId)
 * @returns Vouch relationship details including loanId, staked stars, staked capital, status
 */
export function useVouchRelationship(
  voucherAddress: string | undefined,
  borrowerAddress: string | undefined
) {
  const { contract } = useContract(ContractId.VOUCH);

  return useQuery({
    queryKey: ['vouch', 'relationship', voucherAddress, borrowerAddress],
    queryFn: async (): Promise<VouchVouchRelationship | null> => {
      if (!voucherAddress || !borrowerAddress || !contract) {
        return null;
      }

      try {
        // Access storage to get vouch relationship
        if (!contract.storage) {
          throw new Error('Storage API not available');
        }
        
        const root = await contract.storage.root();
        const relationship = await root.relationships?.get([voucherAddress, borrowerAddress]);
        
        return relationship ?? null;
      } catch (error) {
        console.error('Error fetching vouch relationship:', error);
        return null;
      }
    },
    enabled: !!voucherAddress && !!borrowerAddress && !!contract,
    staleTime: 30000,
  });
}

