'use client';

import { useState } from 'react';
import { useTypink, useContract, useBalances, txToaster, checkBalanceSufficiency } from 'typink';
import { useQueryClient } from '@tanstack/react-query';
import { ContractId } from '@/contracts/deployments';
import { BootstrapStarsForm } from '@/features/flow-testing/components/BootstrapStarsForm';
import { LoansList } from '@/features/flow-testing/components/LoansList';
import { useRequestLoan, useVouchForLoan, useRepayLoan } from '@/features/pools/hooks/use-loan-transactions';
import { useLoan, useRepaymentAmount, usePendingLoans, useActiveLoans } from '@/features/pools/hooks/use-loan-queries';
import { useStars } from '@/features/profile/hooks/use-reputation-queries';
import { useUserDeposits } from '@/features/pools/hooks/use-lending-pool-data';
import { toast } from 'sonner';

/**
 * Flow Testing Page
 * TEMPORARY - This page will be deleted after testing
 * 
 * This page provides all testing steps in a vertical flow layout.
 * All steps are available simultaneously - no need to complete one before accessing the next.
 */
export default function FlowTestingPage() {
  const { connectedAccount, network, client } = useTypink();
  const { contract: lendingPoolContract } = useContract(ContractId.LENDING_POOL);
  const queryClient = useQueryClient();
  const { requestLoan } = useRequestLoan();
  const { vouchForLoan } = useVouchForLoan();
  const { repayLoan } = useRepayLoan();

  const decimals = network?.decimals ?? 12;

  // Step 2: Deposit state
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const addresses = connectedAccount ? [connectedAccount.address] : [];
  const balances = useBalances(addresses);
  const { data: userDeposit } = useUserDeposits(connectedAccount?.address);

  // Step 3: Request Loan state
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTerm, setLoanTerm] = useState('30'); // days
  const [isRequestingLoan, setIsRequestingLoan] = useState(false);
  const { data: pendingLoans } = usePendingLoans();
  const { data: activeLoans } = useActiveLoans();

  // Step 4: Vouch state
  const [vouchLoanId, setVouchLoanId] = useState('');
  const [vouchStars, setVouchStars] = useState('');
  const [vouchCapitalPercent, setVouchCapitalPercent] = useState('');
  const [isVouching, setIsVouching] = useState(false);
  const { data: selectedLoan } = useLoan(vouchLoanId ? BigInt(vouchLoanId) : undefined);
  const { data: userStars } = useStars(connectedAccount?.address);

  // Step 5: Repay state
  const [repayLoanId, setRepayLoanId] = useState('');
  const [isRepaying, setIsRepaying] = useState(false);
  const { data: repayLoanData } = useLoan(repayLoanId ? BigInt(repayLoanId) : undefined);
  const { data: repaymentAmount } = useRepaymentAmount(repayLoanId ? BigInt(repayLoanId) : undefined);

  // Helper functions
  const parseTokenAmount = (amount: string, decimals: number): bigint => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return 0n;
    return BigInt(Math.floor(num * 10 ** decimals));
  };

  const formatTokenAmount = (amount: bigint, decimals: number): number => {
    return Number(amount) / 10 ** decimals;
  };

  const userBalance = connectedAccount && balances[connectedAccount.address]
    ? formatTokenAmount(balances[connectedAccount.address].free, decimals)
    : 0;

  // Step 2: Handle Deposit
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lendingPoolContract || !connectedAccount || !client) {
      toast.error('Wallet not connected');
      return;
    }

    const depositAmountBigInt = parseTokenAmount(depositAmount, decimals);
    if (depositAmountBigInt === 0n) {
      toast.error('Invalid amount');
      return;
    }

    setIsDepositing(true);
    const toaster = txToaster();

    try {
      await checkBalanceSufficiency(client, connectedAccount.address);

      await lendingPoolContract.tx
        .deposit(connectedAccount.address, { value: depositAmountBigInt })
        .signAndSend(connectedAccount.address, (progress) => {
          toaster.onTxProgress(progress);
          if (progress.status.type === 'BestChainBlockIncluded' || progress.status.type === 'Finalized') {
            setDepositAmount('');
            queryClient.invalidateQueries({ queryKey: ['lendingPool'] });
            toast.success('Deposit successful');
          }
        })
        .untilFinalized();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toaster.onTxError(err);
    } finally {
      setIsDepositing(false);
    }
  };

  // Step 3: Handle Request Loan
  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedAccount) {
      toast.error('Wallet not connected');
      return;
    }

    const amountBigInt = parseTokenAmount(loanAmount, 18); // Loans use 18 decimals
    const termDays = parseInt(loanTerm);
    const termMs = BigInt(termDays * 24 * 60 * 60 * 1000);

    if (amountBigInt === 0n || isNaN(termDays)) {
      toast.error('Invalid amount or term');
      return;
    }

    setIsRequestingLoan(true);
    try {
      await requestLoan(amountBigInt, termMs);
      setLoanAmount('');
      toast.success('Loan requested successfully');
    } catch (error) {
      console.error('Error requesting loan:', error);
    } finally {
      setIsRequestingLoan(false);
    }
  };

  // Step 4: Handle Vouch
  const handleVouch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vouchLoanId || !vouchStars || !vouchCapitalPercent) {
      toast.error('Please fill all fields');
      return;
    }

    const loanId = BigInt(vouchLoanId);
    const stars = parseInt(vouchStars);
    const capitalPercent = parseInt(vouchCapitalPercent);

    if (isNaN(stars) || isNaN(capitalPercent)) {
      toast.error('Invalid stars or capital percent');
      return;
    }

    setIsVouching(true);
    try {
      await vouchForLoan(loanId, stars, capitalPercent);
      setVouchLoanId('');
      setVouchStars('');
      setVouchCapitalPercent('');
      toast.success('Vouch submitted successfully');
    } catch (error) {
      console.error('Error vouching:', error);
    } finally {
      setIsVouching(false);
    }
  };

  // Step 5: Handle Repay
  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoanId || !repaymentAmount) {
      toast.error('Loan ID or repayment amount not available');
      return;
    }

    setIsRepaying(true);
    try {
      await repayLoan(BigInt(repayLoanId), repaymentAmount);
      setRepayLoanId('');
      toast.success('Loan repaid successfully');
    } catch (error) {
      console.error('Error repaying loan:', error);
    } finally {
      setIsRepaying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Flow Testing
        </h1>
        <p className="text-slate-600 text-sm mb-2">
          Complete testing flow for Kleo Protocol. All steps available simultaneously.
        </p>
        {connectedAccount && (
          <p className="text-xs text-slate-500">
            Connected: {connectedAccount.address.slice(0, 10)}...
          </p>
        )}
      </header>

      <main className="space-y-8">
        {/* Step 1: Bootstrap Stars */}
        <div className="mb-8 p-6 border border-slate-200 rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">Step 1: Bootstrap Stars (Admin)</h2>
          <BootstrapStarsForm />
        </div>

        {/* Step 2: Add Liquidity */}
        <div className="mb-8 p-6 border border-slate-200 rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">Step 2: Add Liquidity</h2>
          <p className="text-sm text-slate-600 mb-4">
            Deposit tokens to the lending pool. Your balance: {userBalance.toFixed(4)} tokens
            {userDeposit !== undefined && ` | Deposited: ${formatTokenAmount(userDeposit, 10).toFixed(4)} tokens`}
          </p>
          <form onSubmit={handleDeposit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="deposit-amount" className="block mb-2 text-sm font-medium text-slate-700">
                Deposit Amount (tokens)
              </label>
              <input
                id="deposit-amount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="100"
                step="0.0001"
                disabled={isDepositing || !connectedAccount}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={isDepositing || !connectedAccount || !depositAmount}
              className="px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isDepositing ? 'Depositing...' : 'Deposit'}
            </button>
          </form>
        </div>

        {/* Step 3: Request Loan */}
        <div className="mb-8 p-6 border border-slate-200 rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">Step 3: Request Loan</h2>
          <p className="text-sm text-slate-600 mb-4">
            Request a new loan. Pending: {pendingLoans?.length ?? 0} | Active: {activeLoans?.length ?? 0}
          </p>
          <form onSubmit={handleRequestLoan} className="flex flex-col gap-4">
            <div>
              <label htmlFor="loan-amount" className="block mb-2 text-sm font-medium text-slate-700">
                Loan Amount (tokens)
              </label>
              <input
                id="loan-amount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="500"
                step="0.0001"
                disabled={isRequestingLoan || !connectedAccount}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="loan-term" className="block mb-2 text-sm font-medium text-slate-700">
                Loan Term (days)
              </label>
              <input
                id="loan-term"
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                placeholder="30"
                min="1"
                disabled={isRequestingLoan || !connectedAccount}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={isRequestingLoan || !connectedAccount || !loanAmount || !loanTerm}
              className="px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isRequestingLoan ? 'Requesting...' : 'Request Loan'}
            </button>
          </form>
          <LoansList />
        </div>

        {/* Step 4: Vouch for Loan */}
        <div className="mb-8 p-6 border border-slate-200 rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">Step 4: Vouch for Loan</h2>
          <p className="text-sm text-slate-600 mb-4">
            Vouch for a pending loan by staking stars and capital.
            {connectedAccount && (
              <span> Your stars: <strong className="text-slate-900">{userStars ?? 0}</strong></span>
            )}
          </p>
          <form onSubmit={handleVouch} className="flex flex-col gap-4">
            <div>
              <label htmlFor="vouch-loan-id" className="block mb-2 text-sm font-medium text-slate-700">
                Loan ID
              </label>
              <input
                id="vouch-loan-id"
                type="text"
                value={vouchLoanId}
                onChange={(e) => setVouchLoanId(e.target.value)}
                placeholder="1"
                disabled={isVouching || !connectedAccount}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              {selectedLoan && (
                <p className="mt-1 text-xs text-slate-600">
                  Status: {selectedLoan.status} | Amount: {formatTokenAmount(selectedLoan.amount, 18).toFixed(4)} tokens
                </p>
              )}
            </div>
            <div>
              <label htmlFor="vouch-stars" className="block mb-2 text-sm font-medium text-slate-700">
                Stars to Stake
              </label>
              <input
                id="vouch-stars"
                type="number"
                value={vouchStars}
                onChange={(e) => setVouchStars(e.target.value)}
                placeholder="10"
                min="0"
                disabled={isVouching || !connectedAccount}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="vouch-capital" className="block mb-2 text-sm font-medium text-slate-700">
                Capital Percent (0-100)
              </label>
              <input
                id="vouch-capital"
                type="number"
                value={vouchCapitalPercent}
                onChange={(e) => setVouchCapitalPercent(e.target.value)}
                placeholder="10"
                min="0"
                max="100"
                disabled={isVouching || !connectedAccount}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={isVouching || !connectedAccount || !vouchLoanId || !vouchStars || !vouchCapitalPercent}
              className="px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isVouching ? 'Vouching...' : 'Vouch for Loan'}
            </button>
          </form>
        </div>

        {/* Step 5: Repay Loan */}
        <div className="mb-8 p-6 border border-slate-200 rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">Step 5: Repay Loan</h2>
          <p className="text-sm text-slate-600 mb-4">
            Repay an active loan. Active loans: {activeLoans?.length ?? 0}
          </p>
          <form onSubmit={handleRepay} className="flex flex-col gap-4">
            <div>
              <label htmlFor="repay-loan-id" className="block mb-2 text-sm font-medium text-slate-700">
                Loan ID
              </label>
              <input
                id="repay-loan-id"
                type="text"
                value={repayLoanId}
                onChange={(e) => setRepayLoanId(e.target.value)}
                placeholder="1"
                disabled={isRepaying || !connectedAccount}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              {repayLoanData && (
                <div className="mt-2 p-3 bg-slate-50 rounded-md text-xs">
                  <p className="mb-1"><strong className="text-slate-700">Status:</strong> <span className="text-slate-800">{repayLoanData.status}</span></p>
                  <p className="mb-1"><strong className="text-slate-700">Amount:</strong> <span className="text-slate-800">{formatTokenAmount(repayLoanData.amount, 18).toFixed(4)} tokens</span></p>
                  {repaymentAmount && (
                    <p><strong className="text-slate-700">Repayment:</strong> <span className="text-slate-800">{formatTokenAmount(repaymentAmount, 18).toFixed(4)} tokens</span></p>
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isRepaying || !connectedAccount || !repayLoanId || !repaymentAmount}
              className="px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isRepaying ? 'Repaying...' : 'Repay Loan'}
            </button>
          </form>
          {activeLoans && activeLoans.length > 0 && (
            <div className="mt-4 p-3 bg-slate-50 rounded-md text-sm">
              <strong className="text-slate-700">Active Loans:</strong> <span className="text-slate-800">{activeLoans.map(id => id.toString()).join(', ')}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
