'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useCheckout';
import { ShippingAddress } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import { userService, Address } from '@/lib/services/user.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CheckoutClient() {
  const router = useRouter();
  const { cart, isLoading: isCartLoading, cartCount } = useCart();
  const { validateCoupon, placeOrder } = useCheckout();
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  const { data: addressesData, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userService.getAddresses(),
  });
  
  const rawAddresses = addressesData?.data?.data?.addresses;
  const addresses = React.useMemo(() => rawAddresses || [], [rawAddresses]);

  // Auto-select default address if available and form is empty
  React.useEffect(() => {
    if (addresses.length > 0 && !shippingAddress.fullName) {
      const defaultAddr = addresses.find((a: Address) => a.isDefault) || addresses[0];
      setTimeout(() => {
        setShippingAddress({
          fullName: defaultAddr.fullName,
          phone: defaultAddr.phone,
          line1: defaultAddr.line1,
          line2: defaultAddr.line2 || '',
          city: defaultAddr.city,
          state: defaultAddr.state,
          postalCode: defaultAddr.postalCode,
          country: defaultAddr.country,
        });
      }, 0);
    }
  }, [addresses, shippingAddress.fullName]);

  const handleAddressSelect = (addressId: string | null) => {
    if (!addressId) return;
    const selected = addresses.find((a: Address) => a._id === addressId);
    if (selected) {
      setShippingAddress({
        fullName: selected.fullName,
        phone: selected.phone,
        line1: selected.line1,
        line2: selected.line2 || '',
        city: selected.city,
        state: selected.state,
        postalCode: selected.postalCode,
        country: selected.country,
      });
    }
  };

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: string;
  } | null>(null);

  const finalTotal = React.useMemo(() => {
    if (!appliedCoupon) return cart.subtotal;
    if (appliedCoupon.type === 'flat') {
      return Math.max(0, cart.subtotal - appliedCoupon.discount);
    }
    if (appliedCoupon.type === 'percentage') {
      const discountAmount = (cart.subtotal * appliedCoupon.discount) / 100;
      return Math.max(0, cart.subtotal - discountAmount);
    }
    return cart.subtotal;
  }, [cart.subtotal, appliedCoupon]);

  if (isCartLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cartCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">You need items in your cart to checkout.</p>
        <Link href="/products">
          <Button size="lg" className="rounded-full px-8">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  // Validation
  const hasOutOfStockItems = cart.items.some(item => !item.inStock);
  const canCheckout = !hasOutOfStockItems && 
                      shippingAddress.fullName && 
                      shippingAddress.phone && 
                      shippingAddress.line1 && 
                      shippingAddress.city && 
                      shippingAddress.state && 
                      shippingAddress.postalCode && 
                      shippingAddress.country;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    
    validateCoupon.mutate(
      { code: couponCodeInput, cartTotal: cart.subtotal },
      {
        onSuccess: (data) => {
          setAppliedCoupon(data.data.coupon);
          setCouponCodeInput('');
        }
      }
    );
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCheckout) return;

    const idempotencyKey = crypto.randomUUID();
    
    placeOrder.mutate(
      {
        idempotencyKey,
        data: {
          couponCode: appliedCoupon?.code,
          shippingAddress
        }
      },
      {
        onSuccess: (response) => {
          router.push(`/checkout/success?orderId=${response.data.order._id}`);
        }
      }
    );
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Left Column - Forms */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">
        
        {/* Shipping Address */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Shipping Address</h2>
            {!isLoadingAddresses && addresses.length > 0 && (
              <Select onValueChange={handleAddressSelect}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select saved address" />
                </SelectTrigger>
                <SelectContent>
                  {addresses.map((addr: Address) => (
                    <SelectItem key={addr._id} value={addr._id!}>
                      {addr.fullName} - {addr.line1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <form id="checkout-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" value={shippingAddress.fullName} onChange={handleInputChange} required />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" value={shippingAddress.phone} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="line1">Address Line 1</Label>
              <Input id="line1" name="line1" value={shippingAddress.line1} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="line2">Address Line 2 (Optional)</Label>
              <Input id="line2" name="line2" value={shippingAddress.line2 || ''} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={shippingAddress.city} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <Input id="state" name="state" value={shippingAddress.state} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" name="postalCode" value={shippingAddress.postalCode} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" value={shippingAddress.country} onChange={handleInputChange} required />
            </div>
          </form>
        </section>
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:col-span-5 xl:col-span-4">
        <div className="bg-muted/30 border rounded-2xl p-6 sticky top-24">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>
          
          <div className="flex flex-col gap-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
            {cart.items.map(item => (
              <div key={`${item.productId}-${item.size}`} className="flex gap-4">
                <div className="relative h-20 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                  {item.product?.images?.[0] && (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="64px" />
                  )}
                </div>
                <div className="flex-1 text-sm flex flex-col justify-center">
                  <div className="font-medium line-clamp-1">{item.product?.name}</div>
                  <div className="text-muted-foreground flex justify-between mt-1">
                    <span>Size: {item.size} • Qty: {item.qty}</span>
                    <span className="font-medium text-foreground">{formatPrice(item.lineTotal)}</span>
                  </div>
                  {!item.inStock && (
                    <div className="text-destructive text-xs font-medium mt-1">Out of stock</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 mb-6 pt-6 border-t">
            {/* Coupon Code */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <Input 
                placeholder="Discount code" 
                value={couponCodeInput}
                onChange={e => setCouponCodeInput(e.target.value)}
                disabled={!!appliedCoupon || validateCoupon.isPending}
              />
              <Button 
                type="submit" 
                variant="secondary"
                disabled={!couponCodeInput.trim() || !!appliedCoupon || validateCoupon.isPending}
              >
                {validateCoupon.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
              </Button>
            </form>

            {appliedCoupon && (
              <div className="flex items-center justify-between bg-primary/10 text-primary px-3 py-2 rounded-md text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium uppercase">{appliedCoupon.code}</span>
                  <span className="opacity-80">applied</span>
                </div>
                <button 
                  onClick={handleRemoveCoupon}
                  className="hover:underline text-xs"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-6 border-t text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-primary font-medium">
                <span>Discount</span>
                <span>-{formatPrice(cart.subtotal - finalTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>Calculated at next step</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-4 border-t text-foreground">
              <span>Total</span>
              <span>{formatPrice(finalTotal)}</span>
            </div>
          </div>

          <Button 
            type="submit" 
            form="checkout-form"
            className="w-full mt-8 h-14 rounded-full text-lg font-bold"
            disabled={!canCheckout || placeOrder.isPending}
          >
            {placeOrder.isPending ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Processing...</>
            ) : (
              'Place Order'
            )}
          </Button>

          {hasOutOfStockItems && (
            <p className="text-destructive text-sm text-center mt-4">
              Please remove out of stock items before checking out.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
