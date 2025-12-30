'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUp, Info, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
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

  const depositAmount = parseFloat(amount) || 0;
  const isValid = depositAmount > 0 && depositAmount <= userBalance;

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
            <div className="flex items-center gap-2">
              <Label htmlFor="deposit-amount">Amount</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the amount you want to deposit. This will be added to the pool's liquidity.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Input
                id="deposit-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                disabled={isSubmitting || pool.status !== 'active'}
                className="pr-20"
                aria-describedby={depositAmount > userBalance ? 'deposit-error' : undefined}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">tokens</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleMax}
                        disabled={isSubmitting || pool.status !== 'active'}
                        className="h-6 px-2 text-xs"
                      >
                        MAX
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Use your full available balance</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            {depositAmount > userBalance && (
              <p id="deposit-error" className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="size-4" />
                Insufficient balance
              </p>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Available balance</span>
              <span className="font-medium text-card-foreground">{userBalance.toLocaleString()} tokens</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated APY</span>
              <span className="font-semibold text-card-foreground">
                {(Number(pool.baseInterestRate) / 100).toFixed(2)}%
              </span>
            </div>
            {depositAmount > 0 && (
              <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Estimated annual return</span>
                <span className="font-semibold text-card-foreground">
                  {(depositAmount * (Number(pool.baseInterestRate) / 10000)).toFixed(2)} tokens
                </span>
              </div>
            )}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={!isValid || isSubmitting || pool.status !== 'active'}
                  >
                    {isSubmitting ? 'Processing...' : 'Deposit'}
                  </Button>
                </div>
              </TooltipTrigger>
              {pool.status !== 'active' && (
                <TooltipContent>
                  <p>Pool is not active. Deposits are currently disabled.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </form>
      </CardContent>
    </Card>
  );
}

