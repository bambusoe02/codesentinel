'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Code,
  Github,
  Home,
  Search,
  Settings,
  FileText,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Repositories',
    href: '/dashboard/repositories',
    icon: Github,
  },
  {
    name: 'Analysis',
    href: '/dashboard/analysis',
    icon: BarChart3,
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
  },
  {
    name: 'Search',
    href: '/dashboard/search',
    icon: Search,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4">
      <div className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
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
          <Link
            href="/dashboard/scan"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Code className="w-4 h-4" />
            <span>New Analysis</span>
          </Link>
          <Link
            href="/dashboard/connect"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>Connect GitHub</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
