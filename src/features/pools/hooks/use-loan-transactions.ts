'use client';

import { useCallback } from 'react';
import { useContract, useTypink, txToaster, checkBalanceSufficiency } from 'typink';
import { useQueryClient } from '@tanstack/react-query';
import { ContractId, deployments } from '@/contracts/deployments';
import { toast } from 'sonner';

/**
 * Hook to request a new loan
 * @returns Function to request a loan with amount and loan term
 */
export function useRequestLoan() {
  const { contract } = useContract(ContractId.LOAN_MANAGER);
  const { client, connectedAccount, network } = useTypink();
  const queryClient = useQueryClient();

  const requestLoan = useCallback(
    async (amount: bigint, loanTerm: bigint) => {
      if (!contract || !connectedAccount || !client) {
        throw new Error('Wallet not connected or contract not available');
      }

      const toaster = txToaster();

      try {
        // Check balance sufficiency (for transaction fees)
        await checkBalanceSufficiency(client, connectedAccount.address);

        // Execute loan request transaction
        await contract.tx
          .requestLoan(amount, loanTerm, connectedAccount.address)
          .signAndSend(connectedAccount.address, (progress) => {
            toaster.onTxProgress(progress);

            if (progress.status.type === 'BestChainBlockIncluded' || progress.status.type === 'Finalized') {
              // Invalidate loan-related queries
              queryClient.invalidateQueries({ queryKey: ['loans', 'pending'] });
              queryClient.invalidateQueries({ queryKey: ['loans', 'active'] });
              queryClient.invalidateQueries({ queryKey: ['loan'] });
              
              toast.success('Loan requested successfully');
            }
          })
          .untilFinalized();
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error requesting loan:', err);
        toaster.onTxError(err);
        throw err;
      }
    },
    [contract, connectedAccount, client, queryClient]
  );

  return { requestLoan };
}

/**
 * Hook to vouch for a pending loan
 * @returns Function to vouch for a loan with stars and capital percent
 */
export function useVouchForLoan() {
  const { contract } = useContract(ContractId.LOAN_MANAGER);
  const { client, connectedAccount } = useTypink();
  const queryClient = useQueryClient();

  // Get contract addresses
  const loanManagerAddress = deployments.find((d) => d.id === ContractId.LOAN_MANAGER)?.address;
  if (!loanManagerAddress) {
    throw new Error('Loan manager address not found in deployments');
  }

  const vouchForLoan = useCallback(
    async (loanId: bigint, stars: number, capitalPercent: number) => {
      if (!contract || !connectedAccount || !client) {
        throw new Error('Wallet not connected or contract not available');
      }

      if (!loanManagerAddress) {
        throw new Error('Loan manager address not configured');
      }

      const toaster = txToaster();

      try {
        // Check balance sufficiency (for transaction fees)
        await checkBalanceSufficiency(client, connectedAccount.address);

        // Execute vouch transaction
        await contract.tx
          .vouchForLoan(
            loanId,
            stars,
            capitalPercent,
            connectedAccount.address,
            loanManagerAddress as `0x${string}`
          )
          .signAndSend(connectedAccount.address, (progress) => {
            toaster.onTxProgress(progress);

            if (progress.status.type === 'BestChainBlockIncluded' || progress.status.type === 'Finalized') {
              // Invalidate vouch and loan-related queries
              queryClient.invalidateQueries({ queryKey: ['vouch'] });
              queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
              queryClient.invalidateQueries({ queryKey: ['loans', 'pending'] });
              queryClient.invalidateQueries({ queryKey: ['loans', 'active'] });
              
              toast.success('Vouch submitted successfully');
            }
          })
          .untilFinalized();
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error vouching for loan:', err);
        toaster.onTxError(err);
        throw err;
      }
    },
    [contract, connectedAccount, client, queryClient, loanManagerAddress]
  );

  return { vouchForLoan };
}

/**
 * Hook to repay an active loan (payable transaction)
 * @returns Function to repay a loan with the exact repayment amount
 */
export function useRepayLoan() {
  const { contract } = useContract(ContractId.LOAN_MANAGER);
  const { client, connectedAccount } = useTypink();
  const queryClient = useQueryClient();

  // Get contract addresses
  const loanManagerAddress = deployments.find((d) => d.id === ContractId.LOAN_MANAGER)?.address;
  if (!loanManagerAddress) {
    throw new Error('Loan manager address not found in deployments');
  }

  const repayLoan = useCallback(
    async (loanId: bigint, repaymentAmount: bigint) => {
      if (!contract || !connectedAccount || !client) {
        throw new Error('Wallet not connected or contract not available');
      }

      if (!loanManagerAddress) {
        throw new Error('Loan manager address not configured');
      }

      const toaster = txToaster();

      try {
        // Check balance sufficiency (for transaction fees + repayment amount)
        await checkBalanceSufficiency(client, connectedAccount.address);

        // Execute repayment transaction (payable - send value with transaction)
        await contract.tx
          .repayLoan(
            loanId,
            connectedAccount.address,
            loanManagerAddress as `0x${string}`,
            { value: repaymentAmount } // Payable transaction - send repayment amount
          )
          .signAndSend(connectedAccount.address, (progress) => {
            toaster.onTxProgress(progress);

            if (progress.status.type === 'BestChainBlockIncluded' || progress.status.type === 'Finalized') {
              // Invalidate loan-related queries
              queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
              queryClient.invalidateQueries({ queryKey: ['loan', 'repaymentAmount', loanId] });
              queryClient.invalidateQueries({ queryKey: ['loans', 'active'] });
              queryClient.invalidateQueries({ queryKey: ['vouch'] });
              
              toast.success('Loan repaid successfully');
            }
          })
          .untilFinalized();
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error repaying loan:', err);
        toaster.onTxError(err);
        throw err;
      }
    },
    [contract, connectedAccount, client, queryClient, loanManagerAddress]
  );

  return { repayLoan };
}

/**
 * Hook to check and process loan defaults
 * Can be called by anyone to trigger default processing for overdue loans
 * @returns Function to check default for a loan
 */
export function useCheckDefault() {
  const { contract } = useContract(ContractId.LOAN_MANAGER);
  const { client, connectedAccount } = useTypink();
  const queryClient = useQueryClient();

  // Get contract addresses
  const loanManagerAddress = deployments.find((d) => d.id === ContractId.LOAN_MANAGER)?.address;
  const vouchContractAddress = deployments.find((d) => d.id === ContractId.VOUCH)?.address;
  
  if (!loanManagerAddress || !vouchContractAddress) {
    throw new Error('Contract addresses not found in deployments');
  }

  const checkDefault = useCallback(
    async (loanId: bigint) => {
      if (!contract || !connectedAccount || !client) {
        throw new Error('Wallet not connected or contract not available');
      }

      const toaster = txToaster();

      try {
        // Check balance sufficiency (for transaction fees)
        await checkBalanceSufficiency(client, connectedAccount.address);

        // Execute check default transaction
        await contract.tx
          .checkDefault(
            loanId,
            loanManagerAddress as `0x${string}`,
            vouchContractAddress as `0x${string}`
          )
          .signAndSend(connectedAccount.address, (progress) => {
            toaster.onTxProgress(progress);

            if (progress.status.type === 'BestChainBlockIncluded' || progress.status.type === 'Finalized') {
              // Invalidate loan and reputation-related queries
              queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
              queryClient.invalidateQueries({ queryKey: ['loans', 'active'] });
              queryClient.invalidateQueries({ queryKey: ['vouch'] });
              queryClient.invalidateQueries({ queryKey: ['reputation'] });
              
              toast.success('Loan default processed successfully');
            }
          })
          .untilFinalized();
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Error checking default:', err);
        toaster.onTxError(err);
        throw err;
      }
    },
    [contract, connectedAccount, client, queryClient, loanManagerAddress, vouchContractAddress]
  );

  return { checkDefault };
}

