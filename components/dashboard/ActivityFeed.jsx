'use client';

import { Activity, ShieldCheck, Mail, Vote, Calendar } from 'lucide-react';

export default function ActivityFeed({ activities = [] }) {
  const defaultActivities = [
    {
      id: 'act-1',
      icon: Vote,
      title: 'Election Created',
      description: 'Student Council President 2026 ballot initialized in draft state.',
      timestamp: '2 hours ago',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      id: 'act-2',
      icon: Mail,
      title: 'Voter Invitations Dispatched',
      description: '120 cryptographic ballot access tokens issued to active members.',
      timestamp: '5 hours ago',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      id: 'act-3',
      icon: ShieldCheck,
      title: 'Results Published & Sealed',
      description: 'Faculty Representative election certified with 84.5% voter turnout.',
      timestamp: '1 day ago',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'act-4',
      icon: Calendar,
      title: 'Auto-Transition Scheduled',
      description: 'Voting schedule set for automated live launch on 15 Sep 2026.',
      timestamp: '2 days ago',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  const items = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-400" />
          <h3 className="text-base font-bold text-white">Recent Workspace Activity</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Audit Stream
        </span>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const IconComp = item.icon || Activity;
          return (
            <div key={item.id} className="flex items-start gap-3.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  item.color || 'text-slate-400 bg-slate-800 border-slate-700'
                }`}
              >
                <IconComp className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">{item.title}</span>
                  <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
