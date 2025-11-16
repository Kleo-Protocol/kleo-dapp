'use client';

import { PendingText } from '@/components/shared/pending-text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContractId } from '@/contracts/deployments';
import { LoanRegistryContractApi } from '@/contracts/types/loan-registry';
import { TrustOracleContractApi } from '@/contracts/types/trust-oracle';
import { addressToH160, formatScore, normalizeHexAddress } from '@/lib/trust';
import { useMemo } from 'react';
import { ShieldCheckIcon, ShieldXIcon } from 'lucide-react';
import { useContract, useContractQuery } from 'typink';

interface TrustOverviewCardProps {
  address?: string;
}

export function TrustOverviewCard({ address }: TrustOverviewCardProps) {
  const { contract: trustOracle } = useContract<TrustOracleContractApi>(ContractId.TRUST_ORACLE);
  const { contract: loanRegistry } = useContract<LoanRegistryContractApi>(ContractId.LOAN_REGISTRY);

  const borrower = useMemo(() => addressToH160(address), [address]);

  const trustScoreQuery = useContractQuery(
    trustOracle && borrower
      ? {
          contract: trustOracle,
          fn: 'getTrustScore',
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

  const roleQuery = useContractQuery(
    trustOracle && borrower
      ? {
          contract: trustOracle,
          fn: 'getRole',
          args: [borrower],
          watch: true,
        }
      : undefined,
  );

  const weightsQuery = useContractQuery(
    trustOracle
      ? {
          contract: trustOracle,
          fn: 'getWeights',
          watch: false,
        }
      : undefined,
  );

  const trustScoreLoading = borrower ? trustScoreQuery.isLoading : false;
  const trustScore = borrower ? trustScoreQuery?.data ?? 0 : 0;
  const minTrustScore = minTrustScoreQuery?.data ?? 0;
  const role = roleQuery?.data;
  const weights = weightsQuery?.data;

  const isEligible = trustScore >= minTrustScore && minTrustScore > 0;
  const needsDelta = Math.max(minTrustScore - trustScore, 0);

  return (
    <Card className='h-full bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-2xl font-semibold'>Trust Overview</CardTitle>
            <p className='text-sm text-muted-foreground'>Live snapshot from Trust Oracle + Registry</p>
          </div>
          {isEligible ? (
            <span className='inline-flex items-center gap-1 rounded-full bg-green-600/10 px-3 py-1 text-xs font-semibold text-green-500'>
              <ShieldCheckIcon className='h-3.5 w-3.5' /> Eligible
            </span>
          ) : (
            <span className='inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500'>
              <ShieldXIcon className='h-3.5 w-3.5' /> Needs score
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='rounded-xl border border-gray-200/60 bg-white/60 p-4 dark:border-gray-800 dark:bg-gray-950/60'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>Current score</p>
            <PendingText isLoading={trustScoreLoading} className='text-3xl font-bold text-foreground'>
              {formatScore(trustScore)}
            </PendingText>
            <p className='text-xs text-muted-foreground mt-1'>Based on the last on-chain trust events.</p>
          </div>
          <div className='rounded-xl border border-gray-200/60 bg-white/60 p-4 dark:border-gray-800 dark:bg-gray-950/60'>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>Required to borrow</p>
            <PendingText isLoading={minTrustScoreQuery.isLoading} className='text-3xl font-bold text-foreground'>
              {formatScore(minTrustScore)}
            </PendingText>
            <p className='text-xs text-muted-foreground mt-1'>Value pulled directly from Loan Registry.</p>
          </div>
        </div>

        <div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-4 text-sm dark:border-gray-800 dark:bg-gray-900/40'>
          {isEligible ? (
            <p className='text-green-600 dark:text-green-400'>This wallet meets the minimum trust score. You can open a loan anytime.</p>
          ) : minTrustScore > 0 ? (
            <p>
              You still need <span className='font-semibold text-foreground'>{needsDelta}</span> more trust points before creating your next
              loan.
            </p>
          ) : (
            <p>We are waiting for the registry to publish a minimum trust score.</p>
          )}
        </div>

        <div className='rounded-xl border border-gray-200/60 bg-white/60 p-4 dark:border-gray-800 dark:bg-gray-950/60'>
          <p className='text-xs uppercase tracking-wide text-muted-foreground mb-3'>Oracle configuration</p>
          <dl className='grid grid-cols-2 gap-3 text-sm'>
            <div>
              <dt className='text-muted-foreground'>Your Role</dt>
              <dd className='font-semibold'>{role ?? 'Viewer'}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>Watched Address</dt>
              <dd className='font-mono text-xs'>{normalizeHexAddress(address) ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>Positive weights</dt>
              <dd>
                {weights ? `Pay ${weights[0]}, Guarantor ${weights[2]}, Identity ${weights[3]}` : '—'}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>Penalty weight</dt>
              <dd>{weights ? weights[1] : '—'}</dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
