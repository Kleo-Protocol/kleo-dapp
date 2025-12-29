'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Wallet, ArrowUp } from 'lucide-react';
import type { Pool } from '@/services/mock/pools.mock';

interface DepositFormProps {
  pool: Pool;
  onAmountChange?: (amount: number) => void;
}

export function DepositForm({ pool, onAmountChange }: DepositFormProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission - no side effects
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setAmount('');
      // In a real app, this would trigger a mutation
    }, 1000);
  };

  const depositAmount = parseFloat(amount) || 0;
  const isValid = depositAmount > 0 && depositAmount <= userBalance;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUp className="size-5" />
          Deposit Funds
        </CardTitle>
        <CardDescription>Add liquidity to this pool and start earning returns</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Amount</Label>
            <div className="relative">
              <Input
                id="deposit-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                disabled={isSubmitting}
                className="pr-20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-sm text-slate-500">tokens</span>
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
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Available balance</span>
              <span className="font-medium text-slate-900">{userBalance.toLocaleString()} tokens</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Estimated APY</span>
              <span className="font-semibold text-slate-900">
                {(Number(pool.baseInterestRate) / 100).toFixed(2)}%
              </span>
            </div>
            {depositAmount > 0 && (
              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                <span className="text-slate-600">Estimated annual return</span>
                <span className="font-semibold text-slate-900">
                  {(depositAmount * (Number(pool.baseInterestRate) / 10000)).toFixed(2)} tokens
                </span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Deposit'}
          </Button>

          {depositAmount > userBalance && (
            <p className="text-sm text-red-600">Insufficient balance</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

