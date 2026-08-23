'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (!isAuthenticated) {
        // Redirect to login, saving the attempted URL
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (adminOnly && user?.role !== 'admin') {
        // Redirect to home if not admin
        router.push('/');
      }
    }
  }, [isMounted, isAuthenticated, router, adminOnly, user, pathname]);

  // Show nothing while checking auth status to prevent hydration mismatch or flashing
  if (!isMounted || !isAuthenticated || (adminOnly && user?.role !== 'admin')) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
