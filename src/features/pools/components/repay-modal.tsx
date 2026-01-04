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
import { useContract, useTypink, useBalances, txToaster, checkBalanceSufficiency } from 'typink';
import { useQueryClient } from '@tanstack/react-query';
import { ContractId } from '@/contracts/deployments';
import { borrowKeys } from '@/features/pools/hooks/use-borrow-data';
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
  
  const { contract } = useContract(ContractId.LENDING_POOL);
  const { client, connectedAccount, network } = useTypink();
  const queryClient = useQueryClient();

  // Get network decimals (default to 12 for Asset Hub chains, fallback to 18)
  const decimals = network?.decimals ?? 12;

  // Get addresses array for useBalances
  const addresses = connectedAccount ? [connectedAccount.address] : [];
  const balances = useBalances(addresses);

  // Get user balance in tokens (human-readable)
  const userBalance = connectedAccount && balances[connectedAccount.address]
    ? Number(balances[connectedAccount.address].free) / 10 ** decimals
    : 0;

  if (!loan) return null;

  // Convert bigint to number for display (assuming 18 decimals)
  const totalRepayment = Number(loan.totalRepayment) / 10 ** decimals;
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
    
    if (!contract || !connectedAccount || !client) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet to repay the loan',
      });
      return;
    }

    const amountNum = parseFloat(amount);
    const repaymentAmountBigInt = parseTokenAmount(amount, decimals);
    
    if (!amount || amountNum <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (amountNum > totalRepayment) {
      setError(`Amount cannot exceed total repayment (${formatBalance(totalRepayment)} tokens)`);
      return;
    }

    if (repaymentAmountBigInt === 0n) {
      setError('Invalid amount');
      return;
    }

    // Check if user has enough balance
    const currentBalance = balances[connectedAccount.address];
    if (!currentBalance || currentBalance.free < repaymentAmountBigInt) {
      setError('Insufficient balance for repayment');
      return;
    }

    const toaster = txToaster();
    
    try {
      setIsSubmitting(true);
      setError(null);

      // Check balance sufficiency (for transaction fees)
      await checkBalanceSufficiency(client, connectedAccount.address);

      // Execute repayment transaction
      // The receiveRepayment function is payable, so we send the amount as the transaction value
      await contract.tx
        .receiveRepayment({
          amount: repaymentAmountBigInt,
          value: repaymentAmountBigInt,
        })
        .signAndSend(connectedAccount.address, (progress) => {
          toaster.onTxProgress(progress);

          if (progress.status.type === 'BestChainBlockIncluded' || progress.status.type === 'Finalized') {
            // Transaction successful
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
            queryClient.invalidateQueries({ queryKey: borrowKeys.detail(loan.loanId) });
            
            toast.success(isFullPayment ? 'Loan repaid in full' : 'Payment processed', {
              description: `${amountNum.toLocaleString()} tokens paid towards loan`,
            });
            onOpenChange(false);
          }
        })
        .untilFinalized();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error repaying loan:', err);
      setError(err.message);
      toaster.onTxError(err);
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

