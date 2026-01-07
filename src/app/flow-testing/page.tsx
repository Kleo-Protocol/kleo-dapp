'use client';

import { useState } from 'react';
import { useTypink, useContract, useBalances, txToaster, checkBalanceSufficiency } from 'typink';
import { useQueryClient } from '@tanstack/react-query';
import { ContractId } from '@/contracts/deployments';
import { BootstrapStarsForm } from '@/features/flow-testing/components/BootstrapStarsForm';
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
  const { connectedAccount, network } = useTypink();
  const { contract: lendingPoolContract } = useContract(ContractId.LENDING_POOL);
  const { contract: loanManagerContract } = useContract(ContractId.LOAN_MANAGER);
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
    if (!lendingPoolContract || !connectedAccount) {
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
      await checkBalanceSufficiency(
        lendingPoolContract.api as any,
        connectedAccount.address
      );

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

  const stepStyle = {
    marginBottom: '2rem',
    padding: '1.5rem',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#fff',
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.9rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box' as const,
  };

  const buttonStyle = (disabled: boolean) => ({
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: disabled ? '#ccc' : '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
          Flow Testing
        </h1>
        <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
          Complete testing flow for Kleo Protocol. All steps available simultaneously.
        </p>
        {connectedAccount && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
            Connected: {connectedAccount.address.slice(0, 10)}...
          </p>
        )}
      </header>

      <main>
        {/* Step 1: Bootstrap Stars */}
        <div style={stepStyle}>
          <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>Step 1: Bootstrap Stars (Admin)</h2>
          <BootstrapStarsForm />
        </div>

        {/* Step 2: Add Liquidity */}
        <div style={stepStyle}>
          <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>Step 2: Add Liquidity</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            Deposit tokens to the lending pool. Your balance: {userBalance.toFixed(4)} tokens
            {userDeposit !== undefined && ` | Deposited: ${formatTokenAmount(userDeposit, 10).toFixed(4)} tokens`}
          </p>
          <form onSubmit={handleDeposit} style={formStyle}>
            <div>
              <label htmlFor="deposit-amount" style={{ display: 'block', marginBottom: '0.5rem' }}>
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
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={isDepositing || !connectedAccount || !depositAmount}
              style={buttonStyle(isDepositing || !connectedAccount || !depositAmount)}
            >
              {isDepositing ? 'Depositing...' : 'Deposit'}
            </button>
          </form>
        </div>

        {/* Step 3: Request Loan */}
        <div style={stepStyle}>
          <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>Step 3: Request Loan</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            Request a new loan. Pending: {pendingLoans?.length ?? 0} | Active: {activeLoans?.length ?? 0}
          </p>
          <form onSubmit={handleRequestLoan} style={formStyle}>
            <div>
              <label htmlFor="loan-amount" style={{ display: 'block', marginBottom: '0.5rem' }}>
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
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="loan-term" style={{ display: 'block', marginBottom: '0.5rem' }}>
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
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={isRequestingLoan || !connectedAccount || !loanAmount || !loanTerm}
              style={buttonStyle(isRequestingLoan || !connectedAccount || !loanAmount || !loanTerm)}
            >
              {isRequestingLoan ? 'Requesting...' : 'Request Loan'}
            </button>
          </form>
          {pendingLoans && pendingLoans.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <strong>Pending Loans:</strong> {pendingLoans.map(id => id.toString()).join(', ')}
            </div>
          )}
        </div>

        {/* Step 4: Vouch for Loan */}
        <div style={stepStyle}>
          <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>Step 4: Vouch for Loan</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            Vouch for a pending loan by staking stars and capital.
            {connectedAccount && (
              <span> Your stars: <strong>{userStars ?? 0}</strong></span>
            )}
          </p>
          <form onSubmit={handleVouch} style={formStyle}>
            <div>
              <label htmlFor="vouch-loan-id" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Loan ID
              </label>
              <input
                id="vouch-loan-id"
                type="text"
                value={vouchLoanId}
                onChange={(e) => setVouchLoanId(e.target.value)}
                placeholder="1"
                disabled={isVouching || !connectedAccount}
                style={inputStyle}
              />
              {selectedLoan && (
                <p style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#666' }}>
                  Status: {selectedLoan.status} | Amount: {formatTokenAmount(selectedLoan.amount, 18).toFixed(4)} tokens
                </p>
              )}
            </div>
            <div>
              <label htmlFor="vouch-stars" style={{ display: 'block', marginBottom: '0.5rem' }}>
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
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="vouch-capital" style={{ display: 'block', marginBottom: '0.5rem' }}>
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
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={isVouching || !connectedAccount || !vouchLoanId || !vouchStars || !vouchCapitalPercent}
              style={buttonStyle(isVouching || !connectedAccount || !vouchLoanId || !vouchStars || !vouchCapitalPercent)}
            >
              {isVouching ? 'Vouching...' : 'Vouch for Loan'}
            </button>
          </form>
        </div>

        {/* Step 5: Repay Loan */}
        <div style={stepStyle}>
          <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>Step 5: Repay Loan</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            Repay an active loan. Active loans: {activeLoans?.length ?? 0}
          </p>
          <form onSubmit={handleRepay} style={formStyle}>
            <div>
              <label htmlFor="repay-loan-id" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Loan ID
              </label>
              <input
                id="repay-loan-id"
                type="text"
                value={repayLoanId}
                onChange={(e) => setRepayLoanId(e.target.value)}
                placeholder="1"
                disabled={isRepaying || !connectedAccount}
                style={inputStyle}
              />
              {repayLoanData && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '0.85rem' }}>
                  <p><strong>Status:</strong> {repayLoanData.status}</p>
                  <p><strong>Amount:</strong> {formatTokenAmount(repayLoanData.amount, 18).toFixed(4)} tokens</p>
                  {repaymentAmount && (
                    <p><strong>Repayment:</strong> {formatTokenAmount(repaymentAmount, 18).toFixed(4)} tokens</p>
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isRepaying || !connectedAccount || !repayLoanId || !repaymentAmount}
              style={buttonStyle(isRepaying || !connectedAccount || !repayLoanId || !repaymentAmount)}
            >
              {isRepaying ? 'Repaying...' : 'Repay Loan'}
            </button>
          </form>
          {activeLoans && activeLoans.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <strong>Active Loans:</strong> {activeLoans.map(id => id.toString()).join(', ')}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
