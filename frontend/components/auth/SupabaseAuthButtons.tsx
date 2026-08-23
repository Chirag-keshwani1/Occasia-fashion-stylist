'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function SupabaseAuthButtons() {
  const [email, setEmail] = useState('');
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!supabase) {
    return null; // Don't render buttons if Supabase isn't configured
  }

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    try {
      setIsGoogleLoading(true);
      
      // Pre-flight check: If the Supabase project is paused, the DNS will fail.
      // This prevents the browser from redirecting to a "Site can't be reached" error page.
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        try {
          // A short timeout fetch to check if the domain resolves
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          await fetch(`${supabaseUrl}/auth/v1/health`, { 
            method: 'GET',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
        } catch (err) {
          toast.error('Supabase project is currently paused or unreachable. Please restore your project in the Supabase Dashboard.');
          return;
        }
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirect to the frontend callback page
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch {
      toast.error('An error occurred during Google sign in.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!email) {
      toast.error('Please enter an email for the magic link.');
      return;
    }

    try {
      setIsMagicLinkLoading(true);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          await fetch(`${supabaseUrl}/auth/v1/health`, { method: 'GET', signal: controller.signal });
          clearTimeout(timeoutId);
        } catch (err) {
          toast.error('Supabase project is currently paused or unreachable. Please restore your project in the Supabase Dashboard.');
          return;
        }
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Check your email for the magic link!');
        setEmail('');
      }
    } catch {
      toast.error('An error occurred while sending the magic link.');
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isMagicLinkLoading}
      >
        {isGoogleLoading ? 'Redirecting...' : 'Continue with Google'}
      </Button>

      <form onSubmit={handleMagicLinkLogin} className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Email for Magic Link"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isGoogleLoading || isMagicLinkLoading}
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={isGoogleLoading || isMagicLinkLoading}
          >
            {isMagicLinkLoading ? 'Sending...' : 'Send Link'}
          </Button>
        </div>
      </form>
    </div>
  );
}
