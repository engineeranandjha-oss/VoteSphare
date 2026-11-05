'use client';

import Link from 'next/link';
import Logo from '@/components/common/Logo';
import { usePathname } from 'next/navigation';
import {
  Vote,
  Plus,
  Users,
  Calendar,
  Settings,
  LayoutDashboard,
  ExternalLink,
  CreditCard,
} from 'lucide-react';

export default function DashboardHeader({ org }) {
  const pathname = usePathname();
  const orgId = org?.id || '';
  const orgName = org?.name || 'Organization Workspace';
  const orgSlug = org?.slug || '';

  const canManage = org?.userRole === 'owner' || org?.userRole === 'admin';

  const navItems = [
    { label: 'Overview', href: `/org/${orgId}/dashboard`, icon: LayoutDashboard },
    { label: 'Elections', href: `/org/${orgId}/elections`, icon: Calendar },
    ...(canManage
      ? [
          { label: 'Members', href: `/org/${orgId}/members`, icon: Users },
          { label: 'Billing', href: `/org/${orgId}/billing`, icon: CreditCard },
          { label: 'Settings', href: `/org/${orgId}/settings`, icon: Settings },
        ]
      : []),
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 sticky top-0 z-40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tier: Organization Brand & Quick Actions */}
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/org/${orgId}/dashboard`} className="flex items-center gap-2.5 group">
              {org?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={org.logo}
                  alt={orgName}
                  className="w-9 h-9 rounded-xl object-contain bg-slate-900 border border-slate-800 shrink-0"
                />
              ) : (
                <Logo size={36} className="group-hover:scale-105 transition-transform shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black text-white truncate group-hover:text-blue-400 transition-colors">
                    {orgName}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider hidden sm:inline-block">
                    Workspace
                  </span>
                </div>
                {orgSlug && (
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    votesphere.com/org/{orgSlug}
                  </p>
                )}
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {orgSlug && (
              <a
                href={`/org/${orgSlug}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <span>Public Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            {canManage && (
              <Link
                href={`/org/${orgId}/elections/new`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Election</span>
                <span className="sm:hidden">New</span>
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Tier: Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 border-t border-slate-900">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
