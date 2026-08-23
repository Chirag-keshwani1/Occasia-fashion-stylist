'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { authService } from '@/lib/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      if (!supabase) {
        toast.error('Supabase is not configured.');
        router.push('/login');
        return;
      }

      try {
        // Get the session created by Supabase redirect
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session?.access_token) {
          // Sync with our backend
          const res = await authService.supabaseSync(session.access_token);
          
          if (mounted && res.data?.user) {
            // Set our native JWT session
            setAuth(res.data.user, res.data.accessToken || null);
            
            // Clear the Supabase session locally to prevent state drift,
            // since our backend is the source of truth from now on.
            await supabase.auth.signOut();
            
            toast.success('Logged in successfully!');
            router.push('/');
            router.refresh();
          }
        } else {
          // No session found, maybe user just loaded the page directly
          if (mounted) router.push('/login');
        }
      } catch (error: unknown) {
        console.error('Supabase sync error:', error);
        
        let errorMessage = 'Authentication failed.';
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { message?: string } } };
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message;
          }
        }
        
        toast.error(errorMessage);
        if (mounted) router.push('/login');
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [router, setAuth]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
