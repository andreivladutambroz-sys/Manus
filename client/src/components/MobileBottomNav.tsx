import React from 'react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  Home,
  Wrench,
  BarChart3,
  Settings,
  Plus,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

export function MobileBottomNav() {
  const [location, navigate] = useLocation();

  const navItems: NavItem[] = [
    {
      label: 'Home',
      icon: <Home className="h-6 w-6" />,
      href: '/',
    },
    {
      label: 'Diagnostic',
      icon: <Wrench className="h-6 w-6" />,
      href: '/diagnostic/new',
    },
    {
      label: 'New',
      icon: <Plus className="h-6 w-6" />,
      href: '/diagnostic/new',
    },
    {
      label: 'Dashboard',
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/dashboard',
    },
    {
      label: 'Settings',
      icon: <Settings className="h-6 w-6" />,
      href: '/profile',
    },
  ];

  const isActive = (href: string) => {
    return location === href || location.startsWith(href + '/');
  };

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                'flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors relative',
                isActive(item.href)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.label}
            >
              {item.icon}
              {item.badge !== undefined && (
                <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Spacer for mobile to prevent content overlap */}
      <div className="h-16 md:hidden" />
    </>
  );
}
