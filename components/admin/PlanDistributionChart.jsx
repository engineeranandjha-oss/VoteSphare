'use client';

import { Layers } from 'lucide-react';

export default function PlanDistributionChart({ distribution = {} }) {
  const tiers = [
    {
      id: 'free',
      name: 'Community (Free)',
      count: distribution.free || 0,
      color: 'bg-slate-500',
      textColor: 'text-slate-400',
      description: '50 voters / election',
    },
    {
      id: 'event-pass',
      name: 'Event Pass',
      count: distribution['event-pass'] || 0,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      description: '₹2,999 one-time (500 voters)',
    },
    {
      id: 'starter',
      name: 'Starter Tier',
      count: (distribution['starter-monthly'] || 0) + (distribution['starter-annual'] || 0),
      color: 'bg-blue-500',
      textColor: 'text-blue-400',
      description: '₹1,499/mo (250 voters)',
    },
    {
      id: 'pro',
      name: 'Professional Tier',
      count: (distribution['pro-monthly'] || 0) + (distribution['pro-annual'] || 0),
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
      description: '₹4,999/mo (1,500 voters, runoff)',
    },
    {
      id: 'enterprise',
      name: 'Enterprise Tier',
      count: distribution.enterprise || 0,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      description: 'Custom contract / unlimited',
    },
  ];

  const totalSubscriptions = tiers.reduce((acc, t) => acc + t.count, 0);

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-slate-800 text-blue-400 border border-slate-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Subscription Plan Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active subscriptions by tier ({totalSubscriptions} total tracked)
            </p>
          </div>
        </div>
      </div>

      {/* Segmented Distribution Bar */}
      {totalSubscriptions > 0 ? (
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex mb-6">
          {tiers.map((t) => {
            const pct = (t.count / totalSubscriptions) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={t.id}
                style={{ width: `${pct}%` }}
                className={`h-full ${t.color} transition-all`}
                title={`${t.name}: ${t.count} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>
      ) : (
        <div className="w-full h-3 rounded-full bg-slate-800 mb-6" />
      )}

      {/* Tier Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {tiers.map((tier) => {
          const pct = totalSubscriptions > 0 ? ((tier.count / totalSubscriptions) * 100).toFixed(1) : 0;
          return (
            <div
              key={tier.id}
              className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${tier.color}`} />
                  <span className="text-xs font-bold text-slate-200 truncate">{tier.name}</span>
                </div>
                <p className="text-[11px] text-slate-400">{tier.description}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-baseline justify-between">
                <span className="text-lg font-black text-white">{tier.count}</span>
                <span className={`text-xs font-semibold ${tier.textColor}`}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

