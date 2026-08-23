import { Metadata } from 'next';
import { CouponClient } from '@/components/admin/CouponClient';

export const metadata: Metadata = {
  title: 'Coupons Management | Admin | Occasia',
  description: 'Manage discount coupons for Occasia',
};

export default function CouponsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
        <p className="text-muted-foreground">Create and manage discount coupons for customers.</p>
      </div>
      
      <CouponClient />
    </div>
  );
}
