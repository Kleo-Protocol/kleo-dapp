'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useContract, useTypink, useBalances, txToaster, checkBalanceSufficiency } from 'typink';
import { ContractId } from '@/contracts/deployments';
import { useQueryClient } from '@tanstack/react-query';
import { poolsKeys } from './use-pools';
import { useUserDeposits } from './use-lending-pool-data';
import type { Pool } from '@/lib/types';

interface UseWithdrawFormProps {
  pool: Pool;
  onAmountChange?: (amount: number) => void;
}

/**
 * Convert a token amount (human-readable) to bigint (smallest unit)
 * Note: Withdraw uses 10 decimals (storage format)
 */
function parseTokenAmount(amount: string, decimals: number): bigint {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return 0n;
  // Withdraw uses 10 decimals (storage format)
  return BigInt(Math.floor(num * 10 ** 10));
}

/**
 * Convert bigint (smallest unit) to human-readable token amount
 * Note: Withdraw uses 10 decimals (storage format)
 */
function formatTokenAmount(amount: bigint, decimals: number): number {
  // Withdraw amounts are in 10 decimals (storage format)
  return Number(amount) / 10 ** 10;
}

export function useWithdrawForm({ pool, onAmountChange }: UseWithdrawFormProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { contract } = useContract(ContractId.LENDING_POOL);
  const { client, connectedAccount, network } = useTypink();
  const queryClient = useQueryClient();

  // Get network decimals (default to 12 for Asset Hub chains, fallback to 18)
  const decimals = network?.decimals ?? 12;

  // Get addresses array for useBalances
  const addresses = useMemo(() => (connectedAccount ? [connectedAccount.address] : []), [connectedAccount]);
  const balances = useBalances(addresses);

  // Get user deposit amount (available to withdraw)
  const { data: userDeposit } = useUserDeposits(connectedAccount?.address);
  
  // Available to withdraw (in human-readable format, 10 decimals)
  const availableToWithdraw = useMemo(() => {
    if (!userDeposit) return 0;
    return formatTokenAmount(userDeposit, 10);
  }, [userDeposit]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      const numValue = parseFloat(value) || 0;
      onAmountChange?.(numValue);
    }
  };

  const handleMax = () => {
    if (availableToWithdraw > 0) {
      // Format to avoid floating point precision issues
      const maxAmount = Math.floor(availableToWithdraw * 100) / 100;
      setAmount(maxAmount.toString());
    }
  };

  const withdrawAmount = parseFloat(amount) || 0;
  const withdrawAmountBigInt = parseTokenAmount(amount, 10); // Withdraw uses 10 decimals
  
  const isValid = useMemo(() => {
    return withdrawAmount > 0 && withdrawAmount <= availableToWithdraw && !!contract && !!connectedAccount;
  }, [withdrawAmount, availableToWithdraw, contract, connectedAccount]);

  const hasInsufficientBalance = withdrawAmount > availableToWithdraw;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract || !connectedAccount || !client) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet to withdraw funds',
      });
      return;
    }

    if (withdrawAmountBigInt === 0n) {
      toast.error('Invalid amount', {
        description: 'Please enter a valid withdraw amount greater than 0',
      });
      return;
    }

    // Check if amount is too small
    if (withdrawAmount < 1 / 10 ** 10) {
      toast.error('Amount too small', {
        description: `Minimum withdraw amount is ${1 / 10 ** 10} tokens`,
      });
      return;
    }

    // Verify user has enough deposit to withdraw
    if (!userDeposit || userDeposit < withdrawAmountBigInt) {
      toast.error('Insufficient deposit', {
        description: 'You do not have enough funds deposited to withdraw this amount',
      });
      return;
    }

    const toaster = txToaster();
    
    try {
      setIsSubmitting(true);

      // Check balance sufficiency (for transaction fees)
      await checkBalanceSufficiency(client, connectedAccount.address);
      
      // Ensure accountId is a string (AccountId32Like accepts string SS58 address)
      const accountId = typeof connectedAccount.address === 'string' 
        ? connectedAccount.address 
        : String(connectedAccount.address);
      
      // Execute withdraw transaction
      // The withdraw function requires amount (in 10 decimals) and accountId
      await contract.tx
        .withdraw(withdrawAmountBigInt, accountId)
        .signAndSend(connectedAccount.address, (progress) => {
          toaster.onTxProgress(progress);

          if (progress.status.type === 'BestChainBlockIncluded' || progress.status.type === 'Finalized') {
            // Transaction successful
            setAmount('');
            onAmountChange?.(0);
            
            // Invalidate pool-related queries to refresh data
            queryClient.invalidateQueries({ queryKey: poolsKeys.all });
            queryClient.invalidateQueries({ queryKey: poolsKeys.detail(pool.poolId) });
            queryClient.invalidateQueries({ queryKey: poolsKeys.state(pool.poolId) });
            queryClient.invalidateQueries({ queryKey: ['lendingPool', 'currentRate'] });
            queryClient.invalidateQueries({ queryKey: ['lendingPool', 'userDeposits'] });
            
            toast.success('Withdraw successful', {
              description: `${withdrawAmount.toLocaleString()} tokens withdrawn from pool`,
            });
          }
        })
        .untilFinalized();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error withdrawing from pool:', err);
      toaster.onTxError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = pool.status !== 'active' || !contract || !connectedAccount || availableToWithdraw === 0;

  return {
    amount,
    isSubmitting,
    availableToWithdraw,
    withdrawAmount,
    isValid,
    hasInsufficientBalance,
    isFormDisabled,
    handleAmountChange,
    handleMax,
    handleSubmit,
  };
}
