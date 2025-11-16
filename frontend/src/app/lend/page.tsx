'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { txToaster, useContract, useContractQuery, useContractTx, useTypink } from 'typink';
import type { ISubmittableResult } from 'dedot/types';
import type { H160 } from 'dedot/codecs';
import { ContractId } from '@/contracts/deployments';
import { LoanRegistryContractApi } from '@/contracts/types/loan-registry';
import { LoanInstanceContractApi } from '@/contracts/types/loan-instance';
import type { LoanInstance, LoanInstanceLenderContribution } from '@/contracts/types/loan-instance';
import { AddressConverter } from '@/lib/address-converter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PendingText } from '@/components/shared/pending-text';
import { Separator } from '@/components/ui/separator';

function formatBigInt(value?: bigint | number, suffix = '') {
  if (value === undefined || value === null) return '—';
  try {
    const asBigInt = typeof value === 'bigint' ? value : BigInt(value);
    return `${asBigInt.toString()}${suffix}`;
  } catch {
    return `${value}${suffix}`;
  }
}

function toReadableAddress(address?: string) {
  if (!address) return '—';
  try {
    return AddressConverter.format(address).short;
  } catch {
    return address;
  }
}

const VARIABLE_INTEREST_APR = 12.5; // Placeholder until on-chain rates are wired in

export default function LendPage() {
  const router = useRouter();
  const { accounts, connectedAccount } = useTypink();
  const { contract: loanRegistry } = useContract<LoanRegistryContractApi>(ContractId.LOAN_REGISTRY);
  const { contract: loanInstance } = useContract<LoanInstanceContractApi>(ContractId.LOAN_INSTANCE);

  const [amount, setAmount] = useState('');
  const [localNotes, setLocalNotes] = useState<{ id: string; amount: string; timestamp: number; interestApr: number }[]>([]);
  const [loanSnapshot, setLoanSnapshot] = useState<LoanInstance | null>(null);

  useEffect(() => {
    if (accounts.length === 0) {
      router.replace('/');
    }
  }, [accounts.length, router]);

  const lenderH160 = useMemo(() => {
    if (!connectedAccount?.address) return undefined;
    try {
      return AddressConverter.ss58ToH160(connectedAccount.address) as H160;
    } catch (error) {
      console.warn('Unable to normalize lender address', error);
      return undefined;
    }
  }, [connectedAccount?.address]);

  const allLoansQuery = useContractQuery(
    loanRegistry
      ? {
          contract: loanRegistry,
          fn: 'getAllLoans',
          watch: true,
        }
      : undefined,
  );

  const contributionsQuery = useContractQuery(
    loanInstance
      ? {
          contract: loanInstance,
          fn: 'getContributions',
          watch: true,
        }
      : undefined,
  );

  const stateQuery = useContractQuery(
    loanInstance
      ? {
          contract: loanInstance,
          fn: 'getState',
          watch: true,
        }
      : undefined,
  );

  const remainingDebtQuery = useContractQuery(
    loanInstance
      ? {
          contract: loanInstance,
          fn: 'getRemainingDebt',
          watch: true,
        }
      : undefined,
  );

  const borrowerQuery = useContractQuery(
    loanInstance
      ? {
          contract: loanInstance,
          fn: 'getBorrower',
          watch: true,
        }
      : undefined,
  );

  useEffect(() => {
    let cancelled = false;
    async function loadSnapshot() {
      if (!loanInstance) return;
      try {
        const data = await loanInstance.storage.root();
        if (!cancelled) {
          setLoanSnapshot(data as LoanInstance);
        }
      } catch (error) {
        console.warn('Unable to load loan snapshot', error);
      }
    }
    loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [loanInstance, contributionsQuery?.data, stateQuery?.data, remainingDebtQuery?.data]);

  const contributions = (contributionsQuery?.data ?? []) as LoanInstanceLenderContribution[];
  const totalRaised = contributions.reduce<bigint>((sum, entry) => sum + (entry?.amount ?? 0n), 0n);
  const totalRequired = loanSnapshot?.totalRequired ?? 0n;
  const fundingProgress = totalRequired > 0n ? Number((totalRaised * 10000n) / totalRequired) / 100 : 0;

  const lenderContributions = useMemo(() => {
    if (!lenderH160) return [] as LoanInstanceLenderContribution[];
    return contributions.filter((entry) => entry.lender?.toLowerCase?.() === lenderH160?.toLowerCase?.());
  }, [contributions, lenderH160]);

  const contributeTx = useContractTx(loanInstance, 'contribute');

  const loanOpportunities = useMemo(() => {
    const loans = (allLoansQuery?.data ?? []) as string[];
    return loans.slice(0, 10).map((loan, index) => {
      let ss58 = loan;
      try {
        ss58 = AddressConverter.h160ToSS58(loan);
      } catch {
        // ignore
      }
      return {
        id: `${loan}-${index}`,
        h160: loan,
        ss58,
      };
    });
  }, [allLoansQuery?.data]);

  const handleContribute = async () => {
    if (!loanInstance) {
      toast.error('Loan instance contract not connected.');
      return;
    }
    if (!amount.trim()) {
      toast.error('Enter the amount you want to commit.');
      return;
    }
    let parsedAmount: bigint;
    try {
      parsedAmount = BigInt(amount.trim());
    } catch {
      toast.error('Contribution must be a positive integer (raw units).');
      return;
    }
    if (parsedAmount <= 0n) {
      toast.error('Contribution must be greater than zero.');
      return;
    }

    const toaster = txToaster('Funding borrower request...');
    try {
      await contributeTx.signAndSend({
        args: [],
        txOptions: { value: parsedAmount },
        callback: (result: ISubmittableResult) => toaster.onTxProgress(result),
      });
      toast.success('Contribution submitted');
      setLocalNotes((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          amount: amount.trim(),
          timestamp: Date.now(),
          interestApr: VARIABLE_INTEREST_APR,
        },
        ...prev,
      ].slice(0, 5));
      setAmount('');
    } catch (error: any) {
      console.error(error);
      toaster.onTxError(error);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className='py-16 text-center text-muted-foreground'>
        Preparing lending tools...
      </div>
    );
  }

  return (
    <div className='space-y-6 px-4 pb-16'>
      <div className='grid gap-6 lg:grid-cols-3'>
        <Card className='lg:col-span-2 bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold'>Fund a trusted request</CardTitle>
            <p className='text-sm text-muted-foreground'>Commit raw units directly into the shared loan instance.</p>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='contribution'>Contribution (raw units)</Label>
                <Input
                  id='contribution'
                  inputMode='numeric'
                  autoComplete='off'
                  placeholder='500000000000'
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className='font-mono'
                />
              </div>
              <div className='rounded-xl border border-gray-200/60 bg-white/60 p-4 dark:border-gray-800 dark:bg-gray-950/60'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Projected interest (variable)</p>
                <p className='text-2xl font-semibold text-foreground'>{VARIABLE_INTEREST_APR.toFixed(2)}% APR</p>
                <p className='text-xs text-muted-foreground mt-1'>Tune the VARIABLE_INTEREST_APR constant once rates are finalized.</p>
              </div>
            </div>

            <div className='rounded-xl border border-gray-200/60 bg-white/60 p-4 dark:border-gray-800 dark:bg-gray-950/60'>
              <p className='text-xs uppercase tracking-wide text-muted-foreground'>Borrower</p>
              <p className='text-sm font-semibold text-foreground'>{toReadableAddress(borrowerQuery?.data as string)}</p>
              <p className='text-xs text-muted-foreground mt-1'>Only lenders who trust this borrower should fund.</p>
            </div>

            <div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-4 text-sm dark:border-gray-800 dark:bg-gray-900/30'>
              <div className='flex flex-wrap items-center justify-between gap-4'>
                <div>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Raised so far</p>
                  <p className='text-foreground text-lg font-semibold'>{formatBigInt(totalRaised)}</p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Target buffer (150%)</p>
                  <p className='text-foreground text-lg font-semibold'>{formatBigInt(totalRequired)}</p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Progress</p>
                  <p className='text-foreground text-lg font-semibold'>{fundingProgress.toFixed(2)}%</p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Projected interest</p>
                  <p className='text-foreground text-lg font-semibold'>{VARIABLE_INTEREST_APR.toFixed(2)}% APR</p>
                </div>
              </div>
            </div>

            <Button
              className='w-full'
              onClick={handleContribute}
              disabled={!loanInstance || contributeTx.inBestBlockProgress}
            >
              {contributeTx.inBestBlockProgress ? 'Funding...' : 'Fund this request'}
            </Button>
          </CardContent>
        </Card>

        <Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold'>Your recent fundings</CardTitle>
            <p className='text-sm text-muted-foreground'>Locally tracked notes for easy reference.</p>
          </CardHeader>
          <CardContent className='space-y-3'>
            {localNotes.length === 0 ? (
              <div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-4 text-center text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-900/20'>
                Submit a contribution to track it here.
              </div>
            ) : (
              localNotes.map((note) => (
                <div key={note.id} className='rounded-xl border border-gray-200/70 bg-white/70 p-4 text-sm dark:border-gray-800 dark:bg-gray-950/50'>
                  <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    <span>{new Date(note.timestamp).toLocaleString()}</span>
                  </div>
                  <p className='mt-2 font-semibold text-foreground'>{note.amount} RAW</p>
                  <p className='text-xs text-muted-foreground'>Projected interest: {note.interestApr.toFixed(2)}% APR (variable)</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold'>Registry requests</CardTitle>
            <p className='text-sm text-muted-foreground'>Top borrow intents registered on-chain.</p>
          </CardHeader>
          <CardContent>
            {loanOpportunities.length === 0 ? (
              <div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-6 text-center text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-900/20'>
                No registry entries available yet.
              </div>
            ) : (
              <div className='space-y-3'>
                {loanOpportunities.map((loan) => (
                  <div key={loan.id} className='rounded-xl border border-gray-200/70 bg-white/70 p-4 text-sm dark:border-gray-800 dark:bg-gray-950/50'>
                    <div className='flex items-center justify-between'>
                      <span className='font-semibold text-foreground'>{loan.ss58}</span>
                      <span className='text-xs text-muted-foreground'>H160: {loan.h160}</span>
                    </div>
                    <p className='text-xs text-muted-foreground mt-1'>Invite-only: only lend to wallets you trust.</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold'>Loan instance insights</CardTitle>
            <p className='text-sm text-muted-foreground'>Track state, debt, and contributor mix.</p>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='rounded-xl border border-gray-200/70 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-950/60'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>State</span>
                <span className='font-semibold text-foreground'>{stateQuery?.data ?? '—'}</span>
              </div>
              <Separator className='my-3 opacity-50' />
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Remaining debt</span>
                <PendingText isLoading={remainingDebtQuery?.isLoading} className='font-semibold text-foreground'>
                  {formatBigInt(remainingDebtQuery?.data as bigint)}
                </PendingText>
              </div>
              <div className='flex items-center justify-between text-sm mt-2'>
                <span className='text-muted-foreground'>Min lenders</span>
                <span className='font-semibold text-foreground'>{loanSnapshot?.minLenders ?? '—'}</span>
              </div>
            </div>

            <div>
              <p className='text-sm font-semibold text-foreground mb-2'>Active contributors</p>
              {contributions.length === 0 ? (
                <div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-4 text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-900/20'>
                  No contributions yet. Be the first to fund.
                </div>
              ) : (
                <div className='space-y-2 max-h-56 overflow-y-auto pr-1'>
                  {contributions.map((entry, idx) => {
                    let readable = entry.lender as unknown as string;
                    try {
                      readable = AddressConverter.h160ToSS58(readable);
                    } catch {
                      // ignore
                    }
                    return (
                      <div key={`${readable}-${idx}`} className='rounded-lg border border-gray-200/70 bg-white/70 p-3 text-xs dark:border-gray-800 dark:bg-gray-950/50'>
                        <div className='flex items-center justify-between'>
                          <span className='font-mono text-[11px]'>{toReadableAddress(readable)}</span>
                          <span className='font-semibold text-foreground'>{formatBigInt(entry.amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <p className='text-sm font-semibold text-foreground mb-2'>Your funding footprint</p>
              {lenderContributions.length === 0 ? (
                <div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-4 text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-900/20'>
                  Your wallet has not funded this request yet.
                </div>
              ) : (
                <div className='space-y-2'>
                  {lenderContributions.map((entry, idx) => (
                    <div key={`self-${idx}`} className='rounded-lg border border-indigo-400/50 bg-indigo-500/5 p-3 text-xs text-indigo-500 dark:text-indigo-300'>
                      <div className='flex items-center justify-between'>
                        <span>Contribution #{idx + 1}</span>
                        <span className='font-semibold text-foreground'>{formatBigInt(entry.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
