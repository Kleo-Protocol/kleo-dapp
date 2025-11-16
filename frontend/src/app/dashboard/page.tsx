'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TypinkIntro } from '@/components/shared/typink-intro';
import { useTypink } from 'typink';

export default function DashboardPage() {
  const router = useRouter();
  const { accounts } = useTypink();

  useEffect(() => {
    if (accounts.length === 0) {
      router.replace('/');
    }
  }, [accounts.length, router]);

  if (accounts.length === 0) {
    return (
      <div className='py-16 text-center text-muted-foreground'>
        Preparing your dashboard...
      </div>
    );
  }

  return (
    <div>
      <TypinkIntro />
    </div>
  );
}
