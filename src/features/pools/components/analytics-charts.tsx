'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

interface AnalyticsChartsProps {
  isLoading?: boolean;
}

const COLORS = ['#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];

export function AnalyticsCharts({ isLoading = false }: AnalyticsChartsProps) {
  // Mock chart data
  const liquidityData = [
    { month: 'Jan', total: 800, available: 600 },
    { month: 'Feb', total: 950, available: 700 },
    { month: 'Mar', total: 1100, available: 800 },
    { month: 'Apr', total: 1200, available: 750 },
    { month: 'May', total: 1300, available: 900 },
    { month: 'Jun', total: 1500, available: 1000 },
  ];

  const loanVolumeData = [
    { month: 'Jan', amount: 120 },
    { month: 'Feb', amount: 180 },
    { month: 'Mar', amount: 150 },
    { month: 'Apr', amount: 220 },
    { month: 'May', amount: 200 },
    { month: 'Jun', amount: 250 },
  ];

  const loanStatusData = [
    { name: 'Completed', value: 45, color: COLORS[0] },
    { name: 'Active', value: 12, color: COLORS[1] },
    { name: 'Defaulted', value: 3, color: COLORS[2] },
    { name: 'Funding', value: 5, color: COLORS[3] },
  ];

  const repaymentData = [
    { month: 'Jan', repaid: 80, expected: 100 },
    { month: 'Feb', repaid: 95, expected: 110 },
    { month: 'Mar', repaid: 110, expected: 120 },
    { month: 'Apr', repaid: 105, expected: 125 },
    { month: 'May', repaid: 130, expected: 140 },
    { month: 'Jun', repaid: 145, expected: 150 },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="size-5" />
            Liquidity Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={liquidityData}>
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
              <Area
                type="monotone"
                dataKey="total"
                stroke="#475569"
                fill="#475569"
                fillOpacity={0.3}
                name="Total"
              />
              <Area
                type="monotone"
                dataKey="available"
                stroke="#64748b"
                fill="#64748b"
                fillOpacity={0.2}
                name="Available"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Loan Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={loanVolumeData}>
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
              <Bar dataKey="amount" fill="#475569" radius={[4, 4, 0, 0]} name="Loans" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loan Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={loanStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repayment Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={repaymentData}>
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
              <Line
                type="monotone"
                dataKey="repaid"
                stroke="#475569"
                strokeWidth={2}
                dot={{ fill: '#475569', r: 4 }}
                name="Repaid"
              />
              <Line
                type="monotone"
                dataKey="expected"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#94a3b8', r: 4 }}
                name="Expected"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

