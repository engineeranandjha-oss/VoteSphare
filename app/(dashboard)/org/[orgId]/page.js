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
  ShieldCheck,
  ExternalLink,
  LayoutDashboard,
  MapPin,
  Mail,
  Phone,
  Globe,
  Award,
  Layers,
  CalendarClock,
  History,
  Lock,
  Search,
  Shield,
  LogIn,
} from 'lucide-react';
import Image from 'next/image';

export default function PublicOrgPortalPage() {
  const { orgId } = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [electionsData, setElectionsData] = useState(null);
  const [peopleData, setPeopleData] = useState(null);

  // Main Right Column View: 'elections' | 'directory'
  const [mainView, setMainView] = useState('elections');

  // Elections Tab: 'active' | 'upcoming' | 'published' | 'completed'
  const [activeTab, setActiveTab] = useState('completed');

  // Directory Sub-tab: 'members' | 'participants'
  const [directoryTab, setDirectoryTab] = useState('members');
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orgId === 'dashboard') {
      router.replace('/dashboard');
    }
  }, [orgId, router]);

  // Determine initial default tab according to strict priority rules:
  // 1. Live Now (if any exist)
  // 2. Upcoming (if any exist)
  // 3. All Completed (if any exist)
  // 4. Otherwise active tab
  const determineDefaultTab = (grouped) => {
    if (grouped?.active?.length > 0) return 'active';
    if (grouped?.upcoming?.length > 0) return 'upcoming';
    if (grouped?.completed?.length > 0) return 'completed';
    if (grouped?.published?.length > 0) return 'published';
    return 'active';
  };

  const fetchPublicOrgData = useCallback(async () => {
    if (orgId === 'dashboard') return;
    try {
      setLoading(true);
      setError(null);

      const [portalRes, electionsRes, peopleRes] = await Promise.all([
        fetch(`/api/orgs/public/${encodeURIComponent(orgId)}`),
        fetch(`/api/orgs/public/${encodeURIComponent(orgId)}/elections`),
        fetch(`/api/orgs/public/${encodeURIComponent(orgId)}/people`),
      ]);

      const portalJson = await portalRes.json();
      const electionsJson = await electionsRes.json();
      const peopleJson = await peopleRes.json();

      if (!portalRes.ok || !portalJson.success) {
        throw new Error(portalJson.message || 'Organization not found');
      }

      setData(portalJson.data);

      if (electionsRes.ok && electionsJson.success) {
        setElectionsData(electionsJson.data);
        const defaultTab = determineDefaultTab(electionsJson.data?.grouped);
        setActiveTab(defaultTab);
      }

      if (peopleRes.ok && peopleJson.success) {
        setPeopleData(peopleJson.data);
      }
    } catch (err) {
      setError(err.message || 'Error loading organization transparency portal');
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
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
          <div className="h-64 bg-slate-900 rounded-3xl" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="h-24 bg-slate-900 rounded-2xl" />
            <div className="h-24 bg-slate-900 rounded-2xl" />
            <div className="h-24 bg-slate-900 rounded-2xl" />
            <div className="h-24 bg-slate-900 rounded-2xl" />
            <div className="h-24 bg-slate-900 rounded-2xl" />
            <div className="h-24 bg-slate-900 rounded-2xl" />
          </div>
          <div className="h-96 bg-slate-900 rounded-3xl" />
        </main>
        <LandingFooter />
      </div>
    );
  }

  if (error || !data?.organization) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <PublicNavbar />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-3xl">
            🏛️
          </div>
          <h1 className="text-2xl font-black text-white">Organization Not Found</h1>
          <p className="text-sm text-slate-400">
            {error || 'The requested organization public profile does not exist or has been made private.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all shadow-lg shadow-blue-600/20"
            >
              Return Home
            </Link>
            <Link
              href="/join"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300 transition-all border border-slate-700"
            >
              Join an Election
            </Link>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  const { organization, owner, statistics, viewer } = data;
  const groupedElections = electionsData?.grouped || {
    active: [],
    upcoming: [],
    completed: [],
    published: [],
  };

  const currentTabElections =
    activeTab === 'active'
      ? groupedElections.active
      : activeTab === 'upcoming'
      ? groupedElections.upcoming
      : activeTab === 'published'
      ? groupedElections.published
      : groupedElections.completed;

  // People directory filtering
  const directoryMembers = peopleData?.members || [];
  const directoryParticipants = peopleData?.participants || [];

  const rawCurrentPeople =
    directoryTab === 'members' ? directoryMembers : directoryParticipants;

  const filteredPeople = rawCurrentPeople.filter((p) => {
    if (directoryRoleFilter !== 'all') {
      if (directoryTab === 'members' && p.role !== directoryRoleFilter) return false;
      if (directoryTab === 'participants' && p.participantType !== directoryRoleFilter) return false;
    }
    if (directorySearch.trim()) {
      const q = directorySearch.trim().toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.fullName?.toLowerCase().includes(q) ||
        p.designation?.toLowerCase().includes(q) ||
        p.roleLabel?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const memberCounts = peopleData?.counts || {
    totalMembers: directoryMembers.length,
    totalParticipants: directoryParticipants.length,
    totalCandidates: 0,
    totalVoters: 0,
    grandTotal: directoryMembers.length + directoryParticipants.length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <PublicNavbar />

      {/* Admin Management Notice Banner */}
      {viewer?.canManage && (
        <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-blue-900/60 border-b border-blue-500/20 backdrop-blur-md px-4 py-2.5 text-xs text-slate-200">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                You are viewing this public portal as an authenticated{' '}
                <strong className="capitalize">{viewer.callerRole}</strong>.
              </span>
            </div>
            <Link
              href={`/org/${organization.id}/dashboard`}
              className="inline-flex items-center gap-1.5 font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Open Private Workspace Dashboard &rarr;</span>
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Organization Hero Card with Cover Banner */}
        <div className="relative rounded-3xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
          {/* Cover Banner */}
          <div className="h-44 sm:h-56 w-full relative bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 overflow-hidden">
            {organization.coverImage ? (
              <Image
                src={organization.coverImage}
                alt={`${organization.name} Cover`}
                fill
                className="object-cover opacity-80"
                unoptimized
              />
            ) : (
              <div className="w-full h-full opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          </div>

          {/* Identity & Main Info Overlay */}
          <div className="relative px-6 sm:px-10 pb-8 sm:pb-10 -mt-16 sm:-mt-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              {/* Logo Box */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-900 border-2 border-slate-700/80 p-1.5 shrink-0 overflow-hidden shadow-2xl shadow-black/80">
                <div className="w-full h-full rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden">
                  {organization.logo ? (
                    <Image
                      src={organization.logo}
                      alt={organization.name}
                      width={112}
                      height={112}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-blue-400" />
                  )}
                </div>
              </div>

              {/* Title & Key Badges */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {organization.name}
                  </h1>
                  {organization.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified Entity
                    </span>
                  )}
                  <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {organization.type}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="font-mono text-slate-300">/org/{organization.slug}</span>
                  {organization.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {organization.location}
                      </span>
                    </>
                  )}
                  {organization.establishedDate && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> Est.{' '}
                        {new Date(organization.establishedDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Public Action Controls */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {organization.website && (
                <a
                  href={
                    organization.website.startsWith('http')
                      ? organization.website
                      : `https://${organization.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              <Link
                href="/join"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                <Vote className="w-4 h-4" />
                <span>Enter Ballot Code</span>
              </Link>
            </div>
          </div>

          {/* Description */}
          {organization.description && (
            <div className="px-6 sm:px-10 pb-6 border-t border-slate-800/60 pt-4">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                {organization.description}
              </p>
            </div>
          )}
        </div>

        {/* Aggregated Transparency Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <span className="text-xs font-medium text-slate-400">Total Elections</span>
            <div className="text-2xl font-black text-white mt-1">{statistics.totalElections}</div>
            <span className="text-[10px] text-slate-500">Public Records</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-md">
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Live
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{statistics.activeElections}</div>
            <span className="text-[10px] text-slate-500">Open For Voting</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <span className="text-xs font-medium text-slate-400">Upcoming</span>
            <div className="text-2xl font-black text-white mt-1">{statistics.upcomingElections}</div>
            <span className="text-[10px] text-slate-500">Scheduled Ballots</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <span className="text-xs font-medium text-slate-400">Completed</span>
            <div className="text-2xl font-black text-white mt-1">{statistics.completedElections}</div>
            <span className="text-[10px] text-slate-500">Concluded</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 backdrop-blur-md">
            <span className="text-xs font-medium text-indigo-400">Certified Results</span>
            <div className="text-2xl font-black text-indigo-400 mt-1">{statistics.publishedElections}</div>
            <span className="text-[10px] text-slate-500">Official Mandates</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <span className="text-xs font-medium text-slate-400">Total Participation</span>
            <div className="text-2xl font-black text-white mt-1">
              {statistics.totalVotesCast.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">Anonymous Votes</span>
          </div>
        </div>

        {/* Main Content Layout: Left Information & Right Interactive Views */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Leadership, Contact & Directory Status */}
          <div className="space-y-6">
            {/* Leadership & Ownership Transparency Card */}
            {owner && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Leadership Transparency</span>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {owner.image ? (
                      <Image
                        src={owner.image}
                        alt={owner.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-lg font-black text-slate-300">
                        {owner.name?.charAt(0) || 'L'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">{owner.name}</h3>
                    <p className="text-xs text-blue-400 font-medium">{owner.designation}</p>
                    <span className="text-[10px] text-slate-500">Verified Organization Authority</span>
                  </div>
                </div>

                {owner.bio && (
                  <p className="text-xs text-slate-300 border-t border-slate-800/80 pt-3 leading-relaxed">
                    {owner.bio}
                  </p>
                )}

                {(owner.publicEmail || owner.publicPhone) && (
                  <div className="space-y-2 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                    {owner.publicEmail && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <a
                          href={`mailto:${owner.publicEmail}`}
                          className="hover:text-blue-300 transition-colors truncate"
                        >
                          {owner.publicEmail}
                        </a>
                      </div>
                    )}
                    {owner.publicPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{owner.publicPhone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Public Organization Contact & Inquiries */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Contact & Inquiries</span>
              </h3>

              <div className="space-y-3 text-xs text-slate-300">
                {organization.publicEmail ? (
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Direct Inquiries Email
                    </span>
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                      <a
                        href={`mailto:${organization.publicEmail}`}
                        className="hover:underline text-blue-400 transition-colors break-all"
                      >
                        {organization.publicEmail}
                      </a>
                    </div>
                    <a
                      href={`mailto:${organization.publicEmail}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-all shadow-sm"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Contact Organization</span>
                    </a>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-slate-400 text-xs leading-relaxed">
                    <p className="text-slate-300 font-medium mb-1">Public Inquiries Notice</p>
                    This organization has not provided direct public inquiry contact details.
                    Registered participants may contact election administrators via official ballot
                    channels.
                  </div>
                )}

                {organization.publicPhone && (
                  <div className="flex items-center gap-2.5 pt-1">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <a
                      href={`tel:${organization.publicPhone}`}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {organization.publicPhone}
                    </a>
                  </div>
                )}

                {organization.location && (
                  <div className="flex items-center gap-2.5 pt-1">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{organization.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Organization People Directory Access Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>People & Directory</span>
                </h3>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    organization.memberDirectoryVisibility === 'public'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : organization.memberDirectoryVisibility === 'members_only'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {organization.memberDirectoryVisibility === 'public'
                    ? 'Public Directory'
                    : organization.memberDirectoryVisibility === 'members_only'
                    ? 'Members & Voters'
                    : 'Private Access'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Discover verified organization leadership, administrators, official candidates, and
                registered election voters.
              </p>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block font-semibold">
                    Org Members
                  </span>
                  <span className="text-base font-black text-white">
                    {memberCounts.totalMembers}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block font-semibold">
                    Participants
                  </span>
                  <span className="text-base font-black text-white">
                    {memberCounts.totalParticipants}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMainView(mainView === 'directory' ? 'elections' : 'directory')}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  mainView === 'directory'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>
                  {mainView === 'directory' ? 'Return to Elections' : 'Explore People Directory'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic Section Switching (Elections vs People Directory) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top View Selector Pills */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <button
                type="button"
                onClick={() => setMainView('elections')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  mainView === 'elections'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Vote className="w-3.5 h-3.5" />
                <span>Elections & Ballots ({statistics.totalElections})</span>
              </button>

              <button
                type="button"
                onClick={() => setMainView('directory')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  mainView === 'directory'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>People & Participants ({memberCounts.grandTotal})</span>
              </button>
            </div>

            {/* VIEW A: ELECTIONS & BALLOTS */}
            {mainView === 'elections' && (
              <div className="space-y-6">
                {/* Category Navigation Pills */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('active')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                        activeTab === 'active'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Now ({groupedElections.active.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('upcoming')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                        activeTab === 'upcoming'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>Upcoming ({groupedElections.upcoming.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('published')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                        activeTab === 'published'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Results Declared ({groupedElections.published.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('completed')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                        activeTab === 'completed'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>All Completed ({groupedElections.completed.length})</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                    Draft elections strictly excluded
                  </span>
                </div>

                {/* Election Cards List & Explicit Empty States */}
                {currentTabElections.length === 0 ? (
                  <div className="rounded-3xl border border-slate-800/80 bg-slate-900/30 p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-xl">
                      🗳️
                    </div>
                    <h4 className="text-base font-bold text-slate-200">
                      {activeTab === 'active'
                        ? 'No elections are currently open for voting.'
                        : activeTab === 'upcoming'
                        ? 'No upcoming elections have been scheduled.'
                        : activeTab === 'published'
                        ? 'No results have been officially declared yet.'
                        : 'No completed elections are available.'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {activeTab === 'active'
                        ? 'Ballots are currently closed. Check back when an active voting window begins.'
                        : activeTab === 'upcoming'
                        ? 'New elections will appear here once officially scheduled by organization administrators.'
                        : activeTab === 'published'
                        ? 'Election results will be published here upon official certification by the election board.'
                        : 'Concluded historical elections will be archived here for civic transparency.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentTabElections.map((election) => (
                      <div
                        key={election.id}
                        className="p-6 rounded-3xl border border-slate-800/90 bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-xl hover:border-slate-700 transition-all shadow-lg space-y-4 group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                {election.title}
                              </h4>
                              {election.status === 'live' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{' '}
                                  Live Ballot
                                </span>
                              )}
                              {election.status === 'scheduled' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  Scheduled
                                </span>
                              )}
                              {election.status === 'published' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  Results Declared
                                </span>
                              )}
                              {election.status === 'ended' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
                                  Ended
                                </span>
                              )}
                              {election.status === 'archived' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800/80 text-slate-400 border border-slate-700">
                                  Archived
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-slate-500" />{' '}
                                {election.totalPositions} Positions
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-500" />{' '}
                                {election.totalCandidates} Candidates
                              </span>
                              {election.startDate && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                    {new Date(election.startDate).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action Links */}
                          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                            {election.hasPublishedResults ? (
                              <Link
                                href={`/e/${election.id}/results`}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>View Certified Results</span>
                              </Link>
                            ) : election.status === 'live' ? (
                              <Link
                                href={`/e/${election.id}/vote`}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
                              >
                                <Vote className="w-3.5 h-3.5" />
                                <span>Cast Ballot</span>
                              </Link>
                            ) : (
                              <Link
                                href={`/e/${election.id}`}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                              >
                                <span>Election Details</span>
                              </Link>
                            )}
                          </div>
                        </div>

                        {election.description && (
                          <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                            {election.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW B: ORGANIZATION PEOPLE DIRECTORY */}
            {mainView === 'directory' && (
              <div className="space-y-6">
                {/* Directory Controls Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  {/* Category Switcher Tabs */}
                  <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setDirectoryTab('members');
                        setDirectoryRoleFilter('all');
                      }}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        directoryTab === 'members'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Organization Members ({memberCounts.totalMembers})
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDirectoryTab('participants');
                        setDirectoryRoleFilter('all');
                      }}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        directoryTab === 'participants'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Election Participants ({memberCounts.totalParticipants})
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder={
                        directoryTab === 'members'
                          ? 'Search members or titles...'
                          : 'Search candidates or voters...'
                      }
                      value={directorySearch}
                      onChange={(e) => setDirectorySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Constitutional Anonymity Guarantee Banner */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-300">Constitutional Anonymity Protected:</strong>{' '}
                    This directory reveals organizational associations and eligibility. Individual
                    ballot choices and whether a voter has cast their ballot remain strictly secret
                    and cryptographically dissociated.
                  </div>
                </div>

                {/* Restricted Access State */}
                {peopleData?.canAccess === false && (
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-4">
                    <Lock className="w-10 h-10 text-amber-400 mx-auto" />
                    <h4 className="text-base font-bold text-white">Member Directory Protected</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      {peopleData?.accessNotice ||
                        'This directory is accessible only to organization members and registered election voters.'}
                    </p>
                    <div className="pt-2">
                      <Link
                        href={`/auth/login?next=/org/${organization.slug}`}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In with Voter Account</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* People Cards Grid */}
                {peopleData?.canAccess !== false && filteredPeople.length === 0 ? (
                  <div className="rounded-3xl border border-slate-800/80 bg-slate-900/30 p-12 text-center space-y-2">
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-200">No people found</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {directorySearch
                        ? `No results matching "${directorySearch}".`
                        : directoryTab === 'members'
                        ? 'No active organization members recorded.'
                        : 'No election participants registered yet.'}
                    </p>
                  </div>
                ) : (
                  peopleData?.canAccess !== false && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredPeople.map((person) => {
                        const isOwner = person.role === 'owner';
                        const isAdmin = person.role === 'admin';
                        const isCandidate = person.role === 'candidate';
                        const isRegisteredVoter = person.role === 'voter';

                        const initials = (person.name || 'Member')
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase();

                        return (
                          <div
                            key={person.id}
                            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                          >
                            <div className="flex items-start gap-3.5">
                              {/* Avatar */}
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-200 shrink-0 overflow-hidden shadow-inner">
                                {person.image ? (
                                  <Image
                                    src={person.image}
                                    alt={person.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  initials
                                )}
                              </div>

                              {/* Details */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h5 className="font-bold text-white text-sm truncate">
                                    {person.name}
                                  </h5>

                                  {/* Badge */}
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                      isOwner
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : isAdmin
                                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        : isCandidate
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : isRegisteredVoter
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                                    }`}
                                  >
                                    {person.roleLabel || person.role}
                                  </span>
                                </div>

                                {person.designation && (
                                  <p className="text-xs text-blue-400 font-medium truncate mt-0.5">
                                    {person.designation}
                                  </p>
                                )}

                                {person.bio && (
                                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                    {person.bio}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Public Contact Details (strictly sanitized) */}
                            {(person.publicEmail || person.publicPhone) && (
                              <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                {person.publicEmail && (
                                  <a
                                    href={`mailto:${person.publicEmail}`}
                                    className="hover:text-blue-400 transition-colors inline-flex items-center gap-1.5"
                                  >
                                    <Mail className="w-3 h-3 text-slate-500" />
                                    <span className="truncate">{person.publicEmail}</span>
                                  </a>
                                )}
                                {person.publicPhone && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-slate-500" />
                                    <span>{person.publicPhone}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
