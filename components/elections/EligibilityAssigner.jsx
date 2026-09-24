'use client';

import { Users, Mail, ShieldCheck } from 'lucide-react';

export default function EligibilityAssigner({
  assignAllActive = true,
  onAssignAllChange,
  notifyVoters = true,
  onNotifyVotersChange,
  launchAction = 'draft',
  onLaunchActionChange,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">
          Voter Eligibility & Launch Options
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Define who is allowed to participate in this election and choose how to launch.
        </p>
      </div>

      {/* Eligibility Policy Cards */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          Eligibility Policy
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onAssignAllChange(true)}
            className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
              assignAllActive
                ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                assignAllActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">All Active Members</div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Automatically grant voting access to every confirmed organization member.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onAssignAllChange(false)}
            className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
              !assignAllActive
                ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                !assignAllActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Custom Roster Only</div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Manually enroll electors and assign tokens through the management portal later.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Notifications Toggle */}
      <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-purple-400 shrink-0" />
          <div>
            <div className="text-sm font-bold text-white">Email Notification Broadcast</div>
            <p className="text-xs text-slate-400 mt-0.5">
              Send cryptographic voting links automatically to eligible voters upon launch.
            </p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={notifyVoters}
          onChange={(e) => onNotifyVotersChange(e.target.checked)}
          className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </div>

      {/* Launch Action Selector */}
      <div className="space-y-3 pt-2">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          Launch Action
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'draft',
              title: 'Save as Draft',
              desc: 'Keep in draft mode to review and launch later.',
            },
            {
              id: 'scheduled',
              title: 'Schedule for Dates',
              desc: 'Automatically open when Start Date arrives.',
            },
            {
              id: 'live',
              title: 'Launch Live Immediately',
              desc: 'Open the polls right away for active voting.',
            },
          ].map((act) => {
            const isSelected = launchAction === act.id;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => onLaunchActionChange(act.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 text-white font-bold shadow-md shadow-blue-500/10'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/80 font-medium'
                }`}
              >
                <div className="text-xs font-bold text-white">{act.title}</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{act.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
