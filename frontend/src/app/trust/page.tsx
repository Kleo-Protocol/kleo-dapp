'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTypink } from 'typink';
import { TrustOverviewCard } from '@/components/trust/trust-overview-card';
import { TrustActionsCard } from '@/components/trust/trust-actions-card';
import { TrustEventsCard } from '@/components/trust/trust-events-card';
import { TrustWalletsCard } from '@/components/trust/trust-wallets-card';
import { useTrustEvents } from '@/hooks/use-trust-events';

export default function TrustPage() {
	const router = useRouter();
	const { accounts, connectedAccount } = useTypink();
	const { contract: trustOracleContract, events } = useTrustEvents(40);

	useEffect(() => {
		if (accounts.length === 0) {
			router.replace('/');
		}
	}, [accounts.length, router]);

	if (accounts.length === 0) {
		return (
			<div className='py-16 text-center text-muted-foreground'>
				Preparing trust tools...
			</div>
		);
	}

	return (
		<div className='mx-auto px-4 pb-16 space-y-6'>
			<div className='grid gap-6 lg:grid-cols-3'>
				<div className='lg:col-span-2'>
					<TrustOverviewCard address={connectedAccount?.address} />
				</div>
				<TrustActionsCard />
			</div>
			<div className='grid gap-6 lg:grid-cols-2'>
				<TrustWalletsCard events={events} />
				<TrustEventsCard events={events} contractAddress={trustOracleContract?.address} />
			</div>
		</div>
	);
}
