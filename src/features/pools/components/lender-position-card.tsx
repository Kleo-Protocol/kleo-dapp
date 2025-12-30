'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { AlertTriangle, DollarSign, TrendingDown, Shield } from 'lucide-react';
import { formatBalance } from '@/shared/utils/format';
import { useUserStore } from '@/store/user.store';

interface LenderPositionCardProps {
  totalBacked: bigint;
  activeBacks: number;
  defaultedBacks: number;
}

export function LenderPositionCard({ totalBacked, activeBacks, defaultedBacks }: LenderPositionCardProps) {
  const { capital, reputation, tier } = useUserStore();

  const capitalAtRisk = Number(totalBacked) / 1e18;
  const capitalPercentage = capital > 0 ? (capitalAtRisk / capital) * 100 : 0;
  
  // Mock reputation exposure calculation
  const reputationExposure = defaultedBacks * 10; // Each default reduces reputation
  const riskLevel = capitalPercentage > 50 ? 'high' : capitalPercentage > 25 ? 'medium' : 'low';

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-5" />
          Your Lender Position
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capital at Risk */}
        <div className="rounded-lg border border-border bg-secondary/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-card-foreground">Capital at Risk</span>
            {riskLevel === 'high' && (
              <Badge variant="rojo" className="gap-1">
                <AlertTriangle className="size-3" />
                High Risk
              </Badge>
            )}
            {riskLevel === 'medium' && (
              <Badge variant="amarillo" className="gap-1">
                <AlertTriangle className="size-3" />
                Medium Risk
              </Badge>
            )}
            {riskLevel === 'low' && (
              <Badge variant="verde" className="gap-1">
                Low Risk
              </Badge>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-card-foreground">{formatBalance(totalBacked)}</span>
            <span className="text-sm text-muted-foreground">tokens</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{capitalPercentage.toFixed(1)}% of your capital</span>
            <span>Available: {formatBalance(BigInt(Math.max(0, capital - capitalAtRisk) * 1e18))} tokens</span>
          </div>
        </div>

        {/* Reputation Exposure */}
        <div className="rounded-lg border border-border bg-secondary/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-card-foreground">Reputation Exposure</span>
            {reputationExposure > 0 && (
              <Badge variant="rojo" className="gap-1">
                <TrendingDown className="size-3" />
                {reputationExposure} pts at risk
              </Badge>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-card-foreground">{reputation}</span>
            <span className="text-sm text-muted-foreground">current reputation</span>
          </div>
          {reputationExposure > 0 && (
            <div className="mt-2 text-xs text-slate-600">
              Potential loss: {reputationExposure} points if all defaults occur
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-600 mb-1">Active Backs</p>
            <p className="text-lg font-semibold text-slate-900">{activeBacks}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-1">Defaulted</p>
            <p className="text-lg font-semibold text-red-600">{defaultedBacks}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-1">Default Rate</p>
            <p className="text-lg font-semibold text-slate-900">
              {activeBacks + defaultedBacks > 0
                ? ((defaultedBacks / (activeBacks + defaultedBacks)) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Risk Warning */}
        {riskLevel !== 'low' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
            <AlertTriangle className="size-4 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-800">
              {riskLevel === 'high'
                ? 'High capital exposure detected. Consider diversifying your lending across multiple loans to reduce risk.'
                : 'Moderate capital exposure. Monitor your active loans regularly.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

