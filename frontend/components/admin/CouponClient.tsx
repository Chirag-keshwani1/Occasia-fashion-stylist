'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/lib/services/admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Plus, PowerOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function CouponClient() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    type: 'percentage',
    validUntil: '',
    usageLimit: '',
    minCartValue: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['adminCoupons'],
    queryFn: () => adminService.getCoupons(),
  });

  const coupons = data?.data?.coupons || [];

  const createMutation = useMutation({
    mutationFn: (newCoupon: { code: string, type: 'percentage' | 'fixed', discount: number, minPurchase: number, validUntil: string, usageLimit?: number, isActive: boolean }) => adminService.createCoupon(newCoupon),
    onSuccess: () => {
      toast.success('Coupon created successfully');
      setIsOpen(false);
      setFormData({
        code: '',
        discount: '',
        type: 'percentage',
        validUntil: '',
        usageLimit: '',
        minCartValue: '',
      });
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
    },
    onError: (error: Error | { response?: { data?: { message?: string } } }) => {
      // @ts-expect-error err shape is from axios
      toast.error(error.response?.data?.message || 'Failed to create coupon');
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminService.deactivateCoupon(id),
    onSuccess: () => {
      toast.success('Coupon deactivated');
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
    },
    onError: () => {
      toast.error('Failed to deactivate coupon');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discount || !formData.validUntil) {
      toast.error('Please fill required fields');
      return;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      code: formData.code.toUpperCase(),
      value: Number(formData.discount),
      type: formData.type,
      expiresAt: new Date(formData.validUntil).toISOString(),
    };
    
    if (formData.usageLimit) payload.usageLimit = Number(formData.usageLimit);
    if (formData.minCartValue) payload.minCartValue = Number(formData.minCartValue);

    createMutation.mutate(payload);
  };

  return (
    <Card>
      <div className="p-6 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold">Active & Expired Coupons</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" /> Create Coupon
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Coupon Code</Label>
                <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} placeholder="e.g. SUMMER20" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={formData.type} onValueChange={(value: string | null) => setFormData({...formData, type: (value || 'percentage') as 'percentage' | 'fixed'})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <Input type="number" value={formData.discount} onChange={(e) => setFormData({...formData, discount: e.target.value})} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input type="datetime-local" value={formData.validUntil} onChange={(e) => setFormData({...formData, validUntil: e.target.value})} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Usage Limit (Optional)</Label>
                  <Input type="number" value={formData.usageLimit} onChange={(e) => setFormData({...formData, usageLimit: e.target.value})} placeholder="Unlimited" />
                </div>
                <div className="space-y-2">
                  <Label>Min Cart Value (Optional)</Label>
                  <Input type="number" value={formData.minCartValue} onChange={(e) => setFormData({...formData, minCartValue: e.target.value})} placeholder="0" />
                </div>
              </div>

              <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Coupon
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No coupons found.
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon: { _id: string, code: string, type: string, value: number, minCartValue: number, expiresAt: string, isActive: boolean, usageLimit?: number, timesUsed: number }) => {
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                  const isExhausted = coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit;
                  const isActive = coupon.isActive && !isExpired && !isExhausted;

                  return (
                    <TableRow key={coupon._id}>
                      <TableCell className="font-medium uppercase">{coupon.code}</TableCell>
                      <TableCell>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                      </TableCell>
                      <TableCell>
                        {isActive ? (
                          <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs font-medium">Active</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded text-xs font-medium">
                            {!coupon.isActive ? 'Inactive' : isExpired ? 'Expired' : 'Exhausted'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {coupon.timesUsed} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : 'used'}
                      </TableCell>
                      <TableCell>
                        {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        {coupon.isActive && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deactivateMutation.mutate(coupon._id)}
                            disabled={deactivateMutation.isPending}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <PowerOff className="h-4 w-4 mr-2" /> Deactivate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
