'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/lib/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, ShoppingBag, Package } from 'lucide-react';

export function DashboardMetrics() {
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => adminService.getOverview()
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded mb-2"></div>
              <div className="h-3 w-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !response?.data) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-center">
        Failed to load dashboard metrics.
      </div>
    );
  }

  const stats = response.data;

  const cards = [
    {
      title: 'Total Revenue',
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalRevenue),
      icon: DollarSign,
      trend: stats.revenueGrowth,
      desc: 'from last month'
    },
    {
      title: 'Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      trend: stats.orderGrowth,
      desc: 'from last month'
    },
    {
      title: 'Products',
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      trend: 0,
      desc: 'active in store'
    },
    {
      title: 'Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      trend: stats.userGrowth,
      desc: 'from last month'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Card key={idx}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {card.trend !== 0 && (
                <span className={card.trend > 0 ? "text-emerald-500" : "text-destructive"}>
                  {card.trend > 0 ? '+' : ''}{card.trend}%
                </span>
              )}
              {card.desc}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
