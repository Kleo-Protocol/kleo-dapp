'use client';

import { useState } from 'react';
import { useTypink } from 'typink';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { DollarSign } from 'lucide-react';
import { useLoan, useRepaymentAmount } from '@/features/pools/hooks/use-loan-queries';
import { useRepayLoan } from '@/features/pools/hooks/use-loan-transactions';
import { toast } from 'sonner';

export function RepayLoanSection() {
  const { connectedAccount, network } = useTypink();
  const { repayLoan } = useRepayLoan();
  const [repayLoanId, setRepayLoanId] = useState('');
  const [isRepaying, setIsRepaying] = useState(false);
  const { data: repayLoanData } = useLoan(repayLoanId ? BigInt(repayLoanId) : undefined);
  const { data: repaymentAmount } = useRepaymentAmount(repayLoanId ? BigInt(repayLoanId) : undefined);
  
  const decimals = network?.decimals ?? 12;

  const formatTokenAmount = (amount: bigint, decimals: number): number => {
    return Number(amount) / 10 ** decimals;
  };

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoanId || !repaymentAmount) {
      toast.error('Loan ID or repayment amount not available');
      return;
    }

    if (!connectedAccount) {
      toast.error('Wallet not connected');
      return;
    }

    setIsRepaying(true);
    try {
      // Convert repayment amount from 18 decimals (loan contract) to network decimals
      // Loans use 18 decimals, but transaction value must be in network decimals
      const loanDecimals = 18;
      const conversionFactor = 10n ** BigInt(loanDecimals - decimals);
      const repaymentAmountInNetworkDecimals = repaymentAmount / conversionFactor;
      await repayLoan(BigInt(repayLoanId), repaymentAmountInNetworkDecimals);
      setRepayLoanId('');
      toast.success('Loan repaid successfully');
    } catch (error) {
      console.error('Error repaying loan:', error);
      toast.error('Failed to repay loan');
    } finally {
      setIsRepaying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="size-5" />
          Repay Loan
        </CardTitle>
        <CardDescription>
          Repay an active loan by entering the loan ID
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRepay} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="repay-loan-id" className='mb-4'>Loan ID</Label>
            <Input
              id="repay-loan-id"
              type="text"
              value={repayLoanId}
              onChange={(e) => setRepayLoanId(e.target.value)}
              placeholder="1"
              disabled={isRepaying || !connectedAccount}
            />
            {repayLoanData && (
              <div className="mt-2 p-3 bg-slate-50 rounded-md text-xs">
                <p className="mb-1">
                  <strong className="text-slate-700">Status:</strong>{' '}
                  <span className="text-slate-800">{repayLoanData.status}</span>
                </p>
                <p className="mb-1">
                  <strong className="text-slate-700">Amount:</strong>{' '}
                  <span className="text-slate-800">
                    {formatTokenAmount(repayLoanData.amount, 10).toFixed(4)} tokens
                  </span>
                </p>
                {repaymentAmount && (
                  <p>
                    <strong className="text-slate-700">Repayment:</strong>{' '}
                    <span className="text-slate-800">
                      {formatTokenAmount(repaymentAmount, 18).toFixed(4)} tokens
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={isRepaying || !connectedAccount || !repayLoanId || !repaymentAmount}
          >
            {isRepaying ? 'Repaying...' : 'Repay Loan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
