import { Radio, Calendar, Building2, CheckCircle2, Clock } from 'lucide-react';

export default function ElectionHero({ election }) {
  const status = election.status || 'draft';
  const orgName = election.organization?.name || 'Organization';

  const startDateFormatted = election.startDate
    ? new Date(election.startDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'TBD';

  const endDateFormatted = election.endDate
    ? new Date(election.endDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'TBD';

  function renderStatusBadge() {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <Radio className="h-3 w-3 text-blue-400" />
            POLLS OPEN • LIVE
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="h-3 w-3 text-indigo-400" />
            SCHEDULED
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            OFFICIAL RESULTS CERTIFIED
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            VOTING CONCLUDED
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            DRAFT
          </span>
        );
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/20 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <Building2 className="h-4 w-4 text-blue-400" />
              <span>{orgName}</span>
            </div>
            <span>•</span>
            <span className="text-xs text-slate-500">Official Ballot</span>
          </div>

          <div>{renderStatusBadge()}</div>
        </div>

        {/* Title & Description */}
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {election.title}
          </h1>
          {election.description && (
            <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-3xl leading-relaxed font-normal">
              {election.description}
            </p>
          )}
        </div>

        {/* Timeline Row */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>
              <strong>Opens:</strong> {startDateFormatted}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>
              <strong>Closes:</strong> {endDateFormatted}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
