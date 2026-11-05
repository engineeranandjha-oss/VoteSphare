'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareModal from './ShareModal';

export default function ShareButton({
  election,
  variant = 'secondary',
  label = 'Share',
  className = '',
}) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!election) return null;

  function getButtonStyles() {
    if (variant === 'primary') {
      return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20';
    }
    if (variant === 'icon') {
      return 'p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800';
    }
    return 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800';
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${getButtonStyles()} ${className}`}
        title="Share this election"
      >
        <Share2 className="h-3.5 w-3.5 text-blue-400" />
        {variant !== 'icon' && <span>{label}</span>}
      </button>

      <ShareModal
        election={election}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
