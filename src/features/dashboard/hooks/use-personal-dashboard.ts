'use client';

import { useQuery, useQueries } from '@tanstack/react-query';
import { useTypink, useContract } from 'typink';
import { ContractId } from '@/contracts/deployments';
import { useKleoClient } from '@/providers/kleo-client-provider';
import { useStars, useCanVouch } from '@/features/profile/hooks/use-reputation-queries';
import { useCurrentRate } from '@/features/pools/hooks/use-lending-pool-data';
import { useAvailablePools } from '@/features/pools/hooks/use-pools';
import type { LoanStatus } from '@/lib/types';

/**
 * User reputation data
 */
export interface UserReputation {
  stars: number;
  starsAtStake: number;
  canVouch: boolean;
  banned: boolean;
  creationTime: bigint | null;
  loanHistoryCount: number;
  vouchHistoryCount: number;
}

/**
 * User deposit position
 */
export interface UserDepositPosition {
  poolId: string;
  poolName: string;
  amount: bigint;
  currentAPY: number;
  interestEarned: bigint;
  availableToWithdraw: bigint;
}

/**
 * User loan position
 */
export interface UserLoanPosition {
  loanId: bigint;
  amount: bigint;
  totalRepayment: bigint;
  amountToRepay: bigint;
  status: LoanStatus;
  startTime: bigint;
  dueTime: bigint;
  daysRemaining: number;
  isOverdue: boolean;
  interestRate: bigint;
  term: bigint;
  borrower: string;
  vouchers: string[];
  purpose?: Uint8Array;
}

/**
 * Vouch relationship (who vouches for me)
 */
export interface VouchForMe {
  voucherAddress: string;
  stakedStars: number;
  stakedCapital: bigint;
  status: string;
  loanId: bigint | null;
  since: bigint | null;
}

/**
 * My vouch (who I vouch for)
 */
export interface MyVouch {
  borrowerAddress: string;
  stakedStars: number;
  stakedCapital: bigint;
  status: string;
  loanId: bigint | null;
  since: bigint | null;
}

/**
 * Main hook for personal dashboard data
 */
export function usePersonalDashboard() {
  const { connectedAccount, network } = useTypink();
  const { client: kleoClient } = useKleoClient();
  const { contract: vouchContract } = useContract(ContractId.VOUCH);
  
  const userAddress = connectedAccount?.address;
  const decimals = network?.decimals ?? 12;

  // Basic reputation queries
  const { data: stars = 0 } = useStars(userAddress);
  const { data: canVouch = false } = useCanVouch(userAddress);
  
  // Get all pools to map deposits
  const { data: pools = [] } = useAvailablePools();
  
  // Get current rate for APY calculation
  const { data: currentRate } = useCurrentRate();
  
  // Get user deposits across all pools
  const userDepositsQueries = useQueries({
    queries: pools.map((pool) => ({
      queryKey: ['personalDashboard', 'userDeposits', pool.poolId, userAddress],
      queryFn: async (): Promise<UserDepositPosition | null> => {
        if (!userAddress || !kleoClient) return null;
        
        try {
          const deposit = await kleoClient.getUserDeposit(pool.poolId, userAddress);
          if (!deposit || deposit === '0' || BigInt(deposit) === 0n) return null;
          
          const depositAmount = BigInt(deposit);
          
          // Calculate APY from current rate (convert to percentage)
          const apy = currentRate ? currentRate * 100 : 0;
          
          // For now, interest earned is estimated (would need historical tracking)
          const interestEarned = 0n;
          
          return {
            poolId: pool.poolId,
            poolName: pool.name,
            amount: depositAmount,
            currentAPY: apy,
            interestEarned,
            availableToWithdraw: depositAmount, // Same as deposit for now
          };
        } catch (error) {
          console.error(`Error fetching deposit for pool ${pool.poolId}:`, error);
          return null;
        }
      },
      enabled: !!userAddress && !!kleoClient && !!pool.poolId,
      staleTime: 30000,
    })),
  });

  // Get user loans
  const userLoansQueries = useQueries({
    queries: pools.map((pool) => ({
      queryKey: ['personalDashboard', 'userLoans', pool.poolId, userAddress],
      queryFn: async (): Promise<UserLoanPosition[]> => {
        if (!userAddress || !kleoClient) return [];
        
        try {
          const loans = await kleoClient.getUserLoans(pool.poolId, userAddress);
          
          return loans.map((loan: any): UserLoanPosition => {
            const now = BigInt(Math.floor(Date.now() / 1000));
            const startTime = BigInt(loan.startTime || 0);
            const term = BigInt(loan.term || 0);
            const dueTime = startTime + term;
            const daysRemaining = Number((dueTime - now) / 86400n);
            const isOverdue = loan.status === 'Active' && now > dueTime;
            
            // Calculate total repayment (amount + interest)
            // Interest = amount * interestRate * term / (365 * 86400 * 10000)
            const amount = BigInt(loan.amount || 0);
            const interestRate = BigInt(loan.interestRate || 0);
            const divisor = 365n * 86400n * 10000n;
            const interestAmount = (amount * interestRate * term) / divisor;
            const totalRepayment = amount + interestAmount;
            
            return {
              loanId: BigInt(loan.loanId || 0),
              amount,
              totalRepayment,
              amountToRepay: loan.status === 'Active' ? totalRepayment : 0n,
              status: loan.status,
              startTime,
              dueTime,
              daysRemaining: Math.max(0, daysRemaining),
              isOverdue,
              interestRate,
              term,
              borrower: typeof loan.borrower === 'string' ? loan.borrower : String(loan.borrower),
              vouchers: loan.vouchers?.map((v: any) => typeof v === 'string' ? v : String(v)) || [],
              purpose: loan.purpose,
            };
          });
        } catch (error) {
          console.error(`Error fetching loans for pool ${pool.poolId}:`, error);
          return [];
        }
      },
      enabled: !!userAddress && !!kleoClient && !!pool.poolId,
      staleTime: 30000,
    })),
  });

  // Get borrower vouches (who vouches for me)
  // Using the existing hook for borrower vouchers - note: this may not work across all pools
  // For now, we'll simplify and just get basic voucher info
  const borrowerVouchesQuery = useQuery({
    queryKey: ['personalDashboard', 'borrowerVouches', userAddress],
    queryFn: async (): Promise<VouchForMe[]> => {
      if (!userAddress || !vouchContract) return [];
      
      try {
        // Use getAllVouchers from the contract
        const result = await vouchContract.query.getAllVouchers(userAddress);
        const vouchers = (result as any).data;
        
        if (!Array.isArray(vouchers) || vouchers.length === 0) return [];
        
        // Fetch relationship details for each voucher
        const allVouches: VouchForMe[] = [];
        for (const voucherAddress of vouchers) {
          try {
            const voucherAddr = typeof voucherAddress === 'string' ? voucherAddress : voucherAddress.toString();
            
            if (!vouchContract.storage) continue;
            
            const root = await vouchContract.storage.root();
            const relationship = await root.relationships?.get([voucherAddr, userAddress]);
            
            if (relationship) {
              allVouches.push({
                voucherAddress: voucherAddr,
                stakedStars: Number(relationship.stakedStars ?? 0),
                stakedCapital: BigInt(relationship.stakedCapital?.toString() ?? '0'),
                status: relationship.status?.toString() ?? 'Unknown',
                loanId: relationship.loanId ?? null,
                since: null,
              });
            } else {
              // If no relationship found, still add the voucher with minimal info
              allVouches.push({
                voucherAddress: voucherAddr,
                stakedStars: 0,
                stakedCapital: 0n,
                status: 'Unknown',
                loanId: null,
                since: null,
              });
            }
          } catch (error) {
            console.error(`Error fetching vouch relationship:`, error);
          }
        }
        
        return allVouches;
      } catch (error) {
        console.error('Error fetching borrower vouches:', error);
        return [];
      }
    },
    enabled: !!userAddress && !!vouchContract,
    staleTime: 30000,
  });

  // Get my vouches (who I vouch for)
  // This requires querying all relationships where I'm the voucher
  // For now, we'll use a simplified approach
  const myVouchesQuery = useQuery({
    queryKey: ['personalDashboard', 'myVouches', userAddress],
    queryFn: async (): Promise<MyVouch[]> => {
      if (!userAddress || !vouchContract) return [];
      
      // This would require iterating through all possible borrowers
      // For now, return empty array - can be enhanced with indexing service
      return [];
    },
    enabled: false, // Disabled until we have a way to query this efficiently
    staleTime: 30000,
  });

  // Calculate aggregated stats
  const totalDeposits = userDepositsQueries
    .map((q) => q.data?.amount ?? 0n)
    .reduce((sum, amt) => sum + amt, 0n);
  
  const totalInterestEarned = userDepositsQueries
    .map((q) => q.data?.interestEarned ?? 0n)
    .reduce((sum, amt) => sum + amt, 0n);
  
  const activeLoans = userLoansQueries
    .flatMap((q) => q.data ?? [])
    .filter((loan) => loan.status === 'Active');
  
  const totalBorrowed = activeLoans
    .reduce((sum, loan) => sum + loan.amount, 0n);
  
  const totalToRepay = activeLoans
    .reduce((sum, loan) => sum + loan.amountToRepay, 0n);

  // Calculate stars at stake (sum of all vouches for me)
  const starsAtStake = borrowerVouchesQuery.data?.reduce(
    (sum, v) => sum + v.stakedStars,
    0
  ) ?? 0;

  // Loading states
  const isLoading =
    userDepositsQueries.some((q) => q.isLoading) ||
    userLoansQueries.some((q) => q.isLoading) ||
    borrowerVouchesQuery.isLoading;

  return {
    // User address
    userAddress,
    decimals,
    
    // Reputation
    reputation: {
      stars,
      starsAtStake,
      canVouch,
      banned: false, // Would need to query from contract
      creationTime: null, // Would need to query from contract
      loanHistoryCount: userLoansQueries.flatMap((q) => q.data ?? []).length,
      vouchHistoryCount: (borrowerVouchesQuery.data?.length ?? 0) + (myVouchesQuery.data?.length ?? 0),
    },
    
    // Deposits
    deposits: userDepositsQueries
      .map((q) => q.data)
      .filter((d): d is UserDepositPosition => d !== null),
    totalDeposits,
    totalInterestEarned,
    currentAPY: currentRate ? currentRate * 100 : 0,
    
    // Loans
    loans: userLoansQueries.flatMap((q) => q.data ?? []),
    activeLoans,
    totalBorrowed,
    totalToRepay,
    
    // Vouches
    vouchesForMe: borrowerVouchesQuery.data ?? [],
    myVouches: myVouchesQuery.data ?? [],
    
    // Loading
    isLoading,
  };
}
