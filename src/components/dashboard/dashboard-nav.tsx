'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Settings,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

interface DashboardNavProps {
  onNavigate?: () => void;
  className?: string;
}

export function DashboardNav({ onNavigate, className }: DashboardNavProps) {
  const pathname = usePathname();

  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <nav className={cn("w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 h-full", className)}>
      <div className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleClick}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h3 className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Quick Actions
        </h3>
        <div className="space-y-1">
        </div>
      </div>
    </nav>
  );
}
