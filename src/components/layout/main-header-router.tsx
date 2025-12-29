'use client';

import { AccountSelection } from '@/components/shared/account-selection';
import { WalletSelection } from '@/components/shared/wallet-selection';
import { useTypink } from 'typink';
import { Link, useLocation } from 'react-router-dom';
import { TypinkLogo } from '@/components/shared/icons';
import { Button } from '@/components/ui/button';
import { useSyncWalletState } from '@/hooks/use-sync-wallet-state';

export function MainHeaderRouter() {
  const { accounts } = useTypink();
  const location = useLocation();
  const showDashboardActions =
    location.pathname?.startsWith('/dashboard') ||
    location.pathname?.startsWith('/trust') ||
    location.pathname?.startsWith('/borrow') ||
    location.pathname?.startsWith('/lend') ||
    location.pathname?.startsWith('/pay-loan') ||
    location.pathname?.startsWith('/profile');

  // Sincronizar estado de typink con nuestro store
  useSyncWalletState();

  return (
    <div className='border-b border-gray-200 dark:border-gray-800'>
      <div className='max-w-5xl px-4 mx-auto flex justify-between items-center gap-4 h-16'>
        <Link to='/' className='w-24'>
          <TypinkLogo />
        </Link>
        <div className='flex items-center gap-3'>
          {showDashboardActions && (
            <div className='flex flex-wrap items-center gap-2 mr-2 sm:mr-4 lg:mr-6'>
              <Button
                asChild
                size='sm'
                variant='ghost'
                className='text-foreground border border-border/50 hover:border-border'>
                <Link to='/borrow'>Borrow</Link>
              </Button>
              <Button
                asChild
                size='sm'
                variant='ghost'
                className='text-foreground border border-border/50 hover:border-border'>
                <Link to='/lend'>Lend</Link>
              </Button>
              <Button
                asChild
                size='sm'
                variant='ghost'
                className='text-foreground border border-border/50 hover:border-border'>
                <Link to='/profile'>Profile</Link>
              </Button>
            </div>
          )}
          {accounts.length > 0 ? <AccountSelection /> : <WalletSelection />}
        </div>
      </div>
    </div>
  );
}

