'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SessionTimer({ expiresAt, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    if (!expiresAt) return;

    const targetTime = new Date(expiresAt).getTime();

    function updateTimer() {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      setSecondsLeft(diff);

      if (diff <= 0) {
        if (onExpire) onExpire();
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (secondsLeft === null) {
    return null;
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isCritical = secondsLeft <= 180; // under 3 minutes
  const isExpired = secondsLeft === 0;

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border backdrop-blur-md text-xs font-semibold transition-all duration-300 ${
        isExpired
          ? 'bg-red-500/10 border-red-500/30 text-red-400'
          : isCritical
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
          : 'bg-slate-900/80 border-slate-800 text-slate-300'
      }`}
    >
      {isExpired ? (
        <AlertTriangle className="h-4 w-4 text-red-400" />
      ) : isCritical ? (
        <AlertTriangle className="h-4 w-4 text-amber-400" />
      ) : (
        <Clock className="h-4 w-4 text-blue-400" />
      )}

      <span>
        {isExpired ? (
          'Session Expired'
        ) : (
          <>
            Session expires in <span className="font-mono font-bold">{formattedTime}</span>
          </>
        )}
      </span>

      <div className="hidden sm:inline-flex items-center gap-1 pl-2 border-l border-slate-700/60 text-[11px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        <span>15m Ephemeral</span>
      </div>
    </div>
  );
}
