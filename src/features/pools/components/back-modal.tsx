'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { AlertTriangle, DollarSign, Shield } from 'lucide-react';
import { useVouchForLoan } from '@/features/pools/hooks/use-loan-transactions';
import { useStars } from '@/features/profile/hooks/use-reputation-queries';
import { useTypink } from 'typink';
import type { LoanDetails } from '@/lib/types';

interface BackModalProps {
  loanId: string;
  loan: LoanDetails | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackModal({ loan, open, onOpenChange }: BackModalProps) {
  const { connectedAccount } = useTypink();
  const { vouchForLoan } = useVouchForLoan();
  const { data: userStars } = useStars(connectedAccount?.address);
  
  const [stars, setStars] = useState('');
  const [capitalPercent, setCapitalPercent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!loan) return null;

  const formatBalance = (tokens: number) => {
    return tokens.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const handleStarsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*$/.test(value)) {
      setStars(value);
      setError(null);
      setConfirmed(false);
    }
  };

  const handleCapitalPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCapitalPercent(value);
      setError(null);
      setConfirmed(false);
    }
  };

  const handleMaxStars = () => {
    if (userStars && userStars > 0) {
      setStars(userStars.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connectedAccount) {
      setError('Wallet not connected');
      return;
    }

    const starsNum = parseInt(stars);
    const capitalPercentNum = parseFloat(capitalPercent);
    
    if (!stars || starsNum <= 0) {
      setError('Stars must be greater than 0');
      return;
    }

    if (!capitalPercent || capitalPercentNum <= 0 || capitalPercentNum > 100) {
      setError('Capital percent must be between 1 and 100');
      return;
    }

    if (userStars && starsNum > userStars) {
      setError(`Insufficient stars. Available: ${userStars}`);
      return;
    }

    if (!confirmed) {
      setError('Please confirm you understand the risks');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const loanId = BigInt(loan.loanId);
      await vouchForLoan(loanId, starsNum, capitalPercentNum);
      
      setStars('');
      setCapitalPercent('');
      setConfirmed(false);
      onOpenChange(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const starsNum = parseInt(stars) || 0;
  const capitalPercentNum = parseFloat(capitalPercent) || 0;
  const interestRate = Number(loan.interestRate) / 100;
  const durationDays = Math.floor(Number(loan.term) / (24 * 60 * 60 * 1000));
  const riskScore = interestRate > 10 ? 'high' : interestRate > 6 ? 'medium' : 'low';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            Vouch for Loan
          </DialogTitle>
          <DialogDescription>
            Stake your stars and capital to vouch for this loan. Review all risks carefully before proceeding.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Loan Summary */}
          <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Loan Amount</span>
              <span className="font-semibold text-card-foreground">{formatBalance(Number(loan.amount) / 1e18)} tokens</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Interest Rate</span>
              <span className="font-semibold text-card-foreground">{interestRate.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Loan Term</span>
              <span className="font-semibold text-card-foreground">{durationDays} days</span>
            </div>
          </div>

          {/* Stars Input */}
          <div className="space-y-2">
            <Label htmlFor="vouch-stars">Stars to Stake</Label>
            <div className="relative">
              <Input
                id="vouch-stars"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={stars}
                onChange={handleStarsChange}
                disabled={isSubmitting}
                className="pr-20"
                aria-invalid={!!error}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">stars</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleMaxStars}
                  disabled={isSubmitting || !userStars || userStars === 0}
                  className="h-6 px-2 text-xs"
                >
                  MAX
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Available stars</span>
              <span className="font-medium text-card-foreground">{userStars ?? 0}</span>
            </div>
          </div>

          {/* Capital Percent Input */}
          <div className="space-y-2">
            <Label htmlFor="vouch-capital">Capital Percent (0-100)</Label>
            <Input
              id="vouch-capital"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={capitalPercent}
              onChange={handleCapitalPercentChange}
              disabled={isSubmitting}
              className="pr-20"
              aria-invalid={!!error}
            />
            <p className="text-xs text-muted-foreground">
              Percentage of loan amount you're willing to fund
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="size-4" />
                {error}
              </p>
            </div>
          )}

          {/* Risk & Exposure Warning */}
          {starsNum > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-red-900 flex items-center gap-2">
                <Shield className="size-4" />
                Risk & Exposure
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-red-800">Stars at Risk</span>
                  <span className="font-semibold text-red-900">{starsNum} stars</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-800">Capital Percent</span>
                  <span className="font-semibold text-red-900">{capitalPercentNum.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-800">Reputation at Risk</span>
                  <span className="font-semibold text-red-900">Stars will be slashed if default</span>
                </div>
                {riskScore === 'high' && (
                  <div className="pt-2 border-t border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="size-4 text-red-600 mt-0.5" />
                      <p className="text-xs text-red-800">
                        High risk loan. Default could result in loss of {starsNum} stars and capital exposure.
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
              disabled={isSubmitting || !stars || starsNum <= 0 || !capitalPercent || capitalPercentNum <= 0 || !confirmed}
            >
              {isSubmitting ? 'Processing...' : 'Confirm & Vouch for Loan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

