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
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useVouchForLoan } from '@/features/pools/hooks/use-loan-transactions';
import { useTypink } from 'typink';
import { useQueryClient } from '@tanstack/react-query';
import type { LoanDetails } from '@/lib/types';

interface VouchModalProps {
  loanId: string;
  loan: LoanDetails | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VouchModal({ loan, open, onOpenChange }: VouchModalProps) {
  const [stars, setStars] = useState('');
  const [capitalPercent, setCapitalPercent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { connectedAccount } = useTypink();
  const { vouchForLoan } = useVouchForLoan();
  const queryClient = useQueryClient();

  if (!loan) return null;

  const handleStarsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*$/.test(value)) {
      setStars(value);
      setError(null);
    }
  };

  const handleCapitalPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*$/.test(value)) {
      const num = parseInt(value);
      if (num >= 0 && num <= 100) {
        setCapitalPercent(value);
        setError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connectedAccount) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet to vouch for the loan',
      });
      return;
    }

    const starsNum = parseInt(stars);
    const capitalPercentNum = parseInt(capitalPercent);

    if (isNaN(starsNum) || starsNum <= 0) {
      setError('Stars must be a positive number');
      return;
    }

    if (isNaN(capitalPercentNum) || capitalPercentNum < 0 || capitalPercentNum > 100) {
      setError('Capital percent must be between 0 and 100');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await vouchForLoan(loan.loanId, starsNum, capitalPercentNum);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['vouch'] });
      queryClient.invalidateQueries({ queryKey: ['loan', loan.loanId] });
      queryClient.invalidateQueries({ queryKey: ['loans', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['loans', 'active'] });
      
      // Reset form
      setStars('');
      setCapitalPercent('');
      onOpenChange(false);
      
      toast.success('Vouch submitted successfully');
    } catch (error) {
      console.error('Error vouching for loan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit vouch';
      setError(errorMessage);
      toast.error('Failed to submit vouch', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setStars('');
      setCapitalPercent('');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Vouch for Loan #{loan.loanId}
          </DialogTitle>
          <DialogDescription>
            Stake your stars and capital to vouch for this loan. Your reputation and capital will be at risk if the loan defaults.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stars">Stars to Stake</Label>
            <Input
              id="stars"
              type="number"
              value={stars}
              onChange={handleStarsChange}
              placeholder="10"
              min="1"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the number of stars you want to stake for this loan
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capital-percent">Capital Percent (0-100)</Label>
            <Input
              id="capital-percent"
              type="number"
              value={capitalPercent}
              onChange={handleCapitalPercentChange}
              placeholder="10"
              min="0"
              max="100"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the percentage of capital you want to commit (0-100)
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !stars || !capitalPercent}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Vouch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
