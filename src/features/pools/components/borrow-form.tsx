'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { ArrowDown, AlertCircle } from 'lucide-react';
import { useBorrowForm } from '@/features/pools/hooks/use-borrow-form';
import type { Pool } from '@/services/mock/pools.mock';

interface BorrowFormProps {
  pool: Pool;
  maxBorrow: number;
  onRequestCreated?: () => void;
}

export function BorrowForm({ pool, maxBorrow, onRequestCreated }: BorrowFormProps) {
  const {
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
  } = useBorrowForm({ pool, maxBorrow, onRequestCreated });

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
                    disabled={isSubmitting || !isFormValid}
                  >
                    {isSubmitting ? 'Submitting Request...' : 'Request Loan'}
                  </Button>
                </div>
              </TooltipTrigger>
              {!isFormValid && (
                <TooltipContent>
                  <p>
                    {pool.status !== 'active'
                      ? 'Pool is not active. Loan requests are currently disabled.'
                      : 'Please add an income reference in your profile first'}
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

