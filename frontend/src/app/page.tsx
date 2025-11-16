'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WalletSelection } from '@/components/shared/wallet-selection';
import { TypinkTextLogo } from '@/components/shared/icons';
import { useTypink } from 'typink';

export default function LandingPage() {
  const router = useRouter();
  const { accounts } = useTypink();

  useEffect(() => {
    if (accounts.length > 0) {
      router.replace('/dashboard');
    }
  }, [accounts.length, router]);

  return (
    <section className='flex flex-col items-center justify-center gap-8 px-4 py-24 text-center min-h-[60vh]'>
      <TypinkTextLogo width={240} height={60} />
      <div className='space-y-3 max-w-2xl'>
        <h1 className='text-3xl font-semibold tracking-tight'>Welcome to Kleo</h1>
        <p className='text-muted-foreground text-lg'>
          Connect your wallet to manage on-chain loans, monitor trust scores, and access your personalized dashboard.
        </p>
      </div>
      <WalletSelection buttonLabel='Connect Wallet' buttonClassName='text-base px-8 py-6 rounded-2xl' />
      {accounts.length > 0 && <p className='text-sm text-muted-foreground'>Redirecting to dashboard...</p>}
    </section>
  );
}
