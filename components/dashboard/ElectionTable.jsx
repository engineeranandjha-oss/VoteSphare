'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Calendar, ExternalLink, Settings, Plus } from 'lucide-react';

export default function ElectionTable({ elections = [], orgId }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredElections = elections.filter((elec) => {
    const matchesSearch =
      !search || elec.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || elec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function renderStatusBadge(status) {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Live
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Scheduled
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Certified
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Ended
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Draft
          </span>
        );
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Elections</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your organization&apos;s active, scheduled, and past election ballots.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search elections..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-slate-500 hidden sm:inline-block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="live">Live</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="ended">Ended</option>
              <option value="published">Certified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Elections Roster */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 pl-2">Election Details</th>
              <th className="pb-3 px-4">Status</th>
              <th className="pb-3 px-4">Timeline</th>
              <th className="pb-3 px-4">Ballot Scope</th>
              <th className="pb-3 pr-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {filteredElections.map((elec) => {
              const stats = elec.stats || {};
              const startDate = elec.startDate
                ? new Date(elec.startDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'TBD';
              const endDate = elec.endDate
                ? new Date(elec.endDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'TBD';

              return (
                <tr
                  key={elec.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="py-4 pl-2">
                    <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                      {elec.title}
                    </div>
                    {elec.description && (
                      <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                        {elec.description}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {renderStatusBadge(elec.status)}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>
                        {startDate} – {endDate}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-400">
                    <div>
                      {stats.positionCount || 0} Positions •{' '}
                      {stats.candidateCount || 0} Candidates
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {stats.eligibleVoterCount || 0} Eligible Electors
                    </div>
                  </td>
                  <td className="py-4 pr-2 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/e/${elec.id}/results`}
                        target="_blank"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
                        title="View Public Results"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/org/${orgId}/elections/${elec.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-xs transition-all border border-blue-500/20"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        <span>Manage</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredElections.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">No elections found matching the criteria.</p>
            <Link
              href={`/org/${orgId}/elections/new`}
              className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Create Your First Election
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
