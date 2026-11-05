'use client';

import { BarChart3, Users, Calendar, AlertCircle } from 'lucide-react';

export default function UsageMeters({ usage, planName = 'Plan' }) {
  if (!usage) return null;

  const { monthlyElections, simultaneousLive, voterLimitPerElection } = usage;

  const getMeterColor = (percentage) => {
    if (percentage >= 100) return 'bg-rose-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const getTextColor = (percentage) => {
    if (percentage >= 100) return 'text-rose-400';
    if (percentage >= 80) return 'text-amber-400';
    return 'text-blue-400';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Resource Quotas & Usage</h3>
            <p className="text-xs text-slate-400">Current consumption under your {planName} tier</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Monthly Elections */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Monthly Elections</span>
            </div>
            <span className={`text-xs font-bold ${getTextColor(monthlyElections?.percentage || 0)}`}>
              {monthlyElections?.used || 0} / {monthlyElections?.limit || '∞'}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 rounded-full ${getMeterColor(
                monthlyElections?.percentage || 0
              )}`}
              style={{ width: `${Math.min(100, monthlyElections?.percentage || 0)}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Resets automatically on the 1st of every month
          </p>
        </div>

        {/* 2. Simultaneous Live Elections */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span>Simultaneous Live</span>
            </div>
            <span className={`text-xs font-bold ${getTextColor(simultaneousLive?.percentage || 0)}`}>
              {simultaneousLive?.used || 0} / {simultaneousLive?.limit || '∞'}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 rounded-full ${getMeterColor(
                simultaneousLive?.percentage || 0
              )}`}
              style={{ width: `${Math.min(100, simultaneousLive?.percentage || 0)}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Concurrently active or scheduled voting events
          </p>
        </div>

        {/* 3. Voter Capacity Per Election */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Voter Capacity / Election</span>
            </div>
            <span className="text-xs font-bold text-sky-400">
              Up to {voterLimitPerElection?.toLocaleString('en-IN') || 50}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-sky-500 rounded-full" style={{ width: '100%' }} />
          </div>

          <p className="text-[11px] text-slate-500">
            Expandable with Voter Capacity Booster packs
          </p>
        </div>
      </div>

      {(monthlyElections?.percentage >= 100 || simultaneousLive?.percentage >= 100) && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            You have reached the capacity limit for your current tier. Upgrade to unlock additional concurrent elections and voter seats.
          </span>
        </div>
      )}
    </div>
  );
}

