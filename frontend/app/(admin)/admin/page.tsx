import { DashboardMetrics } from '@/components/admin/DashboardMetrics';
import { RevenueChart } from '@/components/admin/RevenueChart';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to the admin dashboard. Here is your store&apos;s overview.
        </p>
      </div>
      
      <DashboardMetrics />
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-4 mt-6">
        <RevenueChart />
        {/* Placeholder for future side panel (e.g., top products or recent orders) */}
        <div className="col-span-1 rounded-xl border bg-card text-card-foreground shadow p-6 flex items-center justify-center text-muted-foreground text-sm">
          More insights coming soon
        </div>
      </div>
    </div>
  );
}
