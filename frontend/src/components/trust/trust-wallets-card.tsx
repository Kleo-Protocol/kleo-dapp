'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { shortenAddress } from '@/lib/utils';
import { formatScore } from '@/lib/trust';
import type { TrustEventItem } from '@/hooks/use-trust-events';

interface TrustWalletsCardProps {
  events: TrustEventItem[];
  maxWallets?: number;
}

export function TrustWalletsCard({ events, maxWallets = 8 }: TrustWalletsCardProps) {
  const wallets = useMemo(() => {
    const unique = new Map<string, TrustEventItem>();

    for (const event of events) {
      if (!unique.has(event.borrower)) {
        unique.set(event.borrower, event);
      }
      if (unique.size >= maxWallets) break;
    }

    return Array.from(unique.values());
  }, [events, maxWallets]);

  return (
    <Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
      <CardHeader>
        <CardTitle className='text-2xl font-semibold'>Trusted Wallets</CardTitle>
        <p className='text-sm text-muted-foreground'>Latest borrowers with on-chain trust activity.</p>
      </CardHeader>
      <CardContent>
        {wallets.length === 0 ? (
          <div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-6 text-center text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-900/20'>
            No trust events yet. They will appear here as soon as the oracle records them.
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='text-xs uppercase text-muted-foreground'>
                <tr className='text-left'>
                  <th className='pb-2 font-medium'>Wallet</th>
                  <th className='pb-2 font-medium'>Last Event</th>
                  <th className='pb-2 font-medium'>Score</th>
                  <th className='pb-2 font-medium'>Updated</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200/60 dark:divide-gray-800/60'>
                {wallets.map((wallet) => (
                  <tr key={wallet.id} className='align-top'>
                    <td className='py-2 font-mono text-xs text-foreground'>{shortenAddress(wallet.borrower)}</td>
                    <td className='py-2 text-foreground'>{wallet.kind}</td>
                    <td className='py-2 font-semibold text-foreground'>{formatScore(wallet.newScore)}</td>
                    <td className='py-2 text-xs text-muted-foreground'>
                      {wallet.timestamp ? new Date(wallet.timestamp).toLocaleString() : 'pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
