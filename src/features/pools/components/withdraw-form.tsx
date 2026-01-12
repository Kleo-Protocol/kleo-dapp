'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { ArrowDown, Info, AlertCircle } from 'lucide-react';
import { useWithdrawForm } from '@/features/pools/hooks/use-withdraw-form';
import type { Pool } from '@/lib/types';

interface WithdrawFormProps {
  pool: Pool;
  onAmountChange?: (amount: number) => void;
}

export function WithdrawForm({ pool, onAmountChange }: WithdrawFormProps) {
  const {
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
  } = useWithdrawForm({ pool, onAmountChange });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDown className="size-5" />
          Withdraw Funds
        </CardTitle>
        <CardDescription>Withdraw your deposited funds from this pool</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="withdraw-amount">Amount</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the amount you want to withdraw. This will be removed from the pool's liquidity.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Input
                id="withdraw-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                disabled={isSubmitting || isFormDisabled}
                className="pr-20"
                aria-describedby={hasInsufficientBalance ? 'withdraw-error' : undefined}
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
                        disabled={isSubmitting || isFormDisabled}
                        className="h-6 px-2 text-xs"
                      >
                        MAX
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Use your full available deposit</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            {hasInsufficientBalance && (
              <p id="withdraw-error" className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="size-4" />
                Insufficient deposit
              </p>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Available to withdraw</span>
              <span className="font-medium text-card-foreground">
                {availableToWithdraw.toLocaleString()} tokens
              </span>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={!isValid || isSubmitting || isFormDisabled}
                  >
                    {isSubmitting ? 'Processing...' : 'Withdraw'}
                  </Button>
                </div>
              </TooltipTrigger>
              {isFormDisabled && (
                <TooltipContent>
                  <p>
                    {availableToWithdraw === 0
                      ? 'You have no funds available to withdraw'
                      : 'Pool is not active. Withdrawals are currently disabled.'}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </form>
      </CardContent>
    </Card>
  );
}
