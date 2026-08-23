'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut 
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Users', href: '/admin/users', icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <aside className="w-full md:w-64 bg-card border-r h-full min-h-screen flex flex-col hidden md:flex">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold tracking-tight">Admin Panel</h2>
        <p className="text-sm text-muted-foreground mt-1">Occasia</p>
      </div>
      
      <div className="flex-1 py-6 flex flex-col gap-2 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t">
        <button 
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
