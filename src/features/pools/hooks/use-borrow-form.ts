'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useUserStore } from '@/store/user.store';
import type { Pool } from '@/services/mock/pools.mock';

interface UseBorrowFormProps {
  pool: Pool;
  maxBorrow: number;
  onRequestCreated?: () => void;
}

export function useBorrowForm({ pool, maxBorrow, onRequestCreated }: UseBorrowFormProps) {
  const { incomeReference } = useUserStore();
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('90');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; duration?: string; incomeRef?: string }>({});

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const amountNum = parseFloat(amount);

    // Mock submission - no side effects
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setAmount('');
      setDuration('90');
      toast.success('Loan request created', {
        description: `Request for ${amountNum.toLocaleString()} tokens submitted successfully`,
      });
      onRequestCreated?.();
      // In a real app, this would trigger a mutation
    }, 1000);
  };

  const amountNum = parseFloat(amount) || 0;
  const interestRate = Number(pool.baseInterestRate) / 100;
  const durationDays = parseInt(duration) || 90;
  
  const estimatedInterest = useMemo(() => {
    return amountNum > 0 
      ? (amountNum * interestRate * durationDays) / 365 
      : 0;
  }, [amountNum, interestRate, durationDays]);

  const totalRepayment = useMemo(() => {
    return amountNum + estimatedInterest;
  }, [amountNum, estimatedInterest]);

  const isFormValid = useMemo(() => {
    return incomeReference !== undefined && pool.status === 'active';
  }, [incomeReference, pool.status]);

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

