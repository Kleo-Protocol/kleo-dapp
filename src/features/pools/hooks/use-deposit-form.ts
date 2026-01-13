'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useContract, useTypink, useBalances, txToaster, checkBalanceSufficiency } from 'typink';
import { ContractId } from '@/contracts/deployments';
import { useQueryClient } from '@tanstack/react-query';
import { poolsKeys } from './use-pools';
import type { Pool } from '@/lib/types';

interface UseDepositFormProps {
  pool: Pool;
  onAmountChange?: (amount: number) => void;
}

/**
 * Convert a token amount (human-readable) to bigint (smallest unit)
 */
function parseTokenAmount(amount: string, decimals: number): bigint {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return 0n;
  return BigInt(Math.floor(num * 10 ** decimals));
}

/**
 * Convert bigint (smallest unit) to human-readable token amount
 */
function formatTokenAmount(amount: bigint, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}

export function useDepositForm({ pool, onAmountChange }: UseDepositFormProps) {
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

  // Get user balance in tokens (human-readable)
  const userBalance = useMemo(() => {
    if (!connectedAccount) return 0;
    const balance = balances[connectedAccount.address];
    if (!balance) return 0;
    const formatted = formatTokenAmount(balance.free, decimals);
    console.log('Balance calculation:', {
      raw: balance.free.toString(),
      decimals,
      formatted,
      networkDecimals: network?.decimals,
    });
    return formatted;
  }, [balances, connectedAccount, decimals, network]);

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
    if (userBalance > 0) {
      // Format to avoid floating point precision issues
      const maxAmount = Math.floor(userBalance * 100) / 100;
      setAmount(maxAmount.toString());
    }
  };

  const depositAmount = parseFloat(amount) || 0;
  const depositAmountBigInt = parseTokenAmount(amount, decimals);
  
  const isValid = useMemo(() => {
    return depositAmount > 0 && depositAmount <= userBalance && !!contract && !!connectedAccount;
  }, [depositAmount, userBalance, contract, connectedAccount]);

  // Convert baseInterestRate from stored format (10 decimal places precision) to percentage
  // Example: 1000000112n / 10000000000 * 100 = 10.00000112%
  const interestRate = useMemo(() => {
    return (Number(pool.baseInterestRate) / 10000000000) * 100;
  }, [pool.baseInterestRate]);

  // Calculate annual return: depositAmount * (APY / 100)
  const estimatedAnnualReturn = useMemo(() => {
    if (depositAmount <= 0) return 0;
    const apyPercentage = interestRate; // Already in percentage (e.g., 10.00000112)
    return depositAmount * (apyPercentage / 100);
  }, [depositAmount, interestRate]);

  const hasInsufficientBalance = depositAmount > userBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract || !connectedAccount || !client) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet to make a deposit',
      });
      return;
    }

    if (depositAmountBigInt === 0n) {
      toast.error('Invalid amount', {
        description: 'Please enter a valid deposit amount greater than 0',
      });
      return;
    }

    // Check if amount is too small (less than 1 unit in smallest denomination)
    if (depositAmount < 1 / 10 ** decimals) {
      toast.error('Amount too small', {
        description: `Minimum deposit amount is ${1 / 10 ** decimals} tokens`,
      });
      return;
    }

    const toaster = txToaster();
    
    try {
      setIsSubmitting(true);

      // Check balance sufficiency (for transaction fees)
      await checkBalanceSufficiency(client, connectedAccount.address);
      
      // Verify user has enough balance for the deposit
      const currentBalance = balances[connectedAccount.address];
      if (!currentBalance || currentBalance.free < depositAmountBigInt) {
        throw new Error('Insufficient balance for deposit');
      }

      // Execute deposit transaction
      // The deposit function requires accountId as first parameter and is payable, so we send the amount as the transaction value
      // Ensure accountId is a string (AccountId32Like accepts string SS58 address)
      const accountId = typeof connectedAccount.address === 'string' 
        ? connectedAccount.address 
        : String(connectedAccount.address);
      
      await contract.tx
        .deposit(accountId, {
          value: depositAmountBigInt,
        })
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
            
            toast.success('Deposit successful', {
              description: `${depositAmount.toLocaleString()} tokens deposited to pool`,
            });
          }
        })
        .untilFinalized();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error depositing to pool:', err);
      toaster.onTxError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = pool.status !== 'active' || !contract || !connectedAccount;

  return {
    amount,
    isSubmitting,
    userBalance,
    depositAmount,
    isValid,
    interestRate,
    estimatedAnnualReturn,
    hasInsufficientBalance,
    isFormDisabled,
    handleAmountChange,
    handleMax,
    handleSubmit,
  };
}

