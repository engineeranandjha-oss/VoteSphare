'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  ShieldCheck,
  Mail,
  Vote,
  Users,
  Play,
  Lock,
  CheckCircle2,
  Calendar,
  Loader2,
} from 'lucide-react';

const ICON_MAP = {
  vote: Vote,
  users: Users,
  shield: ShieldCheck,
  mail: Mail,
  play: Play,
  lock: Lock,
  check: CheckCircle2,
  calendar: Calendar,
  activity: Activity,
};

export default function ActivityFeed({ orgId, activities: initialActivities }) {
  const [activities, setActivities] = useState(initialActivities || []);
  const [loading, setLoading] = useState(!initialActivities && Boolean(orgId));

  const fetchActivities = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/orgs/${orgId}/activity`);
      const json = await res.json();
      if (res.ok && json.success) {
        setActivities(json.data || []);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (initialActivities) {
      setActivities(initialActivities);
    } else if (orgId) {
      fetchActivities();
    }
  }, [orgId, initialActivities, fetchActivities]);

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

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-500 gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          <span className="text-xs">Loading activity stream...</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-slate-500 space-y-1">
          <Activity className="h-8 w-8 mx-auto text-slate-600 opacity-60" />
          <p className="text-xs font-semibold text-slate-400">No workspace activity yet</p>
          <p className="text-[11px]">Actions like ballot creation and member enrollment will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 hover:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {activities.map((item) => {
            const IconComp =
              (item.iconType && ICON_MAP[item.iconType]) ||
              item.icon ||
              Activity;

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
                    <span className="text-xs font-bold text-white truncate">{item.title}</span>
                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                      {item.timeAgo || item.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
