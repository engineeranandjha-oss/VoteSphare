'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Building2,
  Sparkles,
  CreditCard,
  Award,
  Shield,
  Sliders,
  ArrowLeft,
  Vote,
  IdCard,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import UserAvatarMenu from '@/components/auth/UserAvatarMenu';

const navItems = [
  {
    name: 'Overview',
    href: '/profile',
    icon: User,
    exact: true,
  },
  {
    name: 'Personal Info',
    href: '/profile/personal',
    icon: IdCard,
    exact: false,
  },
  {
    name: 'My Organizations',
    href: '/profile/organizations',
    icon: Building2,
    exact: false,
  },
  {
    name: 'Workspace Plan',
    href: '/profile/subscription',
    icon: Sparkles,
    exact: false,
  },
  {
    name: 'Billing & Invoices',
    href: '/profile/billing',
    icon: CreditCard,
    exact: false,
  },
  {
    name: 'Certificates & Awards',
    href: '/profile/certificates',
    icon: Award,
    exact: false,
  },
  {
    name: 'Account Security',
    href: '/profile/security',
    icon: Shield,
    exact: false,
  },
  {
    name: 'Preferences',
    href: '/profile/preferences',
    icon: Sliders,
    exact: false,
  },
];

export default function ProfileLayout({ children }) {
  const pathname = usePathname();
  const { user, dbUser } = useAuth();

  const displayName = dbUser?.displayName || dbUser?.name || user?.userMetadata?.full_name || 'Member';
  const email = dbUser?.email || user?.email || '';
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isNavActive = (item) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-white font-black text-lg tracking-tight hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Vote className="w-4 h-4" />
              </div>
              <span>VoteSphere</span>
            </Link>

            <span className="hidden sm:inline-block text-slate-700">/</span>

            <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">
              Account Workspace & Profile
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>

            <UserAvatarMenu />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Navigation Sidebar */}
          <aside className="w-full lg:w-64 shrink-0 space-y-4">
            {/* User Identity Mini Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                {dbUser?.image ? (
                  <img
                    src={dbUser.image}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-white truncate">{displayName}</div>
                <div className="text-xs text-slate-400 truncate">{email}</div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="rounded-2xl bg-slate-900/90 border border-slate-800/80 p-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Institutional Ledger Badge */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/40 to-slate-900/90 border border-slate-800/60 text-center">
              <div className="text-[11px] font-bold text-slate-300">Constitutional Anonymity</div>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Profile identity is cryptographically separated from anonymous ballot records.
              </p>
            </div>
          </aside>

          {/* Right Subpage Content Area */}
          <main className="flex-1 min-w-0 w-full">{children}</main>
        </div>
      </div>
    </div>
  );
}

