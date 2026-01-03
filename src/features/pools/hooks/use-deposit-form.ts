'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { Pool } from '@/lib/types';

interface UseDepositFormProps {
  pool: Pool;
  onAmountChange?: (amount: number) => void;
}

export function useDepositForm({ pool, onAmountChange }: UseDepositFormProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock user balance
  const userBalance = 5000; // Mock balance in tokens

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
    setAmount(userBalance.toString());
  };

  const depositAmount = parseFloat(amount) || 0;
  
  const isValid = useMemo(() => {
    return depositAmount > 0 && depositAmount <= userBalance;
  }, [depositAmount, userBalance]);

  const interestRate = useMemo(() => {
    return Number(pool.baseInterestRate) / 100;
  }, [pool.baseInterestRate]);

  const estimatedAnnualReturn = useMemo(() => {
    return depositAmount * (Number(pool.baseInterestRate) / 10000);
  }, [depositAmount, pool.baseInterestRate]);

  const hasInsufficientBalance = depositAmount > userBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission - no side effects
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setAmount('');
      onAmountChange?.(0);
      toast.success('Deposit successful', {
        description: `${depositAmount.toLocaleString()} tokens deposited to pool`,
      });
      // In a real app, this would trigger a mutation
    }, 1000);
  };

  const isFormDisabled = pool.status !== 'active';

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

