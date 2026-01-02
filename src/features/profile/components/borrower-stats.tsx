'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingDown } from 'lucide-react';
import type { ProfileStats } from '@/services/mock/profile.mock';

interface BorrowerStatsProps {
  stats: ProfileStats | undefined;
  isLoading: boolean;
}

const COLORS = ['#475569', '#64748b', '#94a3b8', '#cbd5e1'];

export function BorrowerStats({ stats, isLoading }: BorrowerStatsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-600">
          No borrower statistics available
        </CardContent>
      </Card>
    );
  }

  // Mock chart data
  const loanStatusData = [
    { name: 'Completed', value: stats.completedLoans, color: COLORS[0] },
    { name: 'Active', value: stats.activeLoans, color: COLORS[1] },
    { name: 'Defaulted', value: stats.defaultedLoans, color: COLORS[2] },
  ].filter((item) => item.value > 0);

  const monthlyData = [
    { month: 'Jan', amount: 5000 },
    { month: 'Feb', amount: 8000 },
    { month: 'Mar', amount: 3000 },
    { month: 'Apr', amount: 12000 },
    { month: 'May', amount: 7000 },
    { month: 'Jun', amount: 10000 },
  ];

  const formatBalance = (balance: bigint) => {
    const tokens = Number(balance) / 1e18;
    return tokens.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="size-5" />
            Borrower Statistics
          </CardTitle>
          <CardDescription>Your borrowing activity and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Borrowed</p>
              <p className="text-2xl font-bold text-card-foreground">{formatBalance(stats.totalBorrowed)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Loans</p>
              <p className="text-2xl font-bold text-card-foreground">{stats.totalLoans}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">On-Time Rate</p>
              <p className="text-2xl font-bold text-card-foreground">{stats.onTimePaymentRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Loan</p>
              <p className="text-2xl font-bold text-card-foreground">{formatBalance(stats.averageLoanAmount)}</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Loan Status Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={loanStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {loanStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Monthly Borrowing Activity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="amount" fill="#475569" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

