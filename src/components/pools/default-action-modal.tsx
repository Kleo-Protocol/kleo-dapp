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
import { AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatBalance, formatAddress } from '@/utils/format';

interface LoanHistoryItem {
  loanId: string;
  borrower: string;
  amount: bigint;
  interestRate: bigint;
  dueDate: bigint;
  status: 'active' | 'completed' | 'defaulted' | 'overdue';
  repaidAmount: bigint;
  isOverdue: boolean;
  createdAt: number;
}

interface DefaultActionModalProps {
  loanId: string;
  loan: LoanHistoryItem | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DefaultActionModal({ loanId, loan, open, onOpenChange }: DefaultActionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!loan) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmed) {
      return;
    }

    // Mock submission - no side effects
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setConfirmed(false);
      toast.error('Loan marked as defaulted', {
        description: 'Borrower reputation has been penalized. Lenders will be notified.',
      });
      onOpenChange(false);
      // In a real app, this would trigger a mutation to mark loan as defaulted
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="size-5" />
            Mark Loan as Defaulted
          </DialogTitle>
          <DialogDescription>
            This action will mark the loan as defaulted and trigger reputation penalties for the borrower.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Loan Amount</span>
              <span className="font-semibold text-card-foreground">{formatBalance(loan.amount)} tokens</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Borrower</span>
              <span className="font-mono text-xs text-card-foreground">
                {formatAddress(loan.borrower)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Due Date</span>
              <span className="font-semibold text-card-foreground">
                {new Date(Number(loan.dueDate) * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-red-600 mt-0.5" />
              <div className="space-y-1 text-sm text-red-800">
                <p className="font-semibold">Consequences of marking as defaulted:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Borrower reputation will be reduced</li>
                  <li>Lenders will lose their capital</li>
                  <li>This action cannot be undone</li>
                  <li>Loan status will be permanently set to defaulted</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
            <input
              type="checkbox"
              id="default-confirm"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-400"
            />
            <label htmlFor="default-confirm" className="text-sm text-popover-foreground cursor-pointer">
              I confirm that this loan is in default and should be marked as such. I understand this action will
              affect the borrower's reputation and lender's capital.
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={isSubmitting || !confirmed}
            >
              {isSubmitting ? 'Processing...' : 'Mark as Defaulted'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

