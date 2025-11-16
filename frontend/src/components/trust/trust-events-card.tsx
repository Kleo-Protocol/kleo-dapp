
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PendingText } from '@/components/shared/pending-text';
import type { TrustEventItem } from '@/hooks/use-trust-events';
import { AddressConverter } from '@/lib/address-converter';

interface TrustEventsCardProps {
  events: TrustEventItem[];
  contractAddress?: string;
}

export function TrustEventsCard({ events, contractAddress }: TrustEventsCardProps) {
  const formattedContractAddress = (() => {
    if (!contractAddress) return null;
    try {
      return AddressConverter.format(contractAddress).ss58;
    } catch {
      return contractAddress;
    }
  })();

  return (
    <Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none'>
      <CardHeader>
        <CardTitle className='text-2xl font-semibold'>Trust Event Feed</CardTitle>
        <p className='text-sm text-muted-foreground'>Live events streamed from the Trust Oracle contract.</p>
      </CardHeader>
      <CardContent className='space-y-4'>
        {events.length === 0 ? (
          <div className='rounded-xl border border-dashed border-gray-300/70 bg-white/40 p-6 text-center text-sm text-muted-foreground dark:border-gray-800 dark:bg-gray-900/20'>
            Waiting for trust events...
          </div>
        ) : (
          <div className='space-y-3'>
                {events.map((event) => {
                  let borrowerLabel = event.borrower;
                  try {
                    borrowerLabel = AddressConverter.format(event.borrower).short;
                  } catch {
                    // ignore formatting errors
                  }

                  return (
                    <div
                      key={event.id}
                      className='rounded-xl border border-gray-200/60 bg-white/60 p-4 text-sm dark:border-gray-800 dark:bg-gray-950/60'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <div className='font-semibold'>{event.kind}</div>
                  <div className='text-xs text-muted-foreground'>
                    {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'pending'}
                  </div>
                </div>
                <div className='mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-3'>
                  <div>
                          Borrower: <span className='font-mono text-foreground'>{borrowerLabel}</span>
                  </div>
                  <div>
                    Amount:{' '}
                    <span className='text-foreground'>{event.amount ? event.amount.toString() : 'n/a'}</span>
                  </div>
                  <div>
                    New score: <span className='text-foreground font-semibold'>{event.newScore}</span>
                  </div>
                </div>
                    </div>
                  );
                })}
          </div>
        )}
        <PendingText isLoading={!formattedContractAddress} className='text-xs text-muted-foreground'>
          Watching address: {formattedContractAddress ?? 'loading...'}
        </PendingText>
      </CardContent>
    </Card>
  );
}
