'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import LandingFooter from '@/components/landing/LandingFooter';
import {
  Building2,
  Calendar,
  Vote,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  LayoutDashboard,
  Clock,
} from 'lucide-react';
import Image from 'next/image';

export default function PublicOrgPortalPage() {
  const { orgId } = useParams();
  const router = useRouter();

  const [org, setOrg] = useState(null);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orgId === 'dashboard') {
      router.replace('/dashboard');
    }
  }, [orgId, router]);

  const fetchPublicOrgData = useCallback(async () => {
    if (orgId === 'dashboard') return;
    try {
      setLoading(true);
      setError(null);

      const [orgRes, electionsRes] = await Promise.all([
        fetch(`/api/orgs/${orgId}`),
        fetch(`/api/orgs/${orgId}/elections?limit=50`),
      ]);

      const orgJson = await orgRes.json();
      const electionsJson = await electionsRes.json();

      if (!orgRes.ok) {
        throw new Error(orgJson.message || 'Organization not found');
      }

      setOrg(orgJson.data);
      setElections(electionsJson.data?.elections || electionsJson.data || []);
    } catch (err) {
      setError(err.message || 'Error loading organization portal');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchPublicOrgData();
  }, [fetchPublicOrgData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <PublicNavbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <div className="h-48 bg-slate-900 rounded-3xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-slate-900 rounded-3xl animate-pulse" />
            <div className="h-64 bg-slate-900 rounded-3xl animate-pulse" />
            <div className="h-64 bg-slate-900 rounded-3xl animate-pulse" />
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <PublicNavbar />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-3xl">
            🏛️
          </div>
          <h1 className="text-2xl font-black text-white">Organization Not Found</h1>
          <p className="text-sm text-slate-400">
            {error || 'The requested organization workspace or public portal does not exist or has been removed.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all"
            >
              Return Home
            </Link>
            <Link
              href="/join"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300 transition-all"
            >
              Join an Election
            </Link>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  const activeElections = elections.filter((e) => e.status === 'live');
  const upcomingElections = elections.filter((e) => e.status === 'scheduled' || e.status === 'draft');
  const pastElections = elections.filter((e) => e.status === 'ended' || e.status === 'published' || e.status === 'archived');

  const isMemberOrAdmin = Boolean(org.userRole);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Organization Hero Header */}
        <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-900/40 p-8 sm:p-12 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              {/* Logo / Badge */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-xl">
                {org.logo ? (
                  <Image
                    src={org.logo}
                    alt={org.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-blue-400" />
                )}
              </div>

              {/* Title & Badges */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {org.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified Organization
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="font-mono text-slate-300">votesphere.com/org/{org.slug || org.id}</span>
                  <span>•</span>
                  <span className="capitalize font-semibold text-blue-400">{org.type} Organization</span>
                  {org.memberCount !== undefined && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {org.memberCount} Members
                      </span>
                    </>
                  )}
                </div>

                {org.description && (
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl pt-1">
                    {org.description}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {isMemberOrAdmin && (
                <Link
                  href={`/org/${org.id}/dashboard`}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-xs text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Workspace Dashboard
                </Link>
              )}

              <Link
                href="/join"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Vote className="h-3.5 w-3.5 text-blue-400" />
                <span>Enter Ballot Code</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Section 1: Active Live Elections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              Live Ballots ({activeElections.length})
            </h2>
            <span className="text-xs text-slate-400">Open for voter participation</span>
          </div>

          {activeElections.length === 0 ? (
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 text-center space-y-2">
              <div className="text-2xl">🗳️</div>
              <p className="text-sm font-semibold text-slate-300">No active elections at this moment.</p>
              <p className="text-xs text-slate-500">Check back when new voting periods are scheduled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeElections.map((elec) => (
                <div
                  key={elec.id}
                  className="rounded-3xl border border-emerald-500/30 bg-slate-900/90 p-6 space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE NOW
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        {elec.endDate ? new Date(elec.endDate).toLocaleDateString() : 'Ongoing'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white line-clamp-2">{elec.title}</h3>
                    {elec.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">{elec.description}</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                    <Link
                      href={`/e/${elec.id}`}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white text-center shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Vote className="h-3.5 w-3.5" /> Cast Ballot
                    </Link>
                    <Link
                      href={`/org/${org.id}/elections/${elec.id}/results`}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all flex items-center gap-1"
                    >
                      <span>Turnout</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Scheduled & Past Elections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              Upcoming Elections ({upcomingElections.length})
            </h2>

            {upcomingElections.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 text-center text-xs text-slate-500">
                No upcoming elections scheduled yet.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingElections.map((elec) => (
                  <div
                    key={elec.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white">{elec.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Scheduled: {elec.startDate ? new Date(elec.startDate).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                      {elec.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Certified Results */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
              Certified Results Archive ({pastElections.length})
            </h2>

            {pastElections.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 text-center text-xs text-slate-500">
                No past elections archived yet.
              </div>
            ) : (
              <div className="space-y-3">
                {pastElections.map((elec) => (
                  <div
                    key={elec.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white">{elec.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ended: {elec.endDate ? new Date(elec.endDate).toLocaleDateString() : 'Concluded'}
                      </p>
                    </div>
                    <Link
                      href={`/org/${org.id}/elections/${elec.id}/results`}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-xs font-bold text-purple-300 transition-all flex items-center gap-1"
                    >
                      <span>View Results</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
