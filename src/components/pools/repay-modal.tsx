'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import type { LoanDetails } from '@/services/mock/loans.mock';

interface RepayModalProps {
  loanId: string;
  loan: LoanDetails | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RepayModal({ loanId, loan, open, onOpenChange }: RepayModalProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loan) return null;

  const totalRepayment = Number(loan.totalRepayment) / 1e18;
  const formatBalance = (tokens: number) => {
    return tokens.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleMax = () => {
    setAmount(totalRepayment.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    
    if (!amount || amountNum <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (amountNum > totalRepayment) {
      setError(`Amount cannot exceed total repayment (${formatBalance(totalRepayment)} tokens)`);
      return;
    }

    // Mock submission - no side effects
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setAmount('');
      setError(null);
      const isFullPayment = amountNum >= totalRepayment;
      toast.success(isFullPayment ? 'Loan repaid in full' : 'Payment processed', {
        description: `${amountNum.toLocaleString()} tokens paid towards loan`,
      });
      onOpenChange(false);
      // In a real app, this would trigger a mutation
    }, 1000);
  };

  const amountNum = parseFloat(amount) || 0;
  const remainingAfterPayment = totalRepayment - amountNum;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            Repay Loan
          </DialogTitle>
          <DialogDescription>
            Make a payment towards your loan. You can pay the full amount or make a partial payment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Total Repayment</span>
              <span className="font-semibold text-slate-900">{formatBalance(totalRepayment)} tokens</span>
            </div>
            {loan.isOverdue && (
              <div className="flex items-center justify-between text-sm text-red-600">
                <span>Overdue Penalty</span>
                <span className="font-semibold">
                  {formatBalance((Number(loan.fundedAmount) * Number(loan.penaltyRate)) / 1e20)} tokens
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="repay-amount">Payment Amount</Label>
            <div className="relative">
              <Input
                id="repay-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                disabled={isSubmitting}
                className="pr-20"
                aria-invalid={!!error}
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
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="size-4" />
                {error}
              </p>
            )}
          </div>

          {amountNum > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Remaining After Payment</span>
                <span className="font-semibold text-slate-900">
                  {formatBalance(Math.max(0, remainingAfterPayment))} tokens
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || !amount || parseFloat(amount) <= 0}>
              {isSubmitting ? 'Processing...' : 'Repay'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

