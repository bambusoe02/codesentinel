'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Search,
  Plus,
  Github,
  User,
  Menu,
  X,
} from 'lucide-react';
import { useUIStore } from '@/lib/stores/ui-store';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DashboardNav } from './dashboard-nav';

// Check if Clerk is available at runtime
let isClerkAvailable = false;
if (typeof window !== 'undefined') {
  // Client-side check
  try {
    isClerkAvailable = !!((window as unknown as { Clerk?: unknown }).Clerk);
  } catch {
    isClerkAvailable = false;
  }
}

// Conditionally load UserButton only if Clerk is configured
const UserButtonComponent = isClerkAvailable
  ? dynamic(() => import('@clerk/nextjs').then(mod => ({ default: mod.UserButton })), {
      ssr: false,
      loading: () => <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
    })
  : () => <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full">
      <User className="w-4 h-4" />
    </Button>;

interface DashboardHeaderProps {
  isClerkAvailable?: boolean;
}

export function DashboardHeader({}: DashboardHeaderProps = {}) {
  const { setSearchQuery, isMobileNavOpen, setMobileNav } = useUIStore();

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileNav(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Github className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CodeSentinel
              </span>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                Beta
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search - Hidden on mobile, visible on tablet+ */}
            <div className="relative hidden md:block w-48 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search repositories..."
                className="pl-10"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Search Icon on Mobile */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Search className="w-4 h-4" />
            </Button>

            {/* Actions - Hide text on mobile */}
            <Button size="sm" className="hidden sm:flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Scan</span>
            </Button>
            <Button size="sm" className="sm:hidden">
              <Plus className="w-4 h-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>

            {/* User Menu */}
            <UserButtonComponent
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <Dialog open={isMobileNavOpen} onOpenChange={setMobileNav}>
        <DialogContent
          className="fixed left-0 top-0 h-full w-64 translate-x-0 translate-y-0 rounded-none border-l-0 border-t-0 border-b-0 border-r p-0 sm:max-w-lg max-w-[80vw] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
          showCloseButton={false}
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-4">
            <span className="text-lg font-semibold">Menu</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileNav(false)}
              className="sm:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-73px)]">
            <DashboardNav
              onNavigate={() => setMobileNav(false)}
              className="border-0 w-full h-auto"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
