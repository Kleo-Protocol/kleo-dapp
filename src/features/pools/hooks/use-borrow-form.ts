'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useContract, useTypink, txToaster, checkBalanceSufficiency } from 'typink';
import { useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/user.store';
import { ContractId } from '@/contracts/deployments';
import { borrowKeys } from './use-borrow-data';
import type { Pool } from '@/lib/types';
import { DEFAULTS } from '@/lib/constants';

interface UseBorrowFormProps {
  pool: Pool;
  maxBorrow: number;
  onRequestCreated?: () => void;
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
 * Encode a string to Uint8Array for contract calls
 */
function encodePurpose(purpose: string): Uint8Array {
  return new TextEncoder().encode(purpose);
}

export function useBorrowForm({ pool, maxBorrow, onRequestCreated }: UseBorrowFormProps) {
  const { incomeReference } = useUserStore();
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(String(DEFAULTS.LOAN_DURATION_DAYS));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; duration?: string; incomeRef?: string }>({});
  
  const { contract } = useContract(ContractId.LOAN_MANAGER);
  const { client, connectedAccount, network } = useTypink();
  const queryClient = useQueryClient();

  // Get network decimals (default to 12 for Asset Hub chains, fallback to 18)
  const decimals = network?.decimals ?? 12;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      if (errors.amount) {
        setErrors((prev) => ({ ...prev, amount: undefined }));
      }
    }
  };

  const handleMax = () => {
    setAmount(maxBorrow.toString());
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    const amountNum = parseFloat(amount);

    if (!amount || amountNum <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (amountNum > maxBorrow) {
      newErrors.amount = `Amount exceeds maximum borrowable (${maxBorrow.toLocaleString()} tokens)`;
    }

    if (!duration) {
      newErrors.duration = 'Please select a duration';
    }

    if (!incomeReference) {
      newErrors.incomeRef = 'Income reference is required to borrow';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    if (!contract || !connectedAccount || !client) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet to request a loan',
      });
      return;
    }

    const amountNum = parseFloat(amount);
    const amountBigInt = parseTokenAmount(amount, decimals);

    if (amountBigInt === 0n) {
      toast.error('Invalid amount', {
        description: 'Please enter a valid loan amount greater than 0',
      });
      return;
    }

    // Check if amount is too small (less than 1 unit in smallest denomination)
    if (amountNum < 1 / 10 ** decimals) {
      toast.error('Amount too small', {
        description: `Minimum loan amount is ${1 / 10 ** decimals} tokens`,
      });
      return;
    }

    const toaster = txToaster();
    
    try {
      setIsSubmitting(true);

      // Check balance sufficiency (for transaction fees)
      await checkBalanceSufficiency(client, connectedAccount.address);

      // Encode purpose - using duration as part of purpose or empty string
      // The contract expects BytesLike (Vec<u8>), so we encode the string
      const purposeText = `Loan request for ${amountNum} tokens, duration: ${duration} days`;
      const purpose = encodePurpose(purposeText);

      // Execute loan request transaction
      await contract.tx
        .requestLoan({
          amount: amountBigInt,
          purpose: purpose,
        })
        .signAndSend(connectedAccount.address, (progress) => {
          toaster.onTxProgress(progress);

          if (progress.status.type === 'BestChainBlockIncluded' || progress.status.type === 'Finalized') {
            // Transaction successful
            setAmount('');
            setDuration(String(DEFAULTS.LOAN_DURATION_DAYS));
            
            // Invalidate loan-related queries to refresh data
            if (connectedAccount.address) {
              queryClient.invalidateQueries({
                queryKey: borrowKeys.loans.byBorrower(connectedAccount.address),
              });
            }
            queryClient.invalidateQueries({ queryKey: borrowKeys.loans.funding });
            queryClient.invalidateQueries({ queryKey: borrowKeys.loans.all });
            
            toast.success('Loan request created', {
              description: `Request for ${amountNum.toLocaleString()} tokens submitted successfully`,
            });
            onRequestCreated?.();
          }
        })
        .untilFinalized();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error requesting loan:', err);
      toaster.onTxError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountNum = parseFloat(amount) || 0;
  const interestRate = Number(pool.baseInterestRate) / 100;
  const durationDays = parseInt(duration) || DEFAULTS.LOAN_DURATION_DAYS;
  
  const estimatedInterest = useMemo(() => {
    return amountNum > 0 
      ? (amountNum * interestRate * durationDays) / 365 
      : 0;
  }, [amountNum, interestRate, durationDays]);

  const totalRepayment = useMemo(() => {
    return amountNum + estimatedInterest;
  }, [amountNum, estimatedInterest]);

  const isFormValid = useMemo(() => {
    return incomeReference !== undefined && pool.status === 'active' && !!contract && !!connectedAccount;
  }, [incomeReference, pool.status, contract, connectedAccount]);

  return {
    amount,
    duration,
    isSubmitting,
    errors,
    amountNum,
    interestRate,
    estimatedInterest,
    totalRepayment,
    isFormValid,
    handleAmountChange,
    handleMax,
    handleSubmit,
    setDuration,
  };
}

