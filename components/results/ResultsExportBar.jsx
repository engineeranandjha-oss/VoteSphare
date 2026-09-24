'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, Printer, Share2, Check } from 'lucide-react';

export default function ResultsExportBar({ data }) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const {
    electionId = '',
    electionTitle = 'Election',
    turnout = {},
    positions = [],
  } = data;

  function handleExportCSV() {
    if (typeof window === 'undefined') return;

    const rows = [
      ['VoteSphere Official Election Results Export'],
      ['Election Title', electionTitle],
      ['Election ID', electionId],
      ['Total Eligible Electors', turnout.totalEligible || 0],
      ['Total Ballots Cast', turnout.totalVoted || 0],
      ['Turnout Percentage', `${turnout.turnoutPercentage || 0}%`],
      ['Export Timestamp', new Date().toISOString()],
      [],
      ['Position', 'Candidate Name', 'Votes Received', 'Vote Percentage', 'Status', 'Winner'],
    ];

    positions.forEach((pos) => {
      const candidates = pos.candidates || [];
      candidates.forEach((c) => {
        const isWinner = pos.winners?.some((w) => w.id === c.id) || c.isWinner;
        rows.push([
          `"${pos.positionName || ''}"`,
          `"${c.name || ''}"`,
          c.voteCount || 0,
          `${(c.percentage || 0).toFixed(2)}%`,
          pos.status || 'decided',
          isWinner ? 'YES' : 'NO',
        ]);
      });
      if (candidates.length === 0) {
        rows.push([`"${pos.positionName || ''}"`, 'No Candidates', 0, '0%', pos.status, 'NO']);
      }
    });

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VoteSphere_Results_${electionId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleExportJSON() {
    if (typeof window === 'undefined') return;

    const exportPayload = {
      generator: 'VoteSphere Cryptographic Results Engine',
      exportedAt: new Date().toISOString(),
      election: {
        id: electionId,
        title: electionTitle,
      },
      turnout,
      positions,
      certifiedSnapshot: data.certifiedSnapshot || null,
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VoteSphere_CertifiedSnapshot_${electionId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  function handleShare() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
        <Download className="h-4 w-4 text-blue-400" />
        <span>Export & Reporting Tools</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExportCSV}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
          <span>Export CSV</span>
        </button>

        <button
          type="button"
          onClick={handleExportJSON}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <FileJson className="h-3.5 w-3.5 text-blue-400" />
          <span>Audit JSON</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5 text-slate-400" />
          <span>Print / PDF</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 text-purple-400" />
              <span>Share Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
