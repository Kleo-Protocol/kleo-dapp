'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/shared/ui/skeleton';
import { TrendingUp, DollarSign } from 'lucide-react';

interface ChartDataPoint {
  month: string;
  value: number;
  date: string;
}

interface PersonalChartsProps {
  reputationHistory: ChartDataPoint[];
  interestEarningsHistory: ChartDataPoint[];
  isLoading: boolean;
}

export function PersonalCharts({
  reputationHistory,
  interestEarningsHistory,
  isLoading,
}: PersonalChartsProps) {
  if (isLoading) {
    return (
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='border-amber-honey/20 bg-amber-honey/5 backdrop-blur-sm'>
          <CardHeader>
            <Skeleton className='h-6 w-48 mb-2' />
            <Skeleton className='h-4 w-32' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-64 w-full' />
          </CardContent>
        </Card>
        <Card className='border-forest-green/20 bg-forest-green/5 backdrop-blur-sm'>
          <CardHeader>
            <Skeleton className='h-6 w-48 mb-2' />
            <Skeleton className='h-4 w-32' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-64 w-full' />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate total interest earned
  const totalInterest = interestEarningsHistory.reduce((sum, point) => sum + point.value, 0);

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      {/* Reputation Timeline */}
      <Card className='border-amber-honey/20 bg-amber-honey/5 backdrop-blur-sm'>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5 text-amber-honey' />
            <div>
              <CardTitle className='font-sora text-lg font-semibold'>My Reputation Timeline</CardTitle>
              <CardDescription className='font-inter text-sm'>
                Evolution of your stars over the last 6 months
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={300}>
            <AreaChart data={reputationHistory}>
              <defs>
                <linearGradient id='colorStars' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#eca406' stopOpacity={0.3} />
                  <stop offset='95%' stopColor='#eca406' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' stroke='#374151' opacity={0.2} />
              <XAxis
                dataKey='month'
                stroke='#9ca3af'
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke='#9ca3af'
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: '1px solid rgba(156, 163, 175, 0.2)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(8px)',
                }}
                labelStyle={{ color: '#f3f4f6', fontWeight: 600 }}
              />
              <Area
                type='monotone'
                dataKey='value'
                stroke='#eca406'
                strokeWidth={2}
                fill='url(#colorStars)'
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Interest Earnings */}
      <Card className='border-forest-green/20 bg-forest-green/5 backdrop-blur-sm'>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5 text-forest-green' />
            <div>
              <CardTitle className='font-sora text-lg font-semibold'>My Interest Earnings</CardTitle>
              <CardDescription className='font-inter text-sm'>
                Interest earned over the last 6 months
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <p className='font-sora text-2xl font-bold text-foreground'>
              ${totalInterest.toFixed(2)}
            </p>
            <p className='font-inter text-xs text-muted-foreground mt-1'>
              Total accumulated
            </p>
          </div>
          <ResponsiveContainer width='100%' height={250}>
            <LineChart data={interestEarningsHistory}>
              <defs>
                <linearGradient id='colorInterest' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#10b981' stopOpacity={0.3} />
                  <stop offset='95%' stopColor='#10b981' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' stroke='#374151' opacity={0.2} />
              <XAxis
                dataKey='month'
                stroke='#9ca3af'
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke='#9ca3af'
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: '1px solid rgba(156, 163, 175, 0.2)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(8px)',
                }}
                labelStyle={{ color: '#f3f4f6', fontWeight: 600 }}
                formatter={(value?: number) => value !== undefined ? `$${value.toFixed(2)}` : ''}
              />
              <Line
                type='monotone'
                dataKey='value'
                stroke='#10b981'
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
