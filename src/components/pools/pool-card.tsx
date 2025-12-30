'use client';

import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, DollarSign, ArrowRight } from 'lucide-react';
import { formatBalance, formatInterestRate } from '@/utils/format';
import type { Pool } from '@/services/mock/pools.mock';

interface PoolCardProps {
  pool: Pool;
}

export function PoolCard({ pool }: PoolCardProps) {

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
            <p className="text-lg font-semibold text-card-foreground">{formatBalance(pool.availableLiquidity)}</p>
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
            <span className="text-muted-foreground">Total Liquidity</span>
            <span className="font-medium text-card-foreground">{formatBalance(pool.totalLiquidity)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Active Loans</span>
            <span className="font-medium text-card-foreground">{pool.activeLoans}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="primary" className="w-full gap-2">
          <Link to={`/pools/${pool.poolId}`}>
            View Details
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

