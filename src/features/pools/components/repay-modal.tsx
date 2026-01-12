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
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useRepayLoan } from '@/features/pools/hooks/use-loan-transactions';
import { useRepaymentAmount } from '@/features/pools/hooks/use-loan-queries';
import { useTypink } from 'typink';
import { borrowKeys } from '@/features/pools/hooks/use-borrow-data';
import { useQueryClient } from '@tanstack/react-query';
import type { LoanDetails } from '@/lib/types';

/**
 * Convert a token amount (human-readable) to bigint (smallest unit)
 */
function parseTokenAmount(amount: string, decimals: number): bigint {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return 0n;
  return BigInt(Math.floor(num * 10 ** decimals));
}

interface RepayModalProps {
  loanId: string;
  loan: LoanDetails | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RepayModal({ loan, open, onOpenChange }: RepayModalProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { connectedAccount, network } = useTypink();
  const { repayLoan } = useRepayLoan();
  const { data: repaymentAmount } = useRepaymentAmount(BigInt(loan.loanId));
  const queryClient = useQueryClient();

  // Get network decimals (default to 12 for Asset Hub chains, fallback to 18)
  const decimals = network?.decimals ?? 12;

  if (!loan) return null;

  // Convert bigint to number for display (loans use 10 decimals)
  const LOAN_DECIMALS = 10;
  const totalRepayment = Number(loan.totalRepayment) / 10 ** LOAN_DECIMALS;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connectedAccount) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet to repay the loan',
      });
      return;
    }

    if (!repaymentAmount) {
      setError('Repayment amount not available');
      return;
    }

    const amountNum = parseFloat(amount);
    // Loans use 10 decimals for amounts
    const LOAN_DECIMALS = 10;
    const repaymentAmountBigInt = parseTokenAmount(amount, LOAN_DECIMALS);
    
    if (!amount || amountNum <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (amountNum > totalRepayment) {
      setError(`Amount cannot exceed total repayment (${formatBalance(totalRepayment)} tokens)`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Convert repayment amount from 18 decimals (loan contract) to network decimals
      const loanDecimals = 18;
      const conversionFactor = 10n ** BigInt(loanDecimals - decimals);
      const repaymentAmountInNetworkDecimals = repaymentAmount / conversionFactor;
      
      // For partial payments, calculate the amount in network decimals
      const paymentRatio = amountNum / totalRepayment;
      const paymentAmountInNetworkDecimals = (repaymentAmountInNetworkDecimals * BigInt(Math.floor(paymentRatio * 10000))) / 10000n;
      
      const loanId = BigInt(loan.loanId);
      await repayLoan(loanId, paymentAmountInNetworkDecimals);
      
      setAmount('');
      setError(null);
      const isFullPayment = amountNum >= totalRepayment;
      
      // Invalidate loan-related queries to refresh data
      if (connectedAccount.address) {
        queryClient.invalidateQueries({
          queryKey: borrowKeys.loans.byBorrower(connectedAccount.address),
        });
      }
      queryClient.invalidateQueries({ queryKey: borrowKeys.loans.active });
      queryClient.invalidateQueries({ queryKey: borrowKeys.detail(loan.loanId.toString()) });
      
      toast.success(isFullPayment ? 'Loan repaid in full' : 'Payment processed', {
        description: `${amountNum.toLocaleString()} tokens paid towards loan`,
      });
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error repaying loan:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="rounded-lg border border-slate-200 bg-anti-flash-white/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Total Repayment</span>
              <span className="font-semibold text-slate-900">{formatBalance(totalRepayment)} tokens</span>
            </div>
            {loan.isOverdue && (
              <div className="flex items-center justify-between text-sm text-red-600">
                <span>Overdue Penalty</span>
                <span className="font-semibold">
                  {/* Penalty calculation - contract may handle this differently */}
                  {formatBalance(0)} tokens
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
            <div className="rounded-lg border border-slate-200 bg-anti-flash-white/50 p-4">
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

