'use client';

import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Search,
  Plus,
  Github,
} from 'lucide-react';
import { useUIStore } from '@/lib/stores/ui-store';

export function DashboardHeader() {
  const { setSearchQuery } = useUIStore();

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Github className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CodeSentinel
            </span>
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search repositories..."
              className="pl-10"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Actions */}
          <Button size="sm" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Scan</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm">
            <Bell className="w-4 h-4" />
          </Button>

          {/* User Menu */}
          <UserButton
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
  );
}
