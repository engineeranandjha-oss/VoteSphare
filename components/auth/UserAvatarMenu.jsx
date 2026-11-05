'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Vote,
  PlusCircle,
  LogOut,
  ChevronDown,
  Loader2,
  Shield,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { startGlobalProgress, completeGlobalProgress } from '@/components/common/GlobalProgressProvider';

export default function UserAvatarMenu() {
  const { user, dbUser, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef(null);

  const displayName =
    dbUser?.name ||
    user?.userMetadata?.full_name ||
    user?.userMetadata?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Member';

  const displayEmail = dbUser?.email || user?.email || 'user@votesphere.org';

  // Comprehensive avatar resolution across dbUser and Supabase user metadata
  const avatarUrl =
    dbUser?.image ||
    user?.image ||
    user?.userMetadata?.avatar_url ||
    user?.userMetadata?.picture ||
    user?.userMetadata?.avatar ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.avatar ||
    null;

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(displayName);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSignOutClick = async () => {
    try {
      setSigningOut(true);
      startGlobalProgress();
      await signOut();
    } finally {
      setSigningOut(false);
      completeGlobalProgress();
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Trigger Button */}
      <button
        type="button"
        id="user-avatar-button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full p-1 transition-all hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-primary/40 border border-slate-700/60"
        aria-expanded={open}
        aria-label="User navigation menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-md overflow-hidden shrink-0">
          {avatarUrl && !imageError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            initials
          )}
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 z-50">
          {/* User Profile Header */}
          <div className="border-b border-slate-800/80 px-3 py-3 mb-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-inner overflow-hidden shrink-0 border border-blue-400/30">
                {avatarUrl && !imageError ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white truncate">{displayName}</span>
                  <span className="flex items-center gap-0.5 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20 shrink-0">
                    <Shield className="h-2.5 w-2.5" />
                    Verified
                  </span>
                </div>
                <div className="text-xs text-slate-400 truncate mt-0.5">{displayEmail}</div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-0.5">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-blue-400" />
              <span>Workspace Dashboard</span>
            </Link>

            <Link
              href="/voter"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
            >
              <Vote className="h-4 w-4 text-emerald-400" />
              <span>Voter Ballot Hub</span>
            </Link>

            <Link
              href="/onboarding"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
            >
              <PlusCircle className="h-4 w-4 text-purple-400" />
              <span>Create Organization</span>
            </Link>

            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Account & Security</span>
            </Link>
          </div>

          {/* Divider & Sign Out */}
          <div className="mt-1 border-t border-slate-800/80 pt-1">
            <button
              type="button"
              id="sign-out-button"
              onClick={handleSignOutClick}
              disabled={signingOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors disabled:opacity-50"
            >
              {signingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
