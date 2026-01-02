'use client';

import { Card, CardContent } from '@/shared/ui/card';
import { TrendingUp, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatBalance } from '@/shared/utils/format';
import type { Profile, ProfileStats } from '@/services/mock/profile.mock';
import { Skeleton } from '@/shared/ui/skeleton';

interface DashboardKpisProps {
  profile: Profile | null | undefined;
  stats: ProfileStats | null | undefined;
  isLoading: boolean;
  activeLoansCount: number;
}

export function DashboardKpis({ profile, stats, isLoading, activeLoansCount }: DashboardKpisProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!profile || !stats) {
    return null;
  }

  const kpis = [
    {
      title: 'Total Borrowed',
      value: formatBalance(stats.totalBorrowed),
      icon: ArrowDownRight,
      description: `${stats.activeLoans} active loans`,
      trend: stats.totalBorrowed > 0n ? 'up' : 'neutral',
    },
    {
      title: 'Total Lent',
      value: formatBalance(stats.totalLent),
      icon: ArrowUpRight,
      description: `${stats.completedLoans} completed`,
      trend: stats.totalLent > 0n ? 'up' : 'neutral',
    },
    {
      title: 'Active Loans',
      value: activeLoansCount.toString(),
      icon: FileText,
      description: `${stats.completedLoans} completed`,
      trend: 'neutral',
    },
    {
      title: 'Success Rate',
      value: stats.totalLoans > 0 
        ? `${((stats.completedLoans / stats.totalLoans) * 100).toFixed(1)}%`
        : '0%',
      icon: TrendingUp,
      description: `${stats.completedLoans} of ${stats.totalLoans} loans`,
      trend: stats.totalLoans > 0 && (stats.completedLoans / stats.totalLoans) > 0.8 ? 'up' : 'neutral',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Icon className="size-4" />
                    <span className="text-sm font-medium">{kpi.title}</span>
                  </div>
                  <p className="text-2xl font-bold text-card-foreground">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
