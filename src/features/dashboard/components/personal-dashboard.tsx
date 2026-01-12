'use client';

import { usePersonalDashboard } from '../hooks/use-personal-dashboard';
import { PersonalKPICards } from './personal-kpi-cards';
import { PersonalCharts } from './personal-charts';
import { ActivePositionsTable } from './active-positions-table';
import { VouchNetwork } from './vouch-network';
import { LoanHistoryTimeline } from './loan-history-timeline';
import { useMemo } from 'react';

export function PersonalDashboard() {
  const {
    userAddress,
    decimals,
    reputation,
    deposits,
    totalDeposits,
    totalInterestEarned,
    currentAPY,
    activeLoans,
    totalBorrowed,
    totalToRepay,
    vouchesForMe,
    myVouches,
    isLoading,
  } = usePersonalDashboard();

  // Generate mock historical data for charts (6 months)
  // In a real implementation, this would come from the SDK or a historical data service
  const reputationHistory = useMemo(() => {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentStars = reputation.stars;
    const startStars = Math.max(0, currentStars - 50);
    const increment = (currentStars - startStars) / 6;

    return months.map((month, index) => ({
      month,
      value: Math.round(startStars + increment * index),
      date: `${month} 2024`,
    }));
  }, [reputation.stars]);

  const interestEarningsHistory = useMemo(() => {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const totalInterest = Number(totalInterestEarned) / 10 ** decimals;
    const increment = totalInterest / 6;

    return months.map((month, index) => ({
      month,
      value: Number((increment * (index + 1)).toFixed(2)),
      date: `${month} 2024`,
    }));
  }, [totalInterestEarned, decimals]);

  if (!userAddress) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <p className='font-inter text-lg text-muted-foreground mb-2'>
            Please connect your wallet to view your personal dashboard
          </p>
        </div>
      </div>
    );
  }

  const handleWithdraw = (poolId: string) => {
    // TODO: Implement withdraw logic
    console.log('Withdraw from pool:', poolId);
  };

  const handleRepay = (loanId: bigint) => {
    // TODO: Implement repay logic
    console.log('Repay loan:', loanId);
  };

  const handleWithdrawVouch = (borrowerAddress: string) => {
    // TODO: Implement withdraw vouch logic
    console.log('Withdraw vouch for:', borrowerAddress);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='font-sora text-2xl font-bold mb-2'>Personal Dashboard</h1>
        <p className='font-inter text-sm text-muted-foreground'>
          Overview of your activity, reputation, and positions in Kleo Protocol
        </p>
      </div>

      {/* KPI Cards */}
      <PersonalKPICards
        reputation={reputation}
        totalDeposits={totalDeposits}
        totalInterestEarned={totalInterestEarned}
        currentAPY={currentAPY}
        totalBorrowed={totalBorrowed}
        totalToRepay={totalToRepay}
        activeLoansCount={activeLoans.length}
        vouchesForMeCount={vouchesForMe.length}
        myVouchesCount={myVouches.length}
        starsAtStake={reputation.starsAtStake}
        isLoading={isLoading}
        decimals={decimals}
      />

      {/* Charts */}
      <PersonalCharts
        reputationHistory={reputationHistory}
        interestEarningsHistory={interestEarningsHistory}
        isLoading={isLoading}
      />

      {/* Active Positions Table */}
      <ActivePositionsTable
        deposits={deposits}
        loans={activeLoans}
        isLoading={isLoading}
        onWithdraw={handleWithdraw}
        onRepay={handleRepay}
      />

      {/* Vouch Network */}
      <VouchNetwork
        vouchesForMe={vouchesForMe}
        myVouches={myVouches}
        isLoading={isLoading}
        onWithdrawVouch={handleWithdrawVouch}
      />

      {/* Loan History Timeline */}
      {/* Map activeLoans (UserLoanPosition[]) to Loan[] for LoanHistoryTimeline */}
      <LoanHistoryTimeline loans={activeLoans.map(loan => ({
        loanId: loan.loanId,
        borrower: loan.borrower,
        amount: loan.amount,
        interestRate: loan.interestRate,
        term: loan.term,
        purpose: loan.purpose || new Uint8Array(),
        startTime: loan.startTime,
        status: loan.status,
        vouchers: loan.vouchers,
        dueTime: loan.dueTime,
        totalRepayment: loan.totalRepayment,
        daysRemaining: loan.daysRemaining,
        isOverdue: loan.isOverdue,
        purposeText: undefined,
      }))} isLoading={isLoading} />
    </div>
  );
}
