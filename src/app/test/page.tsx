'use client';
import React, { useMemo } from 'react';
import { Card, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { Info } from 'lucide-react';
import Image from 'next/image';

const colorClasses = [
  'bg-deep-space-blue text-anti-flash-white border-deep-space-blue',
  'bg-atomic-tangerine text-deep-space-blue border-atomic-tangerine',
  'bg-amber-honey text-deep-space-blue border-amber-honey',
  'bg-cetacean-blue text-anti-flash-white border-cetacean-blue',
  'bg-oxford-blue text-anti-flash-white border-oxford-blue',
  'bg-anti-flash-white text-deep-space-blue border-anti-flash-white',
] as const;

function getRandomColorClass() {
  return colorClasses[Math.floor(Math.random() * colorClasses.length)];
}

export default function page() {
  return (
    <div className='flex flex-wrap gap-4 p-4'>
      <CustomCard
        specialBadge='TOP APY'
        tokens={['KSM', 'USDT', 'DOT']}
        apy={100}
        poolName='Pool 1'
        totalVolume='1000000'
      />
    </div>
  );
}

function CustomCard({
  specialBadge,
  tokens,
  apy,
  poolName,
  totalVolume,
}: {
  specialBadge?: string;
  tokens: string[];
  apy: number | string;
  poolName: string;
  totalVolume: number | string;
}) {
  const randomColorClass = useMemo(() => getRandomColorClass(), []);

  return (
    <Card className='bg-anti-flash-white w-fit border-none px-10 py-8 flex flex-col items-start gap-4'>
      {specialBadge && (
        <Badge variant='verde' className={randomColorClass}>
          {specialBadge}
        </Badge>
      )}
      <div className='flex -space-x-4'>
        {tokens.map((token, index) => (
          <Image
            key={token}
            src={`/tokens/${token}.png`}
            alt={token}
            width={30}
            height={30}
            className='relative z-10 border-2 border-anti-flash-white rounded-full'
            style={{ zIndex: tokens.length - index }}
          />
        ))}
      </div>
      <p className='text-sm text-black font-bold'>{tokens.join(' · ')}</p>{' '}
      <div className='flex justify-between items-center gap-2'>
        <CardTitle className='text-black text-2xl font-bold text-left'>{apy}%</CardTitle>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type='button' className='cursor-help'>
                <Info className='h-4 w-4 text-muted-foreground hover:text-foreground' />
              </button>
            </TooltipTrigger>
            <TooltipContent side='top'>
              <p>Annual Percentage Yield (APY) represents the annual return on your investment.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className='flex flex-col'>
        <p className='text-sm text-gray-600'>
          pool: <span className='text-black font-bold'>{poolName}</span>
        </p>
        <p className='text-sm text-gray-600'>
          total volume: <span className='text-black font-bold'>{totalVolume}</span>
        </p>
      </div>
      <button className='bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors w-full'>
        Earn
      </button>
    </Card>
  );
}
