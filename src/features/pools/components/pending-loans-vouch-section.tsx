'use client';

import { useState } from 'react';
import { useTypink } from 'typink';
import { usePendingLoans, useLoan } from '@/features/pools/hooks/use-loan-queries';
import { useVouchesForLoan } from '@/features/pools/hooks/use-vouch-queries';
import { useVouchForLoan } from '@/features/pools/hooks/use-loan-transactions';
import { useStars } from '@/features/profile/hooks/use-reputation-queries';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Component to display pending loans and allow vouching for them
 */
export function PendingLoansVouchSection() {
  const { connectedAccount } = useTypink();
  const { data: pendingLoans, isLoading } = usePendingLoans();
  const { data: userStars } = useStars(connectedAccount?.address);
  const { vouchForLoan } = useVouchForLoan();
  const [vouchingLoanId, setVouchingLoanId] = useState<string | null>(null);
  const [vouchStars, setVouchStars] = useState<{ [loanId: string]: string }>({});
  const [vouchCapitalPercent, setVouchCapitalPercent] = useState<{ [loanId: string]: string }>({});
  const [isVouching, setIsVouching] = useState<{ [loanId: string]: boolean }>({});

  const formatTokenAmount = (amount: bigint, decimals: number): number => {
    return Number(amount) / 10 ** decimals;
  };

  const handleVouch = async (loanId: bigint, e: React.FormEvent) => {
    e.preventDefault();
    const loanIdStr = loanId.toString();
    const stars = vouchStars[loanIdStr];
    const capitalPercent = vouchCapitalPercent[loanIdStr];

    if (!stars || !capitalPercent) {
      toast.error('Please fill all fields');
      return;
    }

    const starsNum = parseInt(stars);
    const capitalPercentNum = parseInt(capitalPercent);

    if (isNaN(starsNum) || isNaN(capitalPercentNum)) {
      toast.error('Invalid stars or capital percent');
      return;
    }

    setIsVouching((prev) => ({ ...prev, [loanIdStr]: true }));
    try {
      await vouchForLoan(loanId, starsNum, capitalPercentNum);
      setVouchStars((prev) => {
        const newState = { ...prev };
        delete newState[loanIdStr];
        return newState;
      });
      setVouchCapitalPercent((prev) => {
        const newState = { ...prev };
        delete newState[loanIdStr];
        return newState;
      });
      setVouchingLoanId(null);
      toast.success('Vouch submitted successfully');
    } catch (error) {
      console.error('Error vouching:', error);
    } finally {
      setIsVouching((prev) => {
        const newState = { ...prev };
        delete newState[loanIdStr];
        return newState;
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!pendingLoans || pendingLoans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vouch for Loans</CardTitle>
          <CardDescription>Vouch for pending loans by staking stars and capital</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 text-center py-8">No pending loans available for vouching.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vouch for Loans</CardTitle>
          <CardDescription>
            Vouch for pending loans by staking stars and capital.
            {connectedAccount && (
              <span> Your stars: <strong>{userStars ?? 0}</strong></span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Pending loans: <strong>{pendingLoans.length}</strong>
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {pendingLoans.map((loanId) => {
          const loanIdBigInt = typeof loanId === 'bigint' ? loanId : BigInt(loanId);
          const loanIdStr = loanIdBigInt.toString();
          const isExpanded = vouchingLoanId === loanIdStr;
          const isVouchingThis = isVouching[loanIdStr] ?? false;

          return (
            <PendingLoanCard
              key={loanIdStr}
              loanId={loanIdBigInt}
              isExpanded={isExpanded}
              onToggle={() => setVouchingLoanId(isExpanded ? null : loanIdStr)}
              vouchStars={vouchStars[loanIdStr] || ''}
              vouchCapitalPercent={vouchCapitalPercent[loanIdStr] || ''}
              onStarsChange={(value) => setVouchStars((prev) => ({ ...prev, [loanIdStr]: value }))}
              onCapitalPercentChange={(value) => setVouchCapitalPercent((prev) => ({ ...prev, [loanIdStr]: value }))}
              onVouch={(e) => handleVouch(loanIdBigInt, e)}
              isVouching={isVouchingThis}
              disabled={!connectedAccount}
              formatTokenAmount={formatTokenAmount}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Card component for a single pending loan with vouch form
 */
function PendingLoanCard({
  loanId,
  isExpanded,
  onToggle,
  vouchStars,
  vouchCapitalPercent,
  onStarsChange,
  onCapitalPercentChange,
  onVouch,
  isVouching,
  disabled,
  formatTokenAmount,
}: {
  loanId: bigint;
  isExpanded: boolean;
  onToggle: () => void;
  vouchStars: string;
  vouchCapitalPercent: string;
  onStarsChange: (value: string) => void;
  onCapitalPercentChange: (value: string) => void;
  onVouch: (e: React.FormEvent) => void;
  isVouching: boolean;
  disabled: boolean;
  formatTokenAmount: (amount: bigint, decimals: number) => number;
}) {
  const { data: loan, isLoading } = useLoan(loanId);
  const { data: vouchCount } = useVouchesForLoan(loanId);
  const LOAN_DECIMALS = 10;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!loan) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-slate-600">Loan {loanId.toString()} not found</p>
        </CardContent>
      </Card>
    );
  }

  const formatAddress = (address: string | { raw?: string } | any): string => {
    if (typeof address === 'object' && address !== null) {
      if ('raw' in address) {
        return String(address.raw);
      }
      if (typeof address.toString === 'function') {
        return address.toString();
      }
      return String(address);
    }
    return String(address);
  };

  const termInDays = loan.term > 0n 
    ? Math.floor(Number(loan.term) / (60 * 60 * 24)) 
    : 0;

  const interestRatePercent = loan.interestRate > 0n 
    ? (Number(loan.interestRate) / 100000000).toFixed(2)
    : '0.00';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg">Loan #{loanId.toString()}</CardTitle>
              <span className="px-2 py-1 text-xs font-semibold text-white rounded bg-orange-500">
                {loan.status}
              </span>
            </div>
            <CardDescription>
              <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                <div>
                  <strong className="text-slate-600 font-medium">Borrower:</strong>
                  <div className="mt-1 font-mono text-xs text-slate-800">
                    {formatAddress(loan.borrower).slice(0, 10)}...{formatAddress(loan.borrower).slice(-8)}
                  </div>
                </div>
                <div>
                  <strong className="text-slate-600 font-medium">Amount:</strong>
                  <div className="mt-1 text-slate-800 font-medium">
                    {formatTokenAmount(loan.amount, LOAN_DECIMALS).toFixed(4)} tokens
                  </div>
                </div>
                <div>
                  <strong className="text-slate-600 font-medium">Interest Rate:</strong>
                  <div className="mt-1 text-slate-800">
                    {interestRatePercent}%
                  </div>
                </div>
                <div>
                  <strong className="text-slate-600 font-medium">Term:</strong>
                  <div className="mt-1 text-slate-800">
                    {termInDays} days
                  </div>
                </div>
                <div>
                  <strong className="text-slate-600 font-medium">Vouches:</strong>
                  <div className="mt-1 text-slate-800">
                    {vouchCount ?? 0}
                  </div>
                </div>
              </div>
            </CardDescription>
          </div>
          <Button
            onClick={onToggle}
            disabled={disabled || isVouching}
            variant={isExpanded ? 'outline' : 'default'}
            size="sm"
          >
            {isExpanded ? 'Cancel' : 'Vouch'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <form onSubmit={onVouch} className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor={`stars-${loanId}`}>Stars to Stake</Label>
              <Input
                id={`stars-${loanId}`}
                type="number"
                value={vouchStars}
                onChange={(e) => onStarsChange(e.target.value)}
                placeholder="10"
                min="0"
                disabled={isVouching || disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`capital-${loanId}`}>Capital Percent (0-100)</Label>
              <Input
                id={`capital-${loanId}`}
                type="number"
                value={vouchCapitalPercent}
                onChange={(e) => onCapitalPercentChange(e.target.value)}
                placeholder="10"
                min="0"
                max="100"
                disabled={isVouching || disabled}
              />
            </div>
            <Button
              type="submit"
              disabled={isVouching || disabled || !vouchStars || !vouchCapitalPercent}
              className="w-full"
            >
              {isVouching ? 'Vouching...' : 'Submit Vouch'}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
