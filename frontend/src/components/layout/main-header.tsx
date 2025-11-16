'use client';

import { AccountSelection } from '@/components/shared/account-selection';
import { WalletSelection } from '@/components/shared/wallet-selection';
import { useTypink } from 'typink';
import Link from 'next/link';
import { TypinkLogo } from '@/components/shared/icons';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export function MainHeader() {
  const { accounts } = useTypink();
  const pathname = usePathname();
  const showDashboardActions = pathname?.startsWith('/dashboard');

  return (
    <div className='border-b border-gray-200 dark:border-gray-800'>
      <div className='max-w-5xl px-4 mx-auto flex justify-between items-center gap-4 h-16'>
        <Link href='/' className='w-24'>
          <TypinkLogo />
        </Link>
        <div className='flex items-center gap-3'>
          {showDashboardActions && (
            <div className='flex flex-wrap items-center gap-2 mr-2 sm:mr-4 lg:mr-6'>
              <Button size='sm' variant='ghost' className='text-foreground border border-border/50 hover:border-border'>Trust Wallet</Button>
              <Button size='sm' variant='ghost' className='text-foreground border border-border/50 hover:border-border'>
                Borrow
              </Button>
              <Button size='sm' variant='ghost' className='text-foreground border border-border/50 hover:border-border'>
                Lend
              </Button>
              <Button size='sm' variant='ghost' className='text-foreground border border-border/50 hover:border-border'>
                Pay Loan
              </Button>
            </div>
          )}
          {accounts.length > 0 ? <AccountSelection /> : <WalletSelection />}
        </div>
      </div>
    </div>
  );
}
