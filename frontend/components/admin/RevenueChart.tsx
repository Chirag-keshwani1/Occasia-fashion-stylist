/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/lib/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export function RevenueChart() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['admin', 'revenue', period],
    queryFn: () => adminService.getRevenueSeries(period, 30)
  });

  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !response?.data?.series) {
    return (
      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-destructive">
          Failed to load revenue data.
        </CardContent>
      </Card>
    );
  }

  const data = response.data.series.map(item => ({
    name: new Date(item._id).toLocaleDateString('en-US', { 
      month: 'short', 
      day: period === 'month' ? undefined : 'numeric' 
    }),
    total: item.revenue
  })).reverse(); // Usually backend returns newest first, reverse for chart left-to-right

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Showing revenue over time</CardDescription>
        </div>
        <div className="flex bg-muted rounded-lg p-1">
          {(['day', 'week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                period === p ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available for this period.
          </div>
        ) : (
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
