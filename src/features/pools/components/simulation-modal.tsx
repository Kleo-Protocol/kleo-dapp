'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { AlertTriangle, TrendingUp, DollarSign, Shield } from 'lucide-react';
import type { LoanDetails } from '@/services/mock/loans.mock';

interface SimulationModalProps {
  loanId: string;
  loan: LoanDetails | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimulationModal({ loanId, loan, open, onOpenChange }: SimulationModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!loan) return null;

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
    const maxAmount = Number(loan.remainingAmount) / 1e18;
    setAmount(maxAmount.toString());
  };

  const amountNum = parseFloat(amount) || 0;
  const interestRate = Number(loan.interestRate) / 100;
  const durationDays = Math.floor(Number(loan.duration) / (24 * 60 * 60));
  
  // Mock calculations
  const estimatedReturn = amountNum > 0 ? (amountNum * interestRate * durationDays) / 365 : 0;
  const totalReturn = amountNum + estimatedReturn;
  
  // Mock risk metrics
  const defaultProbability = 5; // 5% default probability (mock)
  const potentialLoss = amountNum * (defaultProbability / 100);
  const riskScore = interestRate > 10 ? 'high' : interestRate > 6 ? 'medium' : 'low';

  const maxAmount = Number(loan.remainingAmount) / 1e18;
  const isValid = amountNum > 0 && amountNum <= maxAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Simulate Lending
          </DialogTitle>
          <DialogDescription>
            Preview potential returns and risks before backing this loan request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loan Details */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Loan Amount</span>
              <span className="font-semibold text-slate-900">{formatBalance(Number(loan.requestedAmount) / 1e18)} tokens</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Interest Rate</span>
              <span className="font-semibold text-slate-900">{interestRate.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Duration</span>
              <span className="font-semibold text-slate-900">{durationDays} days</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Remaining to Fund</span>
              <span className="font-semibold text-slate-900">{formatBalance(maxAmount)} tokens</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="sim-amount">Lending Amount</Label>
            <div className="relative">
              <Input
                id="sim-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
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
                  className="h-6 px-2 text-xs"
                >
                  MAX
                </Button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Returns Preview */}
          {amountNum > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <DollarSign className="size-4" />
                Expected Returns
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Principal</span>
                  <span className="font-medium text-slate-900">{formatBalance(amountNum)} tokens</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Estimated Interest</span>
                  <span className="font-medium text-slate-900">{formatBalance(estimatedReturn)} tokens</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="text-slate-600">Total Return</span>
                  <span className="font-semibold text-slate-900">{formatBalance(totalReturn)} tokens</span>
                </div>
              </div>
            </div>
          )}

          {/* Risk Assessment */}
          {amountNum > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="size-4" />
                Risk Assessment
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Risk Level</span>
                  {riskScore === 'high' && (
                    <span className="font-medium text-red-600">High Risk</span>
                  )}
                  {riskScore === 'medium' && (
                    <span className="font-medium text-yellow-600">Medium Risk</span>
                  )}
                  {riskScore === 'low' && (
                    <span className="font-medium text-forest-green">Low Risk</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Estimated Default Probability</span>
                  <span className="font-medium text-slate-900">{defaultProbability}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Potential Capital Loss</span>
                  <span className="font-medium text-red-600">{formatBalance(potentialLoss)} tokens</span>
                </div>
              </div>
              {riskScore === 'high' && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 flex items-start gap-2">
                  <AlertTriangle className="size-4 text-red-600 mt-0.5" />
                  <p className="text-xs text-red-800">
                    High interest rate indicates higher default risk. Only lend what you can afford to lose.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Capital & Reputation Exposure */}
          {amountNum > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="size-4" />
                Your Exposure
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-amber-800">Capital at Risk</span>
                  <span className="font-semibold text-amber-900">{formatBalance(amountNum)} tokens</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-800">Reputation at Risk</span>
                  <span className="font-semibold text-amber-900">-10 points if default</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

