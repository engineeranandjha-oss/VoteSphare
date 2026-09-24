import { Vote, CheckCircle2, Building2, Calendar, TrendingUp } from 'lucide-react';

export default function VoterStatsOverview({ stats = {} }) {
  const activeCount = stats.activeCount || 0;
  const votedCount = stats.votedCount || 0;
  const orgCount = stats.orgCount || 0;
  const upcomingCount = stats.upcomingCount || 0;
  const participationRate = stats.participationRate ?? (
    activeCount + votedCount > 0
      ? Math.round((votedCount / (activeCount + votedCount)) * 100)
      : votedCount > 0
      ? 100
      : 0
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* Ready to Vote */}
      <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
            Ready to Vote
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
            <Vote className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white">{activeCount}</div>
        <div className="text-xs text-blue-300/80 font-medium mt-1">
          {activeCount === 1 ? '1 active ballot' : `${activeCount} active ballots`}
        </div>
      </div>

      {/* Ballots Cast */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Ballots Cast
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white">{votedCount}</div>
        <div className="text-xs text-slate-400 font-medium mt-1">Verified receipts</div>
      </div>

      {/* Participation Rate */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Participation
          </span>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white">{participationRate}%</div>
        <div className="text-xs text-slate-400 font-medium mt-1">Elector turnout rate</div>
      </div>

      {/* Organizations Enrolled */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Organizations
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Building2 className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white">{orgCount}</div>
        <div className="text-xs text-slate-400 font-medium mt-1">Active rosters</div>
      </div>

      {/* Upcoming Scheduled */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Upcoming
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white">{upcomingCount}</div>
        <div className="text-xs text-slate-400 font-medium mt-1">Opening soon</div>
      </div>
    </div>
  );
}
