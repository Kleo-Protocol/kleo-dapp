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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle, DollarSign, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/store/user.store';
import type { LoanDetails } from '@/services/mock/loans.mock';

interface BackModalProps {
  loanId: string;
  loan: LoanDetails | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackModal({ loanId, loan, open, onOpenChange }: BackModalProps) {
  const { capital, reputation } = useUserStore();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!loan) return null;

  const formatBalance = (tokens: number) => {
    return tokens.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
      setConfirmed(false);
    }
  };

  const handleMax = () => {
    const maxAmount = Number(loan.remainingAmount) / 1e18;
    const availableCapital = capital;
    const safeAmount = Math.min(maxAmount, availableCapital);
    setAmount(safeAmount.toString());
    setConfirmed(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    
    if (!amount || amountNum <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (amountNum > capital) {
      setError(`Insufficient capital. Available: ${formatBalance(capital)} tokens`);
      return;
    }

    const maxAmount = Number(loan.remainingAmount) / 1e18;
    if (amountNum > maxAmount) {
      setError(`Amount exceeds remaining funding needed (${formatBalance(maxAmount)} tokens)`);
      return;
    }

    if (!confirmed) {
      setError('Please confirm you understand the risks');
      return;
    }

    // Mock submission - no side effects
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setAmount('');
      setConfirmed(false);
      setError(null);
      toast.success('Loan backed successfully', {
        description: `${amountNum.toLocaleString()} tokens contributed to loan`,
      });
      onOpenChange(false);
      // In a real app, this would trigger a mutation
    }, 1000);
  };

  const amountNum = parseFloat(amount) || 0;
  const interestRate = Number(loan.interestRate) / 100;
  const durationDays = Math.floor(Number(loan.duration) / (24 * 60 * 60));
  const estimatedReturn = amountNum > 0 ? (amountNum * interestRate * durationDays) / 365 : 0;
  const totalReturn = amountNum + estimatedReturn;
  const capitalExposure = (amountNum / capital) * 100;
  const riskScore = interestRate > 10 ? 'high' : interestRate > 6 ? 'medium' : 'low';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            Back Loan Request
          </DialogTitle>
          <DialogDescription>
            Fund this loan request. Review all risks carefully before proceeding.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Loan Summary */}
          <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Loan Amount</span>
              <span className="font-semibold text-card-foreground">{formatBalance(Number(loan.requestedAmount) / 1e18)} tokens</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Interest Rate</span>
              <span className="font-semibold text-card-foreground">{interestRate.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Remaining to Fund</span>
              <span className="font-semibold text-card-foreground">{formatBalance(Number(loan.remainingAmount) / 1e18)} tokens</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="back-amount">Your Contribution</Label>
            <div className="relative">
              <Input
                id="back-amount"
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
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="size-4" />
                {error}
              </p>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Available capital</span>
              <span className="font-medium text-card-foreground">{formatBalance(capital)} tokens</span>
            </div>
          </div>

          {/* Returns Preview */}
          {amountNum > 0 && (
            <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-card-foreground">Expected Returns</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Interest</span>
                <span className="font-medium text-card-foreground">{formatBalance(estimatedReturn)} tokens</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                <span className="text-slate-600">Total Return</span>
                <span className="font-semibold text-slate-900">{formatBalance(totalReturn)} tokens</span>
              </div>
            </div>
          )}

          {/* Risk & Exposure Warning */}
          {amountNum > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-red-900 flex items-center gap-2">
                <Shield className="size-4" />
                Risk & Exposure
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-red-800">Capital at Risk</span>
                  <span className="font-semibold text-red-900">{formatBalance(amountNum)} tokens</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-800">Capital Exposure</span>
                  <span className="font-semibold text-red-900">{capitalExposure.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-800">Reputation at Risk</span>
                  <span className="font-semibold text-red-900">-10 points if default</span>
                </div>
                {riskScore === 'high' && (
                  <div className="pt-2 border-t border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="size-4 text-red-600 mt-0.5" />
                      <p className="text-xs text-red-800">
                        High risk loan. Default could result in loss of {formatBalance(amountNum)} tokens and {reputation > 10 ? '10' : reputation.toString()} reputation points.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
            <input
              type="checkbox"
              id="risk-confirm"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked);
                setError(null);
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            />
            <label htmlFor="risk-confirm" className="text-sm text-slate-700 cursor-pointer">
              I understand that lending involves risk. I may lose my capital and reputation points if the borrower defaults. 
              I am lending only what I can afford to lose.
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !amount || amountNum <= 0 || !confirmed}
            >
              {isSubmitting ? 'Processing...' : 'Confirm & Back Loan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

