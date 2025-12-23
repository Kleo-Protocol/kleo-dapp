'use client';

import { WalletSelection } from '@/components/shared/wallet-selection';
import { TypinkTextLogo } from '@/components/shared/icons';
import { useTypink } from 'typink';
import { UserRoleSelectionModal } from '@/components/UserRoleSelectionModal';
import { useSyncWalletState } from '@/hooks/use-sync-wallet-state';

export default function Home() {
  const { accounts } = useTypink();

  // Sincronizar estado de typink con nuestro store
  useSyncWalletState();

  return (
    <>
      <section className='flex flex-col items-center justify-center gap-8 px-4 py-24 text-center min-h-[70vh]'>
        <TypinkTextLogo width={240} height={60} />
        <div className='space-y-4 max-w-2xl'>
          <h1 className='text-4xl font-semibold tracking-tight text-foreground'>Welcome to Kleo</h1>
          <p className='text-lg text-muted-foreground'>Connect your wallet to access your dashboard, manage loans, and keep trust scores in sync.</p>
        </div>
        {accounts.length === 0 && (
          <WalletSelection buttonLabel='Connect Wallet' buttonClassName='text-base px-6 py-5 rounded-2xl bg-primary/80 text-primary-foreground hover:bg-primary' />
        )}
      </section>
      <UserRoleSelectionModal />
    </>
  );
}
