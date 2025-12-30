'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowDown, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/store/user.store';
import type { Pool } from '@/services/mock/pools.mock';

interface BorrowFormProps {
  pool: Pool;
  maxBorrow: number;
  onRequestCreated?: () => void;
}

export function BorrowForm({ pool, maxBorrow, onRequestCreated }: BorrowFormProps) {
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
  const estimatedInterest = amountNum > 0 
    ? (amountNum * interestRate * durationDays) / 365 
    : 0;
  const totalRepayment = amountNum + estimatedInterest;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDown className="size-5" />
          Request Loan
        </CardTitle>
        <CardDescription>Submit a loan request to this pool</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="borrow-amount">Loan Amount</Label>
            <div className="relative">
              <Input
                id="borrow-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                disabled={isSubmitting}
                className="pr-20"
                aria-invalid={!!errors.amount}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">tokens</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleMax}
                  disabled={isSubmitting}
                  className="h-6 px-2 text-xs"
                >
                  MAX
                </Button>
              </div>
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="size-4" />
                {errors.amount}
              </p>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Max borrowable</span>
              <span className="font-medium text-card-foreground">{maxBorrow.toLocaleString()} tokens</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="borrow-duration">Loan Duration</Label>
            <Select value={duration} onValueChange={setDuration} disabled={isSubmitting}>
              <SelectTrigger id="borrow-duration" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">365 days</SelectItem>
              </SelectContent>
            </Select>
            {errors.duration && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="size-4" />
                {errors.duration}
              </p>
            )}
          </div>

          {errors.incomeRef && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="size-4" />
                {errors.incomeRef}
              </p>
            </div>
          )}

          {amountNum > 0 && (
            <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-semibold text-card-foreground">{interestRate.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Interest</span>
                <span className="font-semibold text-card-foreground">
                  {estimatedInterest.toLocaleString('en-US', { maximumFractionDigits: 2 })} tokens
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Total Repayment</span>
                <span className="font-semibold text-card-foreground">
                  {totalRepayment.toLocaleString('en-US', { maximumFractionDigits: 2 })} tokens
                </span>
              </div>
            </div>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={isSubmitting || !incomeReference || pool.status !== 'active'}
                  >
                    {isSubmitting ? 'Submitting Request...' : 'Request Loan'}
                  </Button>
                </div>
              </TooltipTrigger>
              {!incomeReference && (
                <TooltipContent>
                  <p>Please add an income reference in your profile first</p>
                </TooltipContent>
              )}
              {pool.status !== 'active' && (
                <TooltipContent>
                  <p>Pool is not active. Loan requests are currently disabled.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </form>
      </CardContent>
    </Card>
  );
}

