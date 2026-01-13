'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { Calendar, DollarSign, ArrowUpRight, ArrowDownRight, Inbox } from 'lucide-react';
import { EmptyState } from '@/shared/components/empty-state';
import { formatDate } from '@/shared/utils/format';
import { usePoolLoans } from '@/features/pools/hooks/use-pool-loans';
import { useMemo } from 'react';

// Loans use 10 decimals for amounts (based on dry run: 500000000000 = 50 tokens)
const LOAN_DECIMALS = 10;

interface TransactionItem {
  id: string;
  type: 'loan' | 'deposit' | 'withdrawal' | 'repayment';
  amount: bigint;
  user: string;
  timestamp: bigint;
  status: string;
  loanId?: bigint;
}

export function PoolHistory() {
  const { loans, isLoading } = usePoolLoans();

  // Format address helper - same as loans-list-table
  const formatAddress = (address: string | { raw?: string } | any): string => {
    // Handle AccountId32 which might be an object with raw property
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

  // Format token amount helper - same as loans-list-table
  const formatTokenAmount = (amount: bigint, decimals: number): string => {
    if (amount === 0n) return '0.0000';
    return (Number(amount) / 10 ** decimals).toFixed(4);
  };

  // Transform loans into transaction history
  const transactions = useMemo<TransactionItem[]>(() => {
    const txns: TransactionItem[] = [];

    // Add loan transactions
    loans.forEach((loan) => {
      if (loan) {
        // Format borrower address properly
        const borrowerAddress = formatAddress(loan.borrower);
        
        // Loan creation
        txns.push({
          id: `loan-${loan.loanId}`,
          type: 'loan',
          amount: BigInt(loan.amount || 0),
          user: borrowerAddress,
          timestamp: BigInt(loan.startTime || 0),
          status: loan.status || 'Active',
          loanId: BigInt(loan.loanId || 0),
        });

        // Repayment if completed
        if (loan.status === 'Repaid') {
          const amount = BigInt(loan.amount || 0);
          const interestRate = BigInt(loan.interestRate || 0);
          const term = BigInt(loan.term || 0);
          const divisor = 365n * 86400n * 10000n;
          const interestAmount = (amount * interestRate * term) / divisor;
          const totalRepayment = amount + interestAmount;

          txns.push({
            id: `repayment-${loan.loanId}`,
            type: 'repayment',
            amount: totalRepayment,
            user: borrowerAddress,
            timestamp: BigInt(loan.startTime || 0) + BigInt(loan.term || 0),
            status: 'Completed',
            loanId: BigInt(loan.loanId || 0),
          });
        }
      }
    });

    // Sort by timestamp (newest first)
    return txns.sort((a, b) => {
      const timeA = Number(a.timestamp);
      const timeB = Number(b.timestamp);
      return timeB - timeA;
    });
  }, [loans]);

  const getTransactionIcon = (type: TransactionItem['type']) => {
    switch (type) {
      case 'loan':
        return <ArrowUpRight className="size-4 text-amber-honey" />;
      case 'repayment':
        return <ArrowDownRight className="size-4 text-forest-green" />;
      case 'deposit':
        return <ArrowDownRight className="size-4 text-forest-green" />;
      case 'withdrawal':
        return <ArrowUpRight className="size-4 text-atomic-tangerine" />;
      default:
        return <DollarSign className="size-4" />;
    }
  };

  const getTransactionLabel = (type: TransactionItem['type']) => {
    switch (type) {
      case 'loan':
        return 'Loan';
      case 'repayment':
        return 'Repayment';
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      default:
        return 'Transaction';
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Repaid' || status === 'Completed') {
      return <Badge variant="verde">Completed</Badge>;
    }
    if (status === 'Defaulted') {
      return <Badge variant="rojo">Defaulted</Badge>;
    }
    if (status === 'Active') {
      return <Badge variant="amarillo">Active</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Pool transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Inbox className="size-12" />}
            title="No History"
            description="No transactions have been recorded in this pool yet."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
        <CardDescription>Pool transaction history</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn) => (
              <TableRow key={txn.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(txn.type)}
                    <span className="font-medium">{getTransactionLabel(txn.type)}</span>
                    {txn.loanId && (
                      <span className="text-xs text-muted-foreground font-mono">
                        #{txn.loanId.toString().slice(0, 8)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-xs">
                    {txn.user.slice(0, 10)}...{txn.user.slice(-8)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatTokenAmount(txn.amount, LOAN_DECIMALS)} tokens
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-slate-400" />
                    {formatDate(txn.timestamp)}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(txn.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
