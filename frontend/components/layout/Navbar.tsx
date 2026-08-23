'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/lib/services/auth.service';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserCircle, Heart, LogOut, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      logout();
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 py-0' 
          : 'bg-transparent border-transparent py-2'
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold text-xl tracking-tight">OCCASIA</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="flex items-center text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/shop" className="flex items-center text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Discover / Shop
            </Link>
            <Link href="/chat" className="flex items-center text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              AI Stylist
            </Link>
            <Link href="/outfits" className="flex items-center text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Outfit Generator
            </Link>
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {isAuthenticated && (
              <Link href="/wishlist">
                <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-foreground">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-8 w-8 rounded-full flex items-center justify-center hover:bg-accent hover:text-accent-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <UserCircle className="h-6 w-6" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === 'admin' && (
                    <Link href="/admin" className="cursor-pointer">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <Link href="/profile" className="cursor-pointer">
                    <DropdownMenuItem>
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="hidden sm:inline-flex">Log In</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
