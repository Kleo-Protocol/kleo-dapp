'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { Shield, Info } from 'lucide-react';
import { formatBalance } from '@/shared/utils/format';
import { useUserStore } from '@/store/user.store';
import type { Pool } from '@/services/mock/pools.mock';

interface MaxBorrowInfoProps {
  pool: Pool;
}

export function MaxBorrowInfo({ pool }: MaxBorrowInfoProps) {
  const { reputation, tier } = useUserStore();

  // Mock calculation: max borrow based on reputation and tier
  const calculateMaxBorrow = () => {
    const baseMultiplier = tier === 'verde' ? 10 : tier === 'amarillo' ? 5 : 2;
    const reputationMultiplier = Math.floor(reputation / 100);
    const maxBorrow = baseMultiplier * reputationMultiplier * 1000; // in tokens
    
    // Cap at pool's available liquidity
    const poolAvailable = Number(pool.availableLiquidity) / 1e18;
    return Math.min(maxBorrow, poolAvailable);
  };

  const maxBorrow = calculateMaxBorrow();
  
  // Format number (not bigint) for display
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-5" />
          Borrowing Capacity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-secondary/50 p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-card-foreground">{formatNumber(maxBorrow)}</span>
            <span className="text-sm text-muted-foreground">tokens</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Maximum borrowable amount</p>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your Tier</span>
            <Badge variant={tier}>{tier.toUpperCase()}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Reputation Score</span>
            <span className="font-medium text-card-foreground">{reputation} points</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available in Pool</span>
            <span className="font-medium text-card-foreground">
              {formatBalance(pool.availableLiquidity)} tokens
            </span>
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-start gap-2 pt-2 border-t border-border cursor-help">
                <Info className="size-4 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Your borrowing capacity is based on your reputation score and tier. Higher reputation and tier unlock larger loan amounts.
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Verde tier: 10x multiplier, Amarillo: 5x, Rojo: 2x. Reputation multiplier = floor(reputation / 100).
                Final amount is capped by pool's available liquidity.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

