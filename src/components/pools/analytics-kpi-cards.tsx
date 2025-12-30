'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, DollarSign, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { formatBalance } from '@/utils/format';
import type { PoolStats } from '@/services/mock/pools.mock';

interface AnalyticsKpiCardsProps {
  stats: PoolStats;
}

export function AnalyticsKpiCards({ stats }: AnalyticsKpiCardsProps) {

  const totalLoans = stats.totalLoans;
  const completionRate = totalLoans > 0 
    ? ((stats.completedLoans / totalLoans) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="size-4" />
            <span className="text-sm">Total Liquidity</span>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{formatBalance(stats.totalLiquidity)}</p>
          <p className="text-xs text-muted-foreground mt-1">Available: {formatBalance(stats.availableLiquidity)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="size-4" />
            <span className="text-sm">Total Lent</span>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{formatBalance(stats.totalLent)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Repaid: {formatBalance(stats.totalRepaid)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="size-4" />
            <span className="text-sm">Total Loans</span>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{totalLoans}</p>
          <p className="text-xs text-muted-foreground mt-1">Active: {stats.activeLoans}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <AlertTriangle className="size-4" />
            <span className="text-sm">Default Rate</span>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{stats.defaultRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">Completion: {completionRate}%</p>
        </CardContent>
      </Card>
    </div>
  );
}

