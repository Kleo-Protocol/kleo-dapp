'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatBalance } from 'typink';
import { useTypink } from 'typink';
import { Skeleton } from '@/shared/ui/skeleton';
import { Shield, User, AlertCircle } from 'lucide-react';
import { shortenAddress } from '@/lib/utils';
import { Identicon } from '@dedot/react-identicon';
import type { VouchForMe, MyVouch } from '../hooks/use-personal-dashboard';

interface VouchNetworkProps {
  vouchesForMe: VouchForMe[];
  myVouches: MyVouch[];
  isLoading: boolean;
  onWithdrawVouch?: (borrowerAddress: string) => void;
}

export function VouchNetwork({
  vouchesForMe,
  myVouches,
  isLoading,
  onWithdrawVouch,
}: VouchNetworkProps) {
  const { network } = useTypink();

  if (isLoading) {
    return (
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='border-border backdrop-blur-sm'>
          <CardHeader>
            <Skeleton className='h-6 w-48 mb-2' />
            <Skeleton className='h-4 w-32' />
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className='h-24 w-full' />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className='border-border backdrop-blur-sm'>
          <CardHeader>
            <Skeleton className='h-6 w-48 mb-2' />
            <Skeleton className='h-4 w-32' />
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className='h-24 w-full' />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      {/* Quién Me Respalda */}
      <Card className='border-cetacean-blue/20 bg-cetacean-blue/5 backdrop-blur-sm'>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Shield className='h-5 w-5 text-cetacean-blue' />
            <div>
              <CardTitle className='font-sora text-lg font-semibold'>Quién Me Respalda</CardTitle>
              <CardDescription className='font-inter text-sm'>
                {vouchesForMe.length} {vouchesForMe.length === 1 ? 'voucher' : 'vouchers'} respaldándome
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vouchesForMe.length === 0 ? (
            <div className='text-center py-8'>
              <p className='font-inter text-sm text-muted-foreground'>
                Nadie te está respaldando todavía
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {vouchesForMe.map((vouch, index) => (
                <div
                  key={`vouch-for-me-${index}`}
                  className='p-4 rounded-lg border border-cetacean-blue/20 bg-cetacean-blue/10 backdrop-blur-sm hover:border-cetacean-blue/40 transition-all'
                >
                  <div className='flex items-start gap-3'>
                    <Identicon value={vouch.voucherAddress} theme='polkadot' size={40} />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-inter font-mono text-xs text-foreground'>
                          {shortenAddress(vouch.voucherAddress)}
                        </span>
                        {vouch.status === 'Active' ? (
                          <Badge variant='secondary' className='bg-forest-green/20 text-forest-green border-forest-green/30 text-xs'>
                            Active
                          </Badge>
                        ) : (
                          <Badge variant='secondary' className='text-xs'>{vouch.status}</Badge>
                        )}
                      </div>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-inter text-sm text-muted-foreground'>Staked:</span>
                          <span className='font-inter text-sm font-medium'>
                            {vouch.stakedStars} stars + {formatBalance(vouch.stakedCapital, network)}
                          </span>
                        </div>
                        {vouch.since && (
                          <p className='font-inter text-xs text-muted-foreground'>
                            Since {new Date(Number(vouch.since) * 1000).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                      {/* Visual bar for staked capital */}
                      <div className='mt-2 h-1.5 bg-cetacean-blue/20 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-cetacean-blue transition-all'
                          style={{
                            width: `${Math.min(
                              Number((vouch.stakedCapital * 100n) / 10000n),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* A Quién Respaldo */}
      <Card className='border-amber-honey/20 bg-amber-honey/5 backdrop-blur-sm'>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <User className='h-5 w-5 text-amber-honey' />
            <div>
              <CardTitle className='font-sora text-lg font-semibold'>A Quién Respaldo</CardTitle>
              <CardDescription className='font-inter text-sm'>
                {myVouches.length} {myVouches.length === 1 ? 'borrower' : 'borrowers'} que respaldo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {myVouches.length === 0 ? (
            <div className='text-center py-8'>
              <p className='font-inter text-sm text-muted-foreground'>
                No estás respaldando a nadie todavía
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {myVouches.map((vouch, index) => (
                <div
                  key={`my-vouch-${index}`}
                  className='p-4 rounded-lg border border-amber-honey/20 bg-amber-honey/10 backdrop-blur-sm hover:border-amber-honey/40 transition-all'
                >
                  <div className='flex items-start gap-3'>
                    <Identicon value={vouch.borrowerAddress} theme='polkadot' size={40} />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-inter font-mono text-xs text-foreground'>
                          {shortenAddress(vouch.borrowerAddress)}
                        </span>
                        <div className='flex items-center gap-2'>
                          {vouch.status === 'Defaulted' && (
                            <AlertCircle className='h-4 w-4 text-atomic-tangerine' />
                          )}
                          {vouch.status === 'Active' ? (
                            <Badge variant='secondary' className='bg-forest-green/20 text-forest-green border-forest-green/30 text-xs'>
                              Active
                            </Badge>
                          ) : (
                            <Badge variant={vouch.status === 'Defaulted' ? 'rojo' : 'secondary'} className='text-xs'>
                              {vouch.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-inter text-sm text-muted-foreground'>My stake:</span>
                          <span className='font-inter text-sm font-medium'>
                            {vouch.stakedStars} stars + {formatBalance(vouch.stakedCapital, network)}
                          </span>
                        </div>
                        {vouch.since && (
                          <p className='font-inter text-xs text-muted-foreground'>
                            Since {new Date(Number(vouch.since) * 1000).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                      {/* Visual bar for staked capital */}
                      <div className='mt-2 h-1.5 bg-amber-honey/20 rounded-full overflow-hidden'>
                        <div
                          className={`h-full transition-all ${
                            vouch.status === 'Defaulted'
                              ? 'bg-atomic-tangerine'
                              : 'bg-amber-honey'
                          }`}
                          style={{
                            width: `${Math.min(
                              Number((vouch.stakedCapital * 100n) / 10000n),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      {vouch.status === 'Active' && onWithdrawVouch && (
                        <Button
                          size='sm'
                          variant='secondary'
                          onClick={() => onWithdrawVouch(vouch.borrowerAddress)}
                          className='mt-2 w-full font-inter text-xs'
                        >
                          Withdraw Vouch
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
