'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  ExternalLink,
  ArrowRight,
  Plus,
  ShieldCheck,
  UserCheck,
  Users,
  Loader2,
} from 'lucide-react';

export default function MyOrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const json = await res.json();
          setOrganizations(json.data?.userOrganizations || []);
        }
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };

    fetchOrgs();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading your organizations...</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              My Organizations & Workspaces
            </h2>
            <p className="text-xs text-slate-400">
              Manage your electoral associations, administrative roles, and public profiles
            </p>
          </div>
        </div>

        <Link
          href="/org/new"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-1.5 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>New Organization</span>
        </Link>
      </div>

      {/* Organizations List */}
      <div className="p-6">
        {organizations.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-3">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">No Organizations Found</h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              You haven&apos;t created or joined any organizations yet. Start by establishing a new
              electoral workspace or accept an invitation.
            </p>
            <div className="pt-2">
              <Link
                href="/org/new"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Workspace</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations.map((org) => {
              const isOwner = org.isOwner || org.userRole === 'owner';
              const isAdmin = org.userRole === 'admin';

              return (
                <div
                  key={org.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center font-bold text-slate-300 text-base shrink-0">
                        {org.logo ? (
                          <img
                            src={org.logo}
                            alt={org.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          org.name?.slice(0, 2).toUpperCase() || 'OG'
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white truncate">{org.name}</div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {org.type || 'Electoral Organization'}
                        </div>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isOwner
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : isAdmin
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {org.userRole || 'Member'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                    <Link
                      href={`/org/${org.slug || org.id}`}
                      target="_blank"
                      className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      <span>Public Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <Link
                      href={`/org/${org.id}/dashboard`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Launch Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

