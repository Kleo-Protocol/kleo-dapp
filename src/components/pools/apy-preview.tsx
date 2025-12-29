'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, Info } from 'lucide-react';
import type { Pool } from '@/services/mock/pools.mock';

interface ApyPreviewProps {
  pool: Pool;
  depositAmount?: number;
}

export function ApyPreview({ pool, depositAmount = 0 }: ApyPreviewProps) {
  const baseApy = Number(pool.baseInterestRate) / 100;
  
  // Mock APY calculation (simplified)
  const effectiveApy = baseApy;
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
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{effectiveApy.toFixed(2)}%</span>
            <span className="text-sm text-slate-600">APY</span>
          </div>
          <p className="text-sm text-slate-600 mt-1">Based on current pool interest rate</p>
        </div>

        {depositAmount > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Deposit Amount</span>
              <span className="text-sm font-semibold text-slate-900">
                {depositAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} tokens
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Estimated Monthly Return</span>
              <span className="text-sm font-semibold text-slate-900">
                {monthlyReturn.toLocaleString('en-US', { maximumFractionDigits: 2 })} tokens
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Estimated Annual Return</span>
              <span className="text-sm font-semibold text-slate-900">
                {annualReturn.toLocaleString('en-US', { maximumFractionDigits: 2 })} tokens
              </span>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 pt-2 border-t border-slate-200">
          <Info className="size-4 text-slate-500 mt-0.5" />
          <p className="text-xs text-slate-600">
            APY is calculated based on the pool's base interest rate. Actual returns may vary based on pool performance and utilization.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

