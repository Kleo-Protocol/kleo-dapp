'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useTypink } from 'typink';
import { borrowKeys } from './use-borrow-data';
import { useRequestLoan } from './use-loan-transactions';
import { useQueryClient } from '@tanstack/react-query';
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

export function useBorrowForm({ pool, maxBorrow, onRequestCreated }: UseBorrowFormProps) {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(String(DEFAULTS.LOAN_DURATION_DAYS));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; duration?: string }>({});
  
  const { connectedAccount } = useTypink();
  const { requestLoan } = useRequestLoan();
  const queryClient = useQueryClient();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connectedAccount) {
      toast.error('Wallet not connected');
      return;
    }

    // Exact same logic as flow-testing
    const amountBigInt = parseTokenAmount(amount, 18); // Loans use 18 decimals
    const termDays = parseInt(duration);
    const termMs = BigInt(termDays * 24 * 60 * 60 * 1000);

    if (amountBigInt === 0n || isNaN(termDays)) {
      toast.error('Invalid amount or term');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestLoan(amountBigInt, termMs);
      setAmount('');
      setDuration(String(DEFAULTS.LOAN_DURATION_DAYS));
      setErrors({});
      
      // Invalidate loan-related queries
      if (connectedAccount.address) {
        queryClient.invalidateQueries({
          queryKey: borrowKeys.loans.byBorrower(connectedAccount.address),
        });
      }
      queryClient.invalidateQueries({ queryKey: borrowKeys.loans.funding });
      queryClient.invalidateQueries({ queryKey: borrowKeys.loans.all });
      queryClient.invalidateQueries({ queryKey: ['loans', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['loans', 'active'] });
      
      toast.success('Loan requested successfully');
      onRequestCreated?.();
    } catch (error) {
      console.error('Error requesting loan:', error);
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
    // Simple validation like flow-testing
    return !!connectedAccount && !!amount && !!duration && parseFloat(amount) > 0 && parseInt(duration) > 0;
  }, [amount, duration, connectedAccount]);

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

