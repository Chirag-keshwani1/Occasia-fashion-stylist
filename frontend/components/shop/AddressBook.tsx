'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, Address } from '@/lib/services/user.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AddressBook() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Address>>({
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
  });

  const { data: addressesData, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userService.getAddresses(),
  });

  const addresses = addressesData?.data?.data?.addresses || [];

  const addMutation = useMutation({
    mutationFn: (newAddress: Address) => userService.addAddress(newAddress),
    onSuccess: () => {
      toast.success('Address added successfully');
      setIsAdding(false);
      setFormData({
        fullName: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        phone: '',
      });
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err: Error | { response?: { data?: { message?: string } } }) => {
      // @ts-expect-error err shape is from axios
      toast.error(err.response?.data?.message || 'Failed to add address');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteAddress(id),
    onSuccess: () => {
      toast.success('Address removed');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: () => {
      toast.error('Failed to remove address');
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => userService.setDefaultAddress(id),
    onSuccess: () => {
      toast.success('Default address updated');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: () => {
      toast.error('Failed to update default address');
    }
  });

  const handleSave = () => {
    if (!formData.fullName || !formData.line1 || !formData.city || !formData.state || !formData.postalCode || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    addMutation.mutate(formData as Address);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Address Book</CardTitle>
          <CardDescription>Manage your shipping addresses for quicker checkout.</CardDescription>
        </div>
        {!isAdding && addresses.length < 5 && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : addresses.length === 0 ? (
          <p className="text-muted-foreground bg-muted/20 p-6 rounded-xl text-center">No addresses saved.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address: Address) => (
              <div 
                key={address._id} 
                className={cn(
                  "border rounded-xl p-4 relative flex flex-col gap-2 transition-colors",
                  address.isDefault ? "border-primary/50 bg-primary/5" : "hover:border-muted-foreground/30"
                )}
              >
                {address.isDefault && (
                  <span className="absolute top-4 right-4 text-xs font-semibold text-primary flex items-center gap-1 bg-background px-2 py-1 rounded-md shadow-sm border border-primary/20">
                    <CheckCircle2 className="h-3 w-3" /> Default
                  </span>
                )}
                <div className="flex items-start gap-3 mt-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">{address.fullName}</p>
                    <p className="text-sm text-muted-foreground mt-1">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                    <p className="text-sm text-muted-foreground">{address.city}, {address.state} {address.postalCode}</p>
                    <p className="text-sm text-muted-foreground">{address.country}</p>
                    <p className="text-sm mt-2">Phone: {address.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  {!address.isDefault && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setDefaultMutation.mutate(address._id!)}
                      disabled={setDefaultMutation.isPending}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                    onClick={() => deleteMutation.mutate(address._id!)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAdding && (
          <div className="border rounded-xl p-6 bg-muted/20">
            <h3 className="font-semibold mb-4">Add New Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Street Address (Line 1)</Label>
                <Input value={formData.line1} onChange={(e) => setFormData({...formData, line1: e.target.value})} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Apartment/Unit (Line 2) - Optional</Label>
                <Input value={formData.line2} onChange={(e) => setFormData({...formData, line2: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>PIN Code / Zip</Label>
                <Input value={formData.postalCode} onChange={(e) => setFormData({...formData, postalCode: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Address
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
