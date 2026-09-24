import Link from 'next/link';
import { Radio, Calendar, ArrowRight, Layers, ShieldCheck, Building2 } from 'lucide-react';

export default function VoterElectionCard({ election }) {
  const orgName = election.organization?.name || 'Organization';
  const orgSlug = election.organization?.slug;
  const orgLogo = election.organization?.logo;
  const positionsCount = election.positionsCount || 0;

  const endDateFormatted = election.endDate
    ? new Date(election.endDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Ongoing (No end date)';

  // Calculate remaining time
  let timeRemaining = null;
  if (election.endDate) {
    const diff = new Date(election.endDate).getTime() - Date.now();
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      if (days > 0) {
        timeRemaining = `${days}d ${hours}h remaining`;
      } else {
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        timeRemaining = `${hours}h ${mins}m remaining`;
      }
    } else {
      timeRemaining = 'Closing soon';
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/25 border border-blue-500/30 hover:border-blue-500/60 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden transition-all group">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-all" />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm animate-pulse">
            <Radio className="h-3 w-3 text-blue-400" />
            POLLS LIVE
          </span>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            {orgLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={orgLogo}
                alt={orgName}
                className="w-4 h-4 rounded-full object-cover border border-slate-700"
              />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            )}
            {orgSlug ? (
              <Link href={`/org/${orgSlug}`} className="hover:text-blue-400 transition-colors truncate max-w-[180px]">
                {orgName}
              </Link>
            ) : (
              <span className="truncate max-w-[180px]">{orgName}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>Closes {endDateFormatted}</span>
          {timeRemaining && (
            <span className="px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 text-[10px] font-bold border border-blue-800/40">
              {timeRemaining}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="my-5 space-y-2">
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-blue-200 transition-colors">
          {election.title}
        </h3>
        {election.description && (
          <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed font-normal">
            {election.description}
          </p>
        )}

        <div className="pt-2 flex items-center gap-4 flex-wrap text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold bg-slate-800/60 px-3 py-1 rounded-xl border border-slate-700/50">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            <span>{positionsCount} Contested {positionsCount === 1 ? 'Position' : 'Positions'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Eligible Voter Record Verified</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <span>🔒 Cryptographically dissociated anonymous ballot</span>
        </div>

        <Link
          href={`/e/${election.electionId}/vote`}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-xs sm:text-sm text-white shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>Cast Ballot</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
