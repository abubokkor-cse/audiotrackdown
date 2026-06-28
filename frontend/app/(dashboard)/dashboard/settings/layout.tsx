'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Activity, Menu, X, ChevronRight } from 'lucide-react';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: '/dashboard/settings', icon: Settings, label: 'General' },
    { href: '/dashboard/settings/activity', icon: Activity, label: 'Activity' },
    { href: '/dashboard/settings/security', icon: Shield, label: 'Security' }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-gray-900">Settings</span>
        </div>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-white lg:bg-gray-50/50 border-r border-gray-200 lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="h-full overflow-y-auto p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 pb-2 pt-1">
              Account Settings
            </p>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} passHref>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={`shadow-none w-full justify-start rounded-xl h-10 transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className={`h-4 w-4 mr-2.5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400 ml-auto" />
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-0 lg:p-4">{children}</main>
      </div>
    </div>
  );
}
