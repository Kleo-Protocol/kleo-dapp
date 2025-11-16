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
import { Separator } from '@/components/ui/separator';
import { PendingText } from '@/components/shared/pending-text';

interface LocalRequestNote {
  id: string;
  principal: string;
  asset: string;
  message?: string;
  timestamp: number;
  overfactorBps: number;
  durationDays: number;
}

const DEFAULT_DURATION = 30; // days

function formatBigInt(value?: bigint | number, suffix = '') {
  if (value === undefined || value === null) return '—';
  try {
    const asBigInt = typeof value === 'bigint' ? value : BigInt(value);
    return `${asBigInt.toString()}${suffix}`;
  } catch {
    return `${value}${suffix}`;
  }
}

function formatAddress(address?: string) {
  if (!address) return '—';
  try {
    return AddressConverter.format(address).short;
  } catch {
    return address;
  }
}

export default function BorrowPage() {
  const router = useRouter();
  const { accounts, connectedAccount } = useTypink();
  const { contract: loanRegistry } = useContract<LoanRegistryContractApi>(ContractId.LOAN_REGISTRY);
  const { contract: loanInstance } = useContract<LoanInstanceContractApi>(ContractId.LOAN_INSTANCE);

  const [principal, setPrincipal] = useState('');
  const [asset, setAsset] = useState('DOT');
  const [message, setMessage] = useState('');
  const [durationDays, setDurationDays] = useState(String(DEFAULT_DURATION));
  const [requestNotes, setRequestNotes] = useState<LocalRequestNote[]>([]);
  const [loanSnapshot, setLoanSnapshot] = useState<LoanInstance | null>(null);

  useEffect(() => {
    if (accounts.length === 0) {
      router.replace('/');
    }
  }, [accounts.length, router]);

  const borrower = useMemo(() => {
    if (!connectedAccount?.address) return undefined;
    try {
      return AddressConverter.ss58ToH160(connectedAccount.address) as H160;
    } catch (error) {
      console.warn('Unable to normalize borrower address', error);
      return undefined;
    }
  }, [connectedAccount?.address]);

  const loansByBorrowerQuery = useContractQuery(
    loanRegistry && borrower
      ? {
          contract: loanRegistry,
          fn: 'getLoansByBorrower',
          args: [borrower],
          watch: true,
        }
      : undefined,
  );
  const minTrustScoreQuery = useContractQuery(
    loanRegistry
      ? {
          contract: loanRegistry,
          fn: 'getMinTrustScore',
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
  const totalRaised = contributions.reduce<bigint>((sum, item) => sum + (item?.amount ?? 0n), 0n);
  const totalRequired = loanSnapshot?.totalRequired ?? loanSnapshot?.principal ?? 0n;
  const fundingProgress = totalRequired > 0n ? Number((totalRaised * 10000n) / totalRequired) / 100 : 0;
  const borrowerLoans = (loansByBorrowerQuery?.data ?? []) as string[];

  const createLoanTx = useContractTx(loanRegistry, 'createLoan');

  const handleCreateLoan = async () => {
    if (!loanRegistry || !borrower) {
      toast.error('Connect your wallet to create a request.');
      return;
    }
    if (!principal.trim()) {
      toast.error('Specify the amount you need.');
      return;
    }

    let principalValue: bigint;
    try {
      principalValue = BigInt(principal.trim());
    } catch {
      toast.error('Principal must be an integer value (raw units).');
      return;
    }

    if (principalValue <= 0) {
      toast.error('Principal must be greater than zero.');
      return;
    }

    const overfactorBps = 15_000; // enforced 1.5x
    const durationNumber = Number(durationDays);
    if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
      toast.error('Provide a positive duration in days.');
      return;
    }
    const durationMs = BigInt(Math.floor(durationNumber * 24 * 60 * 60 * 1000));

    const toaster = txToaster('Submitting borrow request...');
    try {
      await createLoanTx.signAndSend({
        args: [principalValue, overfactorBps, durationMs],
        callback: (result: ISubmittableResult) => toaster.onTxProgress(result),
      });
      toast.success('Borrow request submitted');
      setRequestNotes((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          principal: principal.trim(),
          asset: asset.trim() || 'DOT',
          message,
          timestamp: Date.now(),
          overfactorBps,
          durationDays: durationNumber,
        },
        ...prev,
      ].slice(0, 5));
      setPrincipal('');
      setMessage('');
    } catch (error: any) {
      console.error(error);
      toaster.onTxError(error);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className='py-16 text-center text-muted-foreground'>
        Preparing borrow tools...
      </div>
    );
  }

  return (
    <div className='space-y-6 px-4 pb-16'>
      <div className='grid gap-6 lg:grid-cols-3'>
        <Card className='lg:col-span-2 bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold'>Request Borrowing Power</CardTitle>
            <p className='text-sm text-muted-foreground'>Describe the amount, asset, and optional context for your trusted lenders.</p>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='principal'>Amount Needed (raw units)</Label>
                <Input
                  id='principal'
                  inputMode='numeric'
                  autoComplete='off'
                  placeholder='1000000000000'
                  value={principal}
                  onChange={(event) => setPrincipal(event.target.value)}
                  className='font-mono'
                />
              </div>
              <div>
                <Label htmlFor='asset'>Asset Symbol</Label>
                <Input
                  id='asset'
                  autoComplete='off'
                  placeholder='DOT'
                  value={asset}
                  onChange={(event) => setAsset(event.target.value)}
                />
              </div>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='rounded-xl border border-gray-200/60 bg-white/60 p-4 dark:border-gray-800 dark:bg-gray-950/60'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Overcollateral factor</p>
                <p className='text-2xl font-semibold text-foreground'>1.50x</p>
                <p className='text-xs text-muted-foreground mt-1'>Registry enforces a fixed 150% buffer for every request.</p>
              </div>
              <div>
                <Label htmlFor='duration'>Max duration (days)</Label>
                <Input
                  id='duration'
                  type='number'
                  min={1}
                  step={1}
                  value={durationDays}
                  onChange={(event) => setDurationDays(event.target.value)}
                />
                <p className='text-xs text-muted-foreground mt-1'>Used for future loan scheduling integrations.</p>
              </div>
            </div>

            <div>
              <Label htmlFor='message'>Context (optional)</Label>
              <Input
                id='message'
                placeholder='Share details or repayment plan'
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <p className='text-xs text-muted-foreground mt-1'>Stored locally for your dashboard. Not sent on-chain.</p>
            </div>

            <div className='flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-4 text-sm dark:border-gray-800 dark:bg-gray-900/30'>
              <div>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Registry min trust score</p>
                <PendingText isLoading={minTrustScoreQuery?.isLoading} className='text-foreground text-lg font-semibold'>
                  {minTrustScoreQuery?.data ?? '—'}
                </PendingText>
              </div>
              <div>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Existing requests</p>
                <PendingText isLoading={loansByBorrowerQuery?.isLoading} className='text-foreground text-lg font-semibold'>
                  {borrowerLoans.length}
                </PendingText>
              </div>
              <div>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Connected wallet</p>
                <span className='font-mono text-sm'>{connectedAccount?.address ?? '—'}</span>
              </div>
            </div>

            <Button
              className='w-full'
              onClick={handleCreateLoan}
              disabled={!loanRegistry || !borrower || createLoanTx.inBestBlockProgress}
            >
              {createLoanTx.inBestBlockProgress ? 'Submitting...' : 'Submit borrow request'}
            </Button>
          </CardContent>
        </Card>

        <Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold'>Recent request notes</CardTitle>
            <p className='text-sm text-muted-foreground'>Local context for lenders—you control what to share.</p>
          </CardHeader>
          <CardContent className='space-y-3'>
            {requestNotes.length === 0 ? (
              <div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-4 text-center text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-900/20'>
                Submit a request to see it logged here for quick reference.
              </div>
            ) : (
              requestNotes.map((note) => (
                <div key={note.id} className='rounded-xl border border-gray-200/70 bg-white/70 p-4 text-sm dark:border-gray-800 dark:bg-gray-950/50'>
                  <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    <span>{new Date(note.timestamp).toLocaleString()}</span>
                    <span>{note.durationDays}d • {note.overfactorBps / 100}x</span>
                  </div>
                  <p className='mt-2 font-semibold text-foreground'>
                    {note.principal} {note.asset}
                  </p>
                  {note.message && <p className='text-sm text-muted-foreground mt-1'>{note.message}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold'>On-chain borrow requests</CardTitle>
            <p className='text-sm text-muted-foreground'>Loan Registry records for your wallet.</p>
          </CardHeader>
          <CardContent>
            {borrowerLoans.length === 0 ? (
              <div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-6 text-center text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-900/20'>
                No borrow requests detected yet. Submit one using the form above.
              </div>
            ) : (
              <div className='space-y-3'>
                {borrowerLoans.map((loanAddress, index) => {
                  let ss58 = loanAddress;
                  try {
                    ss58 = AddressConverter.h160ToSS58(loanAddress);
                  } catch {
                    // keep original value
                  }

                  return (
                    <div key={`${loanAddress}-${index}`} className='rounded-xl border border-gray-200/70 bg-white/70 p-4 text-sm dark:border-gray-800 dark:bg-gray-950/50'>
                      <div className='flex items-center justify-between'>
                        <span className='font-semibold text-foreground'>Loan #{index + 1}</span>
                        <span className='text-xs text-muted-foreground'>H160: {loanAddress}</span>
                      </div>
                      <Separator className='my-3 opacity-50' />
                      <div className='text-xs text-muted-foreground'>
                        Registry handle: <span className='font-mono text-foreground'>{ss58}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold'>Loan instance status</CardTitle>
            <p className='text-sm text-muted-foreground'>Live data from the shared loan contract.</p>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='rounded-xl border border-gray-200/70 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-950/60'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>State</span>
                <span className='font-semibold text-foreground'>{stateQuery?.data ?? '—'}</span>
              </div>
              <div className='mt-3'>
                <div className='flex items-center justify-between text-xs text-muted-foreground mb-1'>
                  <span>Progress</span>
                  <span>{fundingProgress.toFixed(2)}%</span>
                </div>
                <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800'>
                  <div
                    className='h-2 rounded-full bg-indigo-500'
                    style={{ width: `${Math.min(100, fundingProgress)}%` }}
                  />
                </div>
                <p className='mt-2 text-xs text-muted-foreground'>Raised {formatBigInt(totalRaised)} of {formatBigInt(totalRequired)} required units.</p>
              </div>
            </div>

            <div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-4 text-sm dark:border-gray-800 dark:bg-gray-900/20'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Remaining debt</span>
                <PendingText isLoading={remainingDebtQuery?.isLoading} className='font-semibold text-foreground'>
                  {formatBigInt(remainingDebtQuery?.data as bigint)}
                </PendingText>
              </div>
              <div className='flex items-center justify-between mt-2'>
                <span className='text-muted-foreground'>Min lenders</span>
                <span className='font-semibold text-foreground'>{loanSnapshot?.minLenders ?? '—'}</span>
              </div>
            </div>

            <div>
              <p className='text-sm font-semibold text-foreground mb-2'>Trusted contributions</p>
              {contributions.length === 0 ? (
                <div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-4 text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-900/20'>
                  Waiting for your trusted lenders to contribute.
                </div>
              ) : (
                <div className='space-y-2 max-h-56 overflow-y-auto pr-1'>
                  {contributions.map((entry, idx) => {
                    let lenderAddress = entry.lender as unknown as string;
                    try {
                      lenderAddress = AddressConverter.h160ToSS58(lenderAddress);
                    } catch {
                      // ignore
                    }
                    return (
                      <div key={`${lenderAddress}-${idx}`} className='rounded-lg border border-gray-200/70 bg-white/70 p-3 text-xs dark:border-gray-800 dark:bg-gray-950/50'>
                        <div className='flex items-center justify-between'>
                          <span className='font-mono text-[11px]'>{formatAddress(lenderAddress)}</span>
                          <span className='font-semibold text-foreground'>{formatBigInt(entry.amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
