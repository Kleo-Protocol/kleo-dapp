'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { ProfileStats } from '@/services/mock/profile.mock';

interface LenderStatsProps {
  stats: ProfileStats | undefined;
  isLoading: boolean;
}

export function LenderStats({ stats, isLoading }: LenderStatsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-4 w-64 mt-2' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-64 w-full' />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className='py-8 text-center text-slate-600'>No lender statistics available</CardContent>
      </Card>
    );
  }

  // Mock chart data
  const portfolioValueData = [
    { month: 'Jan', value: 45000, returns: 2250 },
    { month: 'Feb', value: 52000, returns: 2600 },
    { month: 'Mar', value: 48000, returns: 2400 },
    { month: 'Apr', value: 55000, returns: 2750 },
    { month: 'May', value: 60000, returns: 3000 },
    { month: 'Jun', value: 65000, returns: 3250 },
  ];

  const returnsData = [
    { month: 'Jan', rate: 5.0 },
    { month: 'Feb', rate: 5.2 },
    { month: 'Mar', rate: 5.0 },
    { month: 'Apr', rate: 5.1 },
    { month: 'May', rate: 5.0 },
    { month: 'Jun', rate: 5.0 },
  ];

  const formatBalance = (balance: bigint) => {
    const tokens = Number(balance) / 1e18;
    return tokens.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const totalReturns = portfolioValueData.reduce((sum, item) => sum + item.returns, 0);
  const avgReturnRate = returnsData.reduce((sum, item) => sum + item.rate, 0) / returnsData.length;

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='size-5' />
            Lender Statistics
          </CardTitle>
          <CardDescription>Your lending portfolio and returns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6'>
            <div>
              <p className='text-sm text-muted-foreground'>Total Lent</p>
              <p className='text-2xl font-bold text-card-foreground'>{formatBalance(stats.totalLent)}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Active Loans</p>
              <p className='text-2xl font-bold text-card-foreground'>{stats.activeLoans}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Total Returns</p>
              <p className='text-2xl font-bold text-card-foreground'>{totalReturns.toLocaleString()}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Avg Return Rate</p>
              <p className='text-2xl font-bold text-card-foreground'>{avgReturnRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className='grid gap-6 sm:grid-cols-2'>
            <div>
              <h3 className='text-sm font-semibold text-card-foreground mb-4'>Portfolio Value & Returns</h3>
              <ResponsiveContainer width='100%' height={200}>
                <AreaChart data={portfolioValueData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                  <XAxis dataKey='month' stroke='#64748b' />
                  <YAxis stroke='#64748b' />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                    }}
                  />
                  <Area type='monotone' dataKey='value' stroke='#475569' fill='#475569' fillOpacity={0.2} />
                  <Area type='monotone' dataKey='returns' stroke='#64748b' fill='#64748b' fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className='text-sm font-semibold text-card-foreground mb-4'>Return Rate Trend</h3>
              <ResponsiveContainer width='100%' height={200}>
                <LineChart data={returnsData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                  <XAxis dataKey='month' stroke='#64748b' />
                  <YAxis stroke='#64748b' />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                    }}
                    formatter={(value: number | undefined) => (value !== undefined ? `${value}%` : '')}
                  />
                  <Line
                    type='monotone'
                    dataKey='rate'
                    stroke='#475569'
                    strokeWidth={2}
                    dot={{ fill: '#475569', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
