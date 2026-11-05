'use client';

import { useState, useEffect } from 'react';
import {
  QrCode,
  Download,
  Printer,
  Vote,
  Globe,
  BarChart3,
  Smartphone,
  Check,
} from 'lucide-react';
import { generateElectionQRCodes } from '@/lib/sharing/qrcode';

export default function QRCodeCard({
  electionId,
  electionTitle = 'Election',
  orgName = 'VoteSphere Organization',
}) {
  const [activeTab, setActiveTab] = useState('public'); // 'public' | 'vote' | 'results'
  const [qrSuite, setQrSuite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadQRCodes() {
      try {
        setLoading(true);
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        const suite = await generateElectionQRCodes(electionId, baseUrl, { width: 512 });
        setQrSuite(suite);
      } catch {
        // Fallback error handling
      } finally {
        setLoading(false);
      }
    }

    if (electionId) {
      loadQRCodes();
    }
  }, [electionId]);

  const currentQR = qrSuite ? qrSuite[activeTab] : null;

  function handleDownload(format = 'png') {
    setDownloading(true);
    const downloadUrl = `/api/elections/${electionId}/qrcode?type=${
      activeTab === 'public' ? 'overview' : activeTab
    }&format=${format}&download=true&size=1024`;
    window.location.href = downloadUrl;
    setTimeout(() => setDownloading(false), 2000);
  }

  function handlePrintFlyer() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">QR Code Generator</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              High-resolution QR codes for physical flyers, posters, and mobile scanning
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrintFlyer}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5 text-slate-400" />
          <span>Print Voting Flyer</span>
        </button>
      </div>

      {/* Target Selector Tabs */}
      <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('public')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'public'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>Ballot Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vote')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'vote'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Vote className="h-3.5 w-3.5" />
          <span>Direct Voting Booth</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'results'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Results & Turnout</span>
        </button>
      </div>

      {/* Main QR Display Card */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80">
        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl shadow-2xl shrink-0 border-4 border-slate-800 flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : currentQR?.dataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentQR.dataUrl}
              alt={`QR Code for ${electionTitle}`}
              className="w-full h-full object-contain select-none"
            />
          ) : (
            <div className="text-xs text-slate-500 text-center">Unable to render QR code</div>
          )}
        </div>

        {/* Info & Download Actions */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
              Scan to Participate
            </span>
            <h4 className="text-lg font-bold text-white">{electionTitle}</h4>
            <p className="text-xs text-slate-400 mt-1">{orgName}</p>
          </div>

          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 break-all select-all">
            {currentQR?.targetUrl || 'Generating link...'}
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleDownload('png')}
              disabled={downloading || loading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {downloading ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
              <span>Download PNG (1024px)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('svg')}
              disabled={downloading || loading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 text-purple-400" />
              <span>Vector SVG</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Scanner Instructions Callout */}
      <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center gap-3 text-xs text-slate-300">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Smartphone className="h-4 w-4" />
        </div>
        <p className="leading-relaxed">
          <strong>Instant Mobile Access:</strong> Voters can scan this QR code directly with any iOS or Android default camera app to enter the secure voting booth immediately.
        </p>
      </div>
    </div>
  );
}
