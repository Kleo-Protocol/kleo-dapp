'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { txToaster, useContract, useContractQuery, useContractTx, useTypink } from 'typink';
import type { ISubmittableResult } from 'dedot/types';
import { ContractId } from '@/contracts/deployments';
import { LoanInstanceContractApi } from '@/contracts/types/loan-instance';
import type { LoanInstance, LoanInstanceLenderContribution } from '@/contracts/types/loan-instance';
import { AddressConverter } from '@/lib/address-converter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PendingText } from '@/components/shared/pending-text';

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

function formatTimestamp(value?: bigint | number) {
	if (!value) return '—';
	try {
		const asNumber = typeof value === 'number' ? value : Number(value);
		if (!Number.isFinite(asNumber) || asNumber <= 0) return '—';
		const date = new Date(asNumber);
		if (Number.isNaN(date.getTime())) return '—';
		return date.toLocaleString();
	} catch {
		return '—';
	}
}

interface LocalPayment {
	id: string;
	amount: string;
	timestamp: number;
}

export default function PayLoanPage() {
	const router = useRouter();
	const { accounts, connectedAccount } = useTypink();
	const { contract: loanInstance } = useContract<LoanInstanceContractApi>(ContractId.LOAN_INSTANCE);

	const [amount, setAmount] = useState('');
	const [localPayments, setLocalPayments] = useState<LocalPayment[]>([]);
	const [loanSnapshot, setLoanSnapshot] = useState<LoanInstance | null>(null);

	useEffect(() => {
		if (accounts.length === 0) {
			router.replace('/');
		}
	}, [accounts.length, router]);

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

	const principalQuery = useContractQuery(
		loanInstance
			? {
					contract: loanInstance,
					fn: 'getPrincipal',
					watch: true,
				}
			: undefined,
	);

	useEffect(() => {
		let cancelled = false;
		async function loadSnapshot() {
			if (!loanInstance) return;
			try {
				const snapshot = await loanInstance.storage.root();
				if (!cancelled) {
					setLoanSnapshot(snapshot as LoanInstance);
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
	const remainingDebt = (remainingDebtQuery?.data as bigint | undefined) ?? loanSnapshot?.remainingDebt ?? 0n;
	const principal = (principalQuery?.data as bigint | undefined) ?? loanSnapshot?.principal ?? 0n;
	const totalRequired = loanSnapshot?.totalRequired ?? principal;
	const bufferAmount = loanSnapshot?.bufferAmount ?? (totalRequired > principal ? totalRequired - principal : 0n);
	const state = stateQuery?.data as string | undefined;
	const borrowerH160 = (borrowerQuery?.data as string | undefined) ?? (loanSnapshot?.borrower as unknown as string | undefined);
	const connectedAccountH160 = useMemo(() => {
		if (!connectedAccount?.address) return undefined;
		try {
			return AddressConverter.ss58ToH160(connectedAccount.address);
		} catch (error) {
			console.warn('Unable to normalize connected lender for repay page', error);
			return undefined;
		}
	}, [connectedAccount?.address]);

	const borrowerSs58 = useMemo(() => {
		if (!borrowerH160) return undefined;
		try {
			return AddressConverter.h160ToSS58(borrowerH160);
		} catch {
			return borrowerH160;
		}
	}, [borrowerH160]);

	const isBorrower = useMemo(() => {
		if (!borrowerH160 || !connectedAccountH160) return false;
		return borrowerH160.toLowerCase?.() === connectedAccountH160.toLowerCase?.();
	}, [borrowerH160, connectedAccountH160]);

	const amountRepaid = principal > remainingDebt ? principal - remainingDebt : 0n;
	const repaymentProgress = principal > 0n ? Number((amountRepaid * 10000n) / principal) / 100 : 0;
	const lenderCount = useMemo(() => {
		const unique = new Set(contributions.map((entry) => (entry?.lender as unknown as string)?.toLowerCase?.() || ''));
		unique.delete('');
		return unique.size;
	}, [contributions]);

	const aggregatedContributions = useMemo(() => {
		const map = new Map<string, bigint>();
		contributions.forEach((entry) => {
			const lender = (entry.lender as unknown as string) ?? '';
			if (!lender) return;
			const normalized = lender.toLowerCase();
			const prev = map.get(normalized) ?? 0n;
			map.set(normalized, prev + (entry.amount ?? 0n));
		});
		return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
	}, [contributions]);

	const repayTx = useContractTx(loanInstance, 'repay');

	const handleRepay = async () => {
		if (!loanInstance) {
			toast.error('Loan contract not available.');
			return;
		}
		if (!isBorrower) {
			toast.error('Only the borrower can repay this loan.');
			return;
		}
		if (!amount.trim()) {
			toast.error('Enter the amount you wish to repay.');
			return;
		}

		let parsedAmount: bigint;
		try {
			parsedAmount = BigInt(amount.trim());
		} catch {
			toast.error('Repayment must be an integer (raw units).');
			return;
		}

		if (parsedAmount <= 0n) {
			toast.error('Repayment must be greater than zero.');
			return;
		}

		const toaster = txToaster('Submitting repayment...');
		try {
			await repayTx.signAndSend({
				args: [],
				txOptions: { value: parsedAmount },
				callback: (result: ISubmittableResult) => toaster.onTxProgress(result),
			});
			toast.success('Repayment submitted');
			setLocalPayments((prev) => [
				{ id: `${Date.now()}-${Math.random()}`, amount: amount.trim(), timestamp: Date.now() },
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
				Preparing repayment tools...
			</div>
		);
	}

	if (borrowerH160 && !isBorrower) {
		return (
			<div className='px-4 py-20 text-center space-y-4'>
				<h2 className='text-3xl font-semibold text-foreground'>You do NOT have loans to repay.</h2>
				<p className='text-muted-foreground max-w-xl mx-auto'>
					This space is dedicated for wallets who have to repay loans to people who trust them. Request your own borrowing power or explore lending opportunities instead.
				</p>
				<div className='flex items-center justify-center gap-3 flex-wrap'>
					<Button asChild>
						<Link href='/borrow'>Request a loan</Link>
					</Button>
					<Button asChild variant='outline'>
						<Link href='/lend'>Switch to lending</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-6 px-4 pb-16'>
			<div className='grid gap-6 lg:grid-cols-3'>
				<Card className='lg:col-span-2 bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
					<CardHeader>
						<CardTitle className='text-2xl font-semibold'>Repay your loan</CardTitle>
						<p className='text-sm text-muted-foreground'>Send raw units directly back into the shared loan instance.</p>
					</CardHeader>
					<CardContent className='space-y-5'>
						<div className='rounded-xl border border-dashed border-gray-300/70 bg-white/50 p-4 text-sm dark:border-gray-800 dark:bg-gray-900/20'>
							<div className='flex flex-wrap items-center gap-6'>
								<div>
									<p className='text-xs uppercase tracking-wide text-muted-foreground'>Outstanding debt</p>
									<PendingText isLoading={remainingDebtQuery?.isLoading} className='text-xl font-semibold text-foreground'>
										{formatBigInt(remainingDebt)}
									</PendingText>
								</div>
								<div>
									<p className='text-xs uppercase tracking-wide text-muted-foreground'>State</p>
									<span className='text-xl font-semibold text-foreground'>{state ?? '—'}</span>
								</div>
								<div>
									<p className='text-xs uppercase tracking-wide text-muted-foreground'>Progress</p>
									<span className='text-xl font-semibold text-foreground'>{repaymentProgress.toFixed(2)}%</span>
								</div>
								<div>
									<p className='text-xs uppercase tracking-wide text-muted-foreground'>Borrower</p>
									<span className='text-sm font-semibold text-foreground'>{toReadableAddress(borrowerSs58)}</span>
								</div>
							</div>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='repay-amount'>Amount to repay (raw units)</Label>
							<Input
								id='repay-amount'
								type='number'
								inputMode='numeric'
								autoComplete='off'
								placeholder='500000000000'
								value={amount}
								onChange={(event) => setAmount(event.target.value)}
								className='font-mono'
							/>
							<p className='text-xs text-muted-foreground'>Send partial or full repayments. Contract accepts incremental payments.</p>
						</div>

						<Button
							className='w-full'
							disabled={!loanInstance || !isBorrower || repayTx.inBestBlockProgress}
							onClick={handleRepay}
						>
							{repayTx.inBestBlockProgress ? 'Repaying...' : isBorrower ? 'Submit repayment' : 'Only borrower can repay'}
						</Button>
						{!isBorrower && (
							<p className='text-sm text-amber-600 dark:text-amber-400 text-center'>
								Only the borrower wallet can submit repayments. You can still monitor progress below.
							</p>
						)}
					</CardContent>
				</Card>

				<Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
					<CardHeader>
						<CardTitle className='text-2xl font-semibold'>Recent repayments</CardTitle>
						<p className='text-sm text-muted-foreground'>Local-only log for quick reference.</p>
					</CardHeader>
					<CardContent className='space-y-3'>
						{localPayments.length === 0 ? (
							<div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-4 text-center text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-900/20'>
								Repayments you submit appear here.
							</div>
						) : (
							localPayments.map((payment) => (
								<div key={payment.id} className='rounded-xl border border-gray-200/70 bg-white/70 p-4 text-sm dark:border-gray-800 dark:bg-gray-950/50'>
									<div className='flex items-center justify-between text-xs text-muted-foreground'>
										<span>{new Date(payment.timestamp).toLocaleString()}</span>
									</div>
									<p className='mt-2 font-semibold text-foreground'>{payment.amount} RAW</p>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>

			<div className='grid gap-6 lg:grid-cols-2'>
				<Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
					<CardHeader>
						<CardTitle className='text-2xl font-semibold'>Loan health</CardTitle>
						<p className='text-sm text-muted-foreground'>Track core metrics and deadlines.</p>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='rounded-xl border border-gray-200/70 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-950/60'>
							<div className='grid gap-4 sm:grid-cols-2'>
								<div>
									<p className='text-xs uppercase tracking-wide text-muted-foreground'>Principal</p>
									<span className='text-lg font-semibold text-foreground'>{formatBigInt(principal)}</span>
								</div>
								<div>
									<p className='text-xs uppercase tracking-wide text-muted-foreground'>Buffer retained</p>
									<span className='text-lg font-semibold text-foreground'>{formatBigInt(bufferAmount)}</span>
								</div>
								<div>
									<p className='text-xs uppercase tracking-wide text-muted-foreground'>Created</p>
									<span className='text-sm font-semibold text-foreground'>{formatTimestamp(loanSnapshot?.createdAt)}</span>
								</div>
								<div>
									<p className='text-xs uppercase tracking-wide text-muted-foreground'>Last payment</p>
									<span className='text-sm font-semibold text-foreground'>{formatTimestamp(loanSnapshot?.lastPaymentAt)}</span>
								</div>
							</div>
							<Separator className='my-4 opacity-50' />
							<div className='flex flex-wrap items-center justify-between gap-4 text-sm'>
								<div>
									<p className='text-xs uppercase tracking-wide text-muted-foreground'>Trust score @ issuance</p>
									<span className='font-semibold text-foreground'>{loanSnapshot?.trustScoreAtIssuance ?? '—'}</span>
								</div>
								<div>
									<p className='text-xs uppercase tracking-wide text-muted-foreground'>Unique lenders</p>
									<span className='font-semibold text-foreground'>{lenderCount || '—'}</span>
								</div>
								<div>
									<p className='text-xs uppercase tracking-wide text-muted-foreground'>Min lenders required</p>
									<span className='font-semibold text-foreground'>{loanSnapshot?.minLenders ?? '—'}</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
					<CardHeader>
						<CardTitle className='text-2xl font-semibold'>Contributor mix</CardTitle>
						<p className='text-sm text-muted-foreground'>Who helped fund your request.</p>
					</CardHeader>
					<CardContent>
						{aggregatedContributions.length === 0 ? (
							<div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-6 text-center text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-900/20'>
								No contributions recorded yet.
							</div>
						) : (
							<div className='space-y-3 max-h-72 overflow-y-auto pr-1'>
								{aggregatedContributions.map(({ key, value }) => {
									let readable = key;
									try {
										readable = AddressConverter.h160ToSS58(key);
									} catch {
										readable = key;
									}
									return (
										<div key={key} className='rounded-lg border border-gray-200/70 bg-white/70 p-3 text-xs dark:border-gray-800 dark:bg-gray-950/50'>
											<div className='flex items-center justify-between'>
												<span className='font-mono text-[11px]'>{toReadableAddress(readable)}</span>
												<span className='font-semibold text-foreground'>{formatBigInt(value)}</span>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
