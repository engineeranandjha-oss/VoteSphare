'use client';

import { X, Award, Globe, Twitter, Linkedin, FileText, Check } from 'lucide-react';

export default function CandidateDetailModal({
  candidate,
  isOpen,
  onClose,
  isSelected = false,
  onToggleSelect,
  isSelectable = false,
}) {
  if (!isOpen || !candidate) return null;

  const socials = candidate.socialLinks || {};

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl overflow-y-auto space-y-6 text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Candidate Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 pb-5 sm:pb-6 border-b border-slate-800 pt-2 sm:pt-0">
          {candidate.photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={candidate.photo}
              alt={candidate.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-700 shadow-lg shrink-0"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg shrink-0">
              {candidate.name?.slice(0, 2).toUpperCase() || 'CA'}
            </div>
          )}

          <div className="text-center sm:text-left min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h3 className="text-xl sm:text-2xl font-black text-white">{candidate.name}</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Award className="h-3.5 w-3.5" /> Candidate
              </span>
            </div>

            {candidate.bio && (
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium leading-relaxed">
                {candidate.bio}
              </p>
            )}

            {/* Social Links */}
            {(socials.website || socials.twitter || socials.linkedin) && (
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                {socials.website && (
                  <a
                    href={socials.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                    title="Website"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
                {socials.twitter && (
                  <a
                    href={socials.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-sky-400 transition-colors"
                    title="Twitter"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {socials.linkedin && (
                  <a
                    href={socials.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Candidate Manifesto Body */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <FileText className="h-4 w-4" /> Campaign Manifesto & Policies
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal whitespace-pre-line">
            {candidate.manifesto ||
              'This candidate has not submitted a formal campaign manifesto statement.'}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 sticky bottom-0 bg-slate-900/95 pb-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Close
          </button>

          {isSelectable && onToggleSelect && (
            <button
              type="button"
              onClick={() => {
                onToggleSelect(candidate.id);
                onClose();
              }}
              className={`inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg cursor-pointer ${
                isSelected
                  ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
              }`}
            >
              {isSelected ? (
                <>Deselect Candidate</>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Select on Ballot
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
