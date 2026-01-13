'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { TrendingUp, Users, DollarSign, ArrowRight } from 'lucide-react';
import { formatBalance, formatInterestRate } from '@/shared/utils/format';
import { useTypink } from 'typink';
import { useUserDeposits } from '@/features/pools/hooks/use-lending-pool-data';
import type { Pool } from '@/lib/types';

interface PoolCardProps {
  pool: Pool;
}

export function PoolCard({ pool }: PoolCardProps) {
  const { connectedAccount } = useTypink();
  const { data: userDeposits = 0n } = useUserDeposits(connectedAccount?.address);

  const utilizationRate = pool.totalLiquidity > 0n
    ? Number((pool.totalLiquidity - pool.availableLiquidity) * BigInt(100) / pool.totalLiquidity)
    : 0;

  const getStatusBadge = () => {
    switch (pool.status) {
      case 'active':
        return <Badge variant="verde">Active</Badge>;
      case 'paused':
        return <Badge variant="amarillo">Paused</Badge>;
      case 'closed':
        return <Badge variant="rojo">Closed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{pool.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{pool.description}</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="size-4" />
              <span className="text-xs">Interest Rate</span>
            </div>
            <p className="text-lg font-semibold text-card-foreground">{formatInterestRate(pool.baseInterestRate)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="size-4" />
              <span className="text-xs">Available</span>
            </div>
            <p className="text-lg font-semibold text-card-foreground">{formatBalance(userDeposits, 10)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="size-4" />
              <span className="text-xs">Min Lenders</span>
            </div>
            <p className="text-lg font-semibold text-card-foreground">{pool.minLenders}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <span className="text-xs">Utilization</span>
            </div>
            <p className="text-lg font-semibold text-card-foreground">{utilizationRate}%</p>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Loans</span>
            <span className="font-medium text-card-foreground">{pool.activeLoans}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="primary" className="w-full gap-2">
          <Link href={`/pools/${pool.poolId}`}>
            View Details
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

