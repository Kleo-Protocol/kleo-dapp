'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { TrendingUp, Info } from 'lucide-react';
import { useCurrentRate } from '@/features/pools/hooks/use-lending-pool-data';
import { Skeleton } from '@/shared/ui/skeleton';
import type { Pool } from '@/lib/types';

interface ApyPreviewProps {
  pool: Pool;
  depositAmount?: number;
}

export function ApyPreview({ pool, depositAmount = 0 }: ApyPreviewProps) {
  const { data: currentRate, isLoading: isLoadingRate } = useCurrentRate();
  
  // Use current rate from contract if available, otherwise fallback to pool base rate
  const effectiveApy = currentRate != null ? currentRate * 100 : Number(pool.baseInterestRate) / 100;
  const monthlyReturn = depositAmount > 0 ? (depositAmount * effectiveApy) / 12 : 0;
  const annualReturn = depositAmount > 0 ? depositAmount * effectiveApy : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5" />
          APY Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-secondary/50 p-4">
          {isLoadingRate ? (
            <Skeleton className="h-10 w-32" />
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-card-foreground">{effectiveApy.toFixed(2)}%</span>
                <span className="text-sm text-muted-foreground">APY</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {currentRate != null ? 'Current pool interest rate' : 'Based on pool base interest rate'}
              </p>
            </>
          )}
        </div>

        {depositAmount > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Deposit Amount</span>
              <span className="text-sm font-semibold text-card-foreground">
                {depositAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} tokens
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Monthly Return</span>
              <span className="text-sm font-semibold text-card-foreground">
                {monthlyReturn.toLocaleString('en-US', { maximumFractionDigits: 2 })} tokens
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Annual Return</span>
              <span className="text-sm font-semibold text-card-foreground">
                {annualReturn.toLocaleString('en-US', { maximumFractionDigits: 2 })} tokens
              </span>
            </div>
          </div>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
        <div className="flex items-start gap-2 pt-2 border-t border-border cursor-help">
          <Info className="size-4 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
                  APY is calculated based on the pool's base interest rate. Actual returns may vary based on pool performance and utilization.
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Returns are calculated using simple interest. Compounding and pool performance factors may affect actual returns.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

