'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ImageUpload from '@/components/common/ImageUpload';
import {
  Vote,
  Users,
  Calendar,
  Layers,
  UserPlus,
  Plus,
  Trash2,
  Share2,
  ExternalLink,
  Play,
  CheckCircle2,
  Save,
  Loader2,
  AlertTriangle,
  Clock,
  Percent,
  Copy,
  Check,
  Send,
  Lock,
  Settings,
  Upload,
  Search,
  Filter,
  FileSpreadsheet,
  Ban,
  RotateCcw,
  CheckCheck,
  ShieldAlert,
} from 'lucide-react';

export default function AdminElectionCommandCenterPage() {
  const router = useRouter();
  const { orgId, electionId } = useParams();

  const [election, setElection] = useState(null);
  const [org, setOrg] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Active Tab: 'overview' | 'roster' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // Lifecycle Action State
  const [transitioning, setTransitioning] = useState(false);

  // Position & Candidate Modal States
  const [addPosModalOpen, setAddPosModalOpen] = useState(false);
  const [newPosName, setNewPosName] = useState('');
  const [newPosDesc, setNewPosDesc] = useState('');
  const [creatingPos, setCreatingPos] = useState(false);

  const [addCandModalOpen, setAddCandModalOpen] = useState(false);
  const [selectedPosId, setSelectedPosId] = useState('');
  const [candName, setCandName] = useState('');
  const [candBio, setCandBio] = useState('');
  const [candPhoto, setCandPhoto] = useState('');
  const [candManifesto, setCandManifesto] = useState('');
  const [creatingCand, setCreatingCand] = useState(false);

  // Voter Roster & Eligibility States (Module 11.2)
  const [voters, setVoters] = useState([]);
  const [voterTotal, setVoterTotal] = useState(0);
  const [voterPage, setVoterPage] = useState(1);
  const [voterSearch, setVoterSearch] = useState('');
  const [voterStatusFilter, setVoterStatusFilter] = useState('');
  const [loadingVoters, setLoadingVoters] = useState(false);

  // Bulk Import Modal States
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState('paste'); // 'paste' | 'csv' | 'all-org'
  const [rawPastedEmails, setRawPastedEmails] = useState('');
  const [parsedVotersList, setParsedVotersList] = useState([]);
  const [importingVoters, setImportingVoters] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    showLiveTurnout: true,
    requireVoterVerification: true,
    allowCandidateWithdrawal: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Share Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // Email Notification Trigger States
  const [dispatchingEmails, setDispatchingEmails] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState(null);

  const fetchElectionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [elecRes, orgRes, posRes] = await Promise.all([
        fetch(`/api/elections/${electionId}`),
        fetch(`/api/orgs/${orgId}`),
        fetch(`/api/elections/${electionId}/positions`),
      ]);

      const elecJson = await elecRes.json();
      const orgJson = await orgRes.json();
      const posJson = await posRes.json();

      if (!elecRes.ok) {
        throw new Error(elecJson.message || 'Failed to load election details');
      }

      const elecData = elecJson.data;
      setElection(elecData);
      setOrg(orgJson.data || elecData.organization);
      setPositions(posJson.data || elecData.positions || []);

      const formatForInput = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
      };

      setSettingsForm({
        title: elecData.title || '',
        description: elecData.description || '',
        startDate: formatForInput(elecData.startDate),
        endDate: formatForInput(elecData.endDate),
        showLiveTurnout: elecData.config?.showLiveTurnout ?? true,
        requireVoterVerification: elecData.config?.requireVoterVerification ?? true,
        allowCandidateWithdrawal: elecData.config?.allowCandidateWithdrawal ?? true,
      });

      try {
        const qrRes = await fetch(`/api/elections/${electionId}/qrcode?format=png`);
        const qrJson = await qrRes.json();
        if (qrJson.success && qrJson.data?.dataUrl) {
          setQrCodeDataUrl(qrJson.data.dataUrl);
        }
      } catch {
        // Non-blocking
      }
    } catch (err) {
      setError(err.message || 'Error loading election command center');
    } finally {
      setLoading(false);
    }
  }, [electionId, orgId]);

  // Fetch Voter Roster with Filters & Pagination
  const fetchVoters = useCallback(async () => {
    try {
      setLoadingVoters(true);
      let url = `/api/elections/${electionId}/eligibility?page=${voterPage}&limit=20`;
      if (voterSearch.trim()) url += `&search=${encodeURIComponent(voterSearch.trim())}`;
      if (voterStatusFilter) url += `&status=${encodeURIComponent(voterStatusFilter)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.success) {
        setVoters(json.data || []);
        setVoterTotal(json.pagination?.total || (json.data || []).length);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingVoters(false);
    }
  }, [electionId, voterPage, voterSearch, voterStatusFilter]);

  useEffect(() => {
    fetchElectionData();
  }, [fetchElectionData]);

  useEffect(() => {
    if (activeTab === 'roster') {
      fetchVoters();
    }
  }, [activeTab, fetchVoters]);

  // Lifecycle State Transition
  async function handleStatusTransition(newStatus) {
    try {
      setTransitioning(true);
      setError(null);
      setSuccessMsg(null);

      let res;
      if (newStatus === 'published') {
        res = await fetch(`/api/elections/${electionId}/results/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'publish' }),
        });
      } else {
        res = await fetch(`/api/elections/${electionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || `Failed to transition election to ${newStatus}`);
      }

      setSuccessMsg(
        newStatus === 'published'
          ? 'Official results certified and published successfully!'
          : `Election status successfully changed to '${newStatus.toUpperCase()}'.`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchElectionData();
    } catch (err) {
      setError(err.message || 'Failed to update election status');
    } finally {
      setTransitioning(false);
    }
  }

  // Create Position
  async function handleCreatePosition(e) {
    e.preventDefault();
    if (!newPosName.trim()) return;

    try {
      setCreatingPos(true);
      setError(null);

      const res = await fetch(`/api/elections/${electionId}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPosName.trim(),
          description: newPosDesc.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to add position');
      }

      setAddPosModalOpen(false);
      setNewPosName('');
      setNewPosDesc('');
      await fetchElectionData();
      setSuccessMsg('Position created successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'Error creating position');
    } finally {
      setCreatingPos(false);
    }
  }

  // Nominate Candidate
  async function handleCreateCandidate(e) {
    e.preventDefault();
    if (!candName.trim() || !selectedPosId) return;

    try {
      setCreatingCand(true);
      setError(null);

      const res = await fetch(`/api/positions/${selectedPosId}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: candName.trim(),
          photo: candPhoto.trim() || null,
          bio: candBio.trim() || null,
          manifesto: candManifesto.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to add candidate');
      }

      setAddCandModalOpen(false);
      setCandName('');
      setCandBio('');
      setCandPhoto('');
      setCandManifesto('');
      await fetchElectionData();
      setSuccessMsg('Candidate nominated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'Error nominating candidate');
    } finally {
      setCreatingCand(false);
    }
  }

  // Toggle Voter Status (Disqualify / Re-qualify)
  async function handleToggleVoterStatus(eligibilityId, currentStatus) {
    const nextStatus = currentStatus === 'eligible' ? 'disqualified' : 'eligible';
    try {
      const res = await fetch(`/api/elections/${electionId}/eligibility/${eligibilityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to update voter status');
      }
      setSuccessMsg(`Voter status updated to ${nextStatus}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchVoters();
    } catch (err) {
      setError(err.message || 'Error modifying eligibility');
    }
  }

  // Remove Voter from Eligibility Roster
  async function handleRemoveVoter(eligibilityId) {
    if (!window.confirm('Remove this voter from election eligibility?')) return;
    try {
      const res = await fetch(`/api/elections/${electionId}/eligibility/${eligibilityId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to remove voter');
      }
      setSuccessMsg('Voter removed from election roster');
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchVoters();
      await fetchElectionData();
    } catch (err) {
      setError(err.message || 'Error removing voter');
    }
  }

  // Parse Raw Pasted Text into Voters List
  function handleParseRawEmails(text) {
    setRawPastedEmails(text);
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const matches = text.match(emailRegex) || [];
    const uniqueEmails = Array.from(new Set(matches.map((e) => e.toLowerCase().trim())));
    const list = uniqueEmails.map((email) => ({
      email,
      name: email.split('@')[0],
    }));
    setParsedVotersList(list);
  }

  // Handle CSV File Upload
  function handleCsvFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== 'string') return;

      const lines = content.split(/\r?\n/);
      const voters = [];
      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine.toLowerCase().startsWith('email')) continue;

        const parts = cleanLine.split(/,|\t/);
        const email = parts[0]?.trim().toLowerCase();
        const name = parts[1]?.trim() || (email ? email.split('@')[0] : '');

        if (email && email.includes('@')) {
          voters.push({ email, name });
        }
      }

      const uniqueVoters = Array.from(new Map(voters.map((v) => [v.email, v])).values());
      setParsedVotersList(uniqueVoters);
    };
    reader.readAsText(file);
  }

  // Submit Bulk Voter Import
  async function handleSubmitBulkImport() {
    if (parsedVotersList.length === 0) return;

    try {
      setImportingVoters(true);
      setImportResult(null);

      const res = await fetch(`/api/elections/${electionId}/eligibility/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voters: parsedVotersList }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to import voter roster');
      }

      setImportResult(json.data || json.message);
      setSuccessMsg(json.message || `Imported ${parsedVotersList.length} voters successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchElectionData();
      await fetchVoters();
    } catch (err) {
      setError(err.message || 'Failed to import voters');
    } finally {
      setImportingVoters(false);
    }
  }

  // Assign All Active Organization Members
  async function handleAssignAllOrgMembers() {
    try {
      setImportingVoters(true);
      const res = await fetch(`/api/elections/${electionId}/eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignAllActive: true }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to assign organization members');
      }

      setSuccessMsg(`All active organization members enrolled (${json.data?.totalEligibleVoters} total).`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setImportModalOpen(false);
      await fetchElectionData();
      await fetchVoters();
    } catch (err) {
      setError(err.message || 'Error enrolling organization members');
    } finally {
      setImportingVoters(false);
    }
  }

  // Save Settings
  async function handleSaveSettings(e) {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setError(null);
      setSuccessMsg(null);

      const payload = {
        title: settingsForm.title.trim(),
        description: settingsForm.description.trim() || null,
        endDate: settingsForm.endDate ? new Date(settingsForm.endDate) : null,
      };

      // Only modify start date and immutable config if election is not yet live or concluded
      if (!isLive && !isEnded) {
        payload.startDate = settingsForm.startDate ? new Date(settingsForm.startDate) : null;
        payload.config = {
          showLiveTurnout: settingsForm.showLiveTurnout,
          requireVoterVerification: settingsForm.requireVoterVerification,
          allowCandidateWithdrawal: settingsForm.allowCandidateWithdrawal,
        };
      }

      const res = await fetch(`/api/elections/${electionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to update election settings');
      }

      setSuccessMsg('Election settings updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchElectionData();
    } catch (err) {
      setError(err.message || 'Error saving settings');
    } finally {
      setSavingSettings(false);
    }
  }

  // Delete Election
  async function handleDeleteElection() {
    if (!window.confirm('Are you sure you want to permanently delete this election? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/elections/${electionId}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to delete election');
      }

      router.push(`/org/${orgId}/elections`);
    } catch (err) {
      setError(err.message || 'Failed to delete election');
    }
  }

  // Dispatch Invitations / Reminders
  async function handleDispatchEmails(type = 'invitations') {
    try {
      setDispatchingEmails(true);
      setDispatchStatus(null);
      setError(null);

      const endpoint =
        type === 'invitations'
          ? `/api/elections/${electionId}/invitations`
          : `/api/elections/${electionId}/reminders`;

      const res = await fetch(endpoint, { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || `Failed to dispatch ${type}`);
      }

      setDispatchStatus(json.message || `Successfully dispatched ${type}`);
      setTimeout(() => setDispatchStatus(null), 5000);
    } catch (err) {
      setError(err.message || `Failed to send ${type}`);
    } finally {
      setDispatchingEmails(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-14 bg-slate-900 rounded-2xl w-full animate-pulse" />
          <div className="h-40 bg-slate-900 rounded-3xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-28 bg-slate-900 rounded-2xl animate-pulse" />
            <div className="h-28 bg-slate-900 rounded-2xl animate-pulse" />
            <div className="h-28 bg-slate-900 rounded-2xl animate-pulse" />
            <div className="h-28 bg-slate-900 rounded-2xl animate-pulse" />
          </div>
          <div className="h-96 bg-slate-900 rounded-3xl animate-pulse" />
        </div>
      </main>
    );
  }

  if (error && !election) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Election Not Found</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'Election details could not be retrieved.'}</p>
          <Link
            href={`/org/${orgId}/elections`}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all inline-block"
          >
            Back to Elections List
          </Link>
        </div>
      </main>
    );
  }

  if (!loading && org && org.userRole !== 'owner' && org.userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
        <DashboardHeader org={org} />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-16 text-center">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Access Restricted</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              You are signed in as a voter in this organization. Election administration, lifecycle actions, voter rosters, and ballot configuration are restricted to organization owners and administrators.
            </p>
            <div className="pt-4 flex items-center justify-center gap-3">
              <Link
                href={`/org/${orgId}/dashboard`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all border border-slate-700"
              >
                Return to Dashboard
              </Link>
              {election?.status === 'live' && (
                <Link
                  href={`/vote?electionId=${electionId}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/20"
                >
                  <Vote className="h-4 w-4" />
                  <span>Enter Voting Booth</span>
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const status = election.status || 'draft';
  const totalEligible = election.stats?.totalEligible || 0;
  const totalVoted = election.stats?.totalVoted || 0;
  const turnoutRate = election.stats?.turnoutRate || 0;
  const isDraft = status === 'draft';
  const isLive = status === 'live';
  const isEnded = status === 'ended' || status === 'published';

  const votingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/vote?electionId=${election.id}`
    : `/vote?electionId=${election.id}`;

  const whatsAppText = `🗳️ *Official Ballot Invitation: ${election.title}*\n\nCast your verified vote online in the ${org?.name || 'community'} election.\n\n👉 *Vote Now:* ${votingUrl}`;

  const statusStyles = {
    draft: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    live: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse',
    ended: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    published: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    archived: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <DashboardHeader org={org} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb & Navigation Topline */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link href={`/org/${orgId}/dashboard`} className="hover:text-white transition-colors">
              {org?.name || 'Workspace'}
            </Link>
            <span>/</span>
            <Link href={`/org/${orgId}/elections`} className="hover:text-white transition-colors">
              Elections
            </Link>
            <span>/</span>
            <span className="text-slate-200 truncate max-w-xs">{election.title}</span>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2">
            <Link
              href={`/vote?electionId=${election.id}`}
              target="_blank"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Vote className="h-3.5 w-3.5 text-blue-400" />
              <span>Preview Ballot</span>
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </Link>

            <Link
              href={`/org/${orgId}/elections/${election.id}/results`}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-xs font-bold text-purple-300 transition-all flex items-center gap-1.5"
            >
              <Percent className="h-3.5 w-3.5 text-purple-400" />
              <span>Turnout & Results</span>
            </Link>

            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share & Invite</span>
            </button>
          </div>
        </div>

        {/* Hero Card with Status & Action Command Controls */}
        <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-900/50 p-6 sm:p-8 shadow-2xl backdrop-blur-xl overflow-hidden space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${statusStyles[status] || statusStyles.draft}`}>
                  {status === 'live' ? '● Live Voting Open' : status}
                </span>

                {election.startDate && (
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    {new Date(election.startDate).toLocaleDateString()}
                    {election.endDate ? ` — ${new Date(election.endDate).toLocaleDateString()}` : ''}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {election.title}
              </h1>

              {election.description && (
                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                  {election.description}
                </p>
              )}
            </div>

            {/* Lifecycle Command Controls */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              {isDraft && (
                <button
                  type="button"
                  disabled={transitioning || positions.length === 0}
                  onClick={() => handleStatusTransition('live')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  {transitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  <span>Open Live Polls Now</span>
                </button>
              )}

              {isLive && (
                <button
                  type="button"
                  disabled={transitioning}
                  onClick={() => handleStatusTransition('ended')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2"
                >
                  {transitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  <span>Close Polls</span>
                </button>
              )}

              {status === 'ended' && (
                <button
                  type="button"
                  disabled={transitioning}
                  onClick={() => handleStatusTransition('published')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  {transitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>Publish Certified Results</span>
                </button>
              )}

              {isEnded && (
                <button
                  type="button"
                  disabled={transitioning}
                  onClick={() => handleStatusTransition('archived')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all flex items-center gap-1.5"
                >
                  <span>Archive</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 flex items-center gap-2.5 shadow-lg">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 flex items-center gap-2.5 shadow-lg">
            <span className="text-sm">✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {dispatchStatus && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-300 flex items-center gap-2.5 shadow-lg">
            <Send className="h-4 w-4 text-blue-400 shrink-0" />
            <span>{dispatchStatus}</span>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Verified Votes</span>
              <Vote className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalVoted.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400">Total ballots submitted</div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Elector Roster</span>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalEligible.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400">Enrolled voters with access</div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Turnout Rate</span>
              <Percent className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{turnoutRate}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, turnoutRate)}%` }}
              />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Positions & Races</span>
              <Layers className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">{positions.length}</div>
            <div className="text-[11px] text-slate-400">
              {positions.reduce((sum, p) => sum + (p.candidates?.length || 0), 0)} Nominated Candidates
            </div>
          </div>
        </div>

        {/* Command Center Navigation Tabs */}
        <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview & Candidates', icon: Layers },
            { id: 'roster', label: `Voters & Eligibility (${totalEligible})`, icon: Users },
            { id: 'settings', label: 'Election Settings', icon: Settings },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Overview, Positions & Candidates */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-400" />
                  Electoral Positions & Candidate Rosters
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage ballot offices, candidate profiles, photos, and manifestos.
                </p>
              </div>

              {isDraft && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAddPosModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-all flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5 text-blue-400" />
                    <span>Add Position</span>
                  </button>

                  {positions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPosId(positions[0].id);
                        setAddCandModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Nominate Candidate</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {positions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto text-xl font-bold">
                  📋
                </div>
                <h3 className="text-base font-bold text-white">No positions configured yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add the leadership seats or offices to be elected before opening polls to voters.
                </p>
                {isDraft && (
                  <button
                    type="button"
                    onClick={() => setAddPosModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-lg shadow-blue-500/20 transition-all"
                  >
                    Add First Position
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {positions.map((pos, idx) => {
                  const cands = pos.candidates || [];

                  return (
                    <div
                      key={pos.id || idx}
                      className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-xl backdrop-blur-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xs font-bold font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <h3 className="text-base font-bold text-white">{pos.name}</h3>
                            {pos.description && (
                              <p className="text-xs text-slate-400">{pos.description}</p>
                            )}
                          </div>
                        </div>

                        {isDraft && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPosId(pos.id);
                              setAddCandModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 self-start"
                          >
                            <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Add Candidate</span>
                          </button>
                        )}
                      </div>

                      {/* Candidate Cards Grid */}
                      {cands.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/60">
                          No candidates nominated for this position yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {cands.map((cand) => (
                            <div
                              key={cand.id}
                              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                                  {cand.photo ? (
                                    <Image
                                      src={cand.photo}
                                      alt={cand.name}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-slate-400 font-mono">
                                      {cand.name.slice(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-white truncate">{cand.name}</h4>
                                  {cand.bio && (
                                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{cand.bio}</p>
                                  )}
                                </div>
                              </div>

                              {cand.manifesto && (
                                <div className="p-2.5 rounded-xl bg-slate-900 text-[11px] text-slate-300 italic line-clamp-3 border border-slate-800/60">
                                  &ldquo;{cand.manifesto}&rdquo;
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Voter Roster & Eligibility Manager (Module 11.2) */}
        {activeTab === 'roster' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Elector Roster & Eligibility Manager
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enroll eligible voters via CSV, paste emails, or assign members. Dispatch official invitations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Import Voters</span>
                </button>

                <button
                  type="button"
                  disabled={dispatchingEmails || totalEligible === 0}
                  onClick={() => handleDispatchEmails('invitations')}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                >
                  {dispatchingEmails ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 text-blue-400" />}
                  <span>Dispatch Invitations</span>
                </button>

                {isLive && (
                  <button
                    type="button"
                    disabled={dispatchingEmails || totalEligible === 0}
                    onClick={() => handleDispatchEmails('reminders')}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                  >
                    {dispatchingEmails ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                    <span>Turnout Reminders</span>
                  </button>
                )}
              </div>
            </div>

            {/* Roster Metrics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-lg">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Eligible Electors</div>
                <div className="text-2xl font-black text-white">{voterTotal}</div>
                <div className="text-[11px] text-slate-500">Authorized voting accounts</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-lg">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Ballots Cast</div>
                <div className="text-2xl font-black text-emerald-400">{totalVoted}</div>
                <div className="text-[11px] text-slate-500">Verified submissions recorded</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-lg">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending Participation</div>
                <div className="text-2xl font-black text-amber-400">{Math.max(0, voterTotal - totalVoted)}</div>
                <div className="text-[11px] text-slate-500">Awaiting ballot casting</div>
              </div>
            </div>

            {/* Voter Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={voterSearch}
                  onChange={(e) => {
                    setVoterSearch(e.target.value);
                    setVoterPage(1);
                  }}
                  placeholder="Search by voter name or email..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <select
                  value={voterStatusFilter}
                  onChange={(e) => {
                    setVoterStatusFilter(e.target.value);
                    setVoterPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="eligible">Eligible (Not Voted)</option>
                  <option value="voted">Voted (Ballot Cast)</option>
                  <option value="disqualified">Disqualified</option>
                </select>
              </div>
            </div>

            {/* Voter Table */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                      <th className="py-3.5 pl-6">Voter Identity</th>
                      <th className="py-3.5 px-4">Entitlement Status</th>
                      <th className="py-3.5 px-4">Enrolled On</th>
                      <th className="py-3.5 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {loadingVoters ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-400" />
                          <span>Loading voter roster...</span>
                        </td>
                      </tr>
                    ) : voters.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-500">
                          <p className="text-sm font-semibold text-slate-400">No voters found.</p>
                          <p className="text-xs text-slate-500 mt-1">Import a CSV file or paste emails to enroll voters.</p>
                        </td>
                      </tr>
                    ) : (
                      voters.map((item) => {
                        const memberUser = item.member?.user || {};
                        const userName = memberUser.name || 'Electing Member';
                        const userEmail = memberUser.email || 'No email';
                        const isVoted = item.status === 'voted';
                        const isDisqualified = item.status === 'disqualified';

                        return (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 pl-6">
                              <div className="font-bold text-white">{userName}</div>
                              <div className="text-slate-400 font-mono text-[11px]">{userEmail}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              {isVoted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <CheckCheck className="h-3 w-3" /> Voted
                                </span>
                              ) : isDisqualified ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  <Ban className="h-3 w-3" /> Disqualified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  <Check className="h-3 w-3" /> Eligible
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="py-3.5 pr-6 text-right">
                              {!isVoted && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleVoterStatus(item.id, item.status)}
                                    className={`p-1.5 rounded-lg text-xs transition-all ${
                                      isDisqualified
                                        ? 'text-emerald-400 hover:bg-emerald-500/10'
                                        : 'text-amber-400 hover:bg-amber-500/10'
                                    }`}
                                    title={isDisqualified ? 'Re-qualify Voter' : 'Disqualify Voter'}
                                  >
                                    {isDisqualified ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                                  </button>

                                  {!isLive && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveVoter(item.id)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                      title="Remove from Roster"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Election Settings & Governance */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                Election Parameters & Safeguards
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure timeline windows, transparency settings, and voting access rules.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Election Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={settingsForm.title}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Description & Purpose
                  </label>
                  <textarea
                    rows={3}
                    value={settingsForm.description}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Start Voting Date & Time</span>
                      {(isLive || isEnded) && (
                        <span className="text-[10px] text-amber-400 font-normal lowercase flex items-center gap-1">
                          <Lock className="h-3 w-3" /> locked (poll commenced)
                        </span>
                      )}
                    </label>
                    <input
                      type="datetime-local"
                      disabled={isLive || isEnded}
                      value={settingsForm.startDate}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      End Voting Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={settingsForm.endDate}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Governance Checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.showLiveTurnout}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, showLiveTurnout: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Display Live Participation Turnout</div>
                      <div className="text-[11px] text-slate-400">Allows electors to monitor turnout without revealing interim vote totals.</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.requireVoterVerification}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, requireVoterVerification: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">Require Voter Identity Verification</div>
                      <div className="text-[11px] text-slate-400">Strictly ensures one vote per authenticated and verified voter account.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDeleteElection}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Election</span>
                </button>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Parameters</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Bulk Voter Import Modal (Module 11.2) */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Upload className="h-4 w-4 text-blue-400" />
                <span>Import & Enroll Voters</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setImportModalOpen(false);
                  setParsedVotersList([]);
                  setRawPastedEmails('');
                  setImportResult(null);
                }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Import Method Tabs */}
            <div className="flex border-b border-slate-800 gap-2">
              {[
                { id: 'paste', label: 'Paste Emails', icon: FileSpreadsheet },
                { id: 'csv', label: 'Upload CSV', icon: Upload },
                { id: 'all-org', label: 'All Org Members', icon: Users },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setImportTab(tab.id)}
                  className={`px-4 py-2 border-b-2 text-xs font-bold transition-all ${
                    importTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Paste Emails Mode */}
            {importTab === 'paste' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Paste email addresses (separated by commas, spaces, or newlines):
                </label>
                <textarea
                  rows={5}
                  value={rawPastedEmails}
                  onChange={(e) => handleParseRawEmails(e.target.value)}
                  placeholder="voter1@org.edu, voter2@org.edu&#10;voter3@org.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                />
                <div className="text-xs text-slate-400 flex justify-between">
                  <span>Detected Valid Emails: <strong className="text-white">{parsedVotersList.length}</strong></span>
                </div>
              </div>
            )}

            {/* CSV Upload Mode */}
            {importTab === 'csv' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Select CSV file (column headers: <code className="text-blue-400">email, name</code>):
                </label>
                <div className="p-6 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl bg-slate-950/60 text-center space-y-2 cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCsvFile}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">Supports standard UTF-8 CSV exports from Google Sheets, Excel, or SIS.</p>
                </div>
                <div className="text-xs text-slate-400">
                  <span>Detected Valid Voters in File: <strong className="text-white">{parsedVotersList.length}</strong></span>
                </div>
              </div>
            )}

            {/* Assign All Org Members Mode */}
            {importTab === 'all-org' && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Quick Organization Enrollment
                </div>
                <p className="text-xs text-slate-300">
                  Automatically grant voting eligibility to all active members currently registered in <strong className="text-white">{org?.name}</strong>.
                </p>
                <button
                  type="button"
                  disabled={importingVoters}
                  onClick={handleAssignAllOrgMembers}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  {importingVoters ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                  <span>Enroll All Organization Members</span>
                </button>
              </div>
            )}

            {/* Import Summary Results */}
            {importResult && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                {typeof importResult === 'string' ? importResult : `Import complete: ${importResult.newlyEligible} newly enrolled.`}
              </div>
            )}

            {/* Modal Actions */}
            {importTab !== 'all-org' && (
              <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importingVoters || parsedVotersList.length === 0}
                  onClick={handleSubmitBulkImport}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  {importingVoters ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  <span>Import {parsedVotersList.length} Voters</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share & QR Code Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Share2 className="h-4 w-4 text-blue-400" />
                <span>Share & Distribute Ballot</span>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Voting URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Direct Voting Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={votingUrl}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(votingUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* WhatsApp Broadcast */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  WhatsApp Broadcast Message
                </label>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap">
                  {whatsAppText}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(whatsAppText);
                      setCopiedWhatsApp(true);
                      setTimeout(() => setCopiedWhatsApp(false), 2500);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-1"
                  >
                    {copiedWhatsApp ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>Copy Text</span>
                  </button>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <span>Open WhatsApp</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* QR Code */}
              {qrCodeDataUrl && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-md shrink-0">
                      <Image
                        src={qrCodeDataUrl}
                        alt="Election QR Code"
                        width={64}
                        height={64}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Ballot QR Code</div>
                      <div className="text-[11px] text-slate-400">Suitable for posters, notice boards, and flyers.</div>
                    </div>
                  </div>

                  <a
                    href={qrCodeDataUrl}
                    download={`votesphere-election-${election.id}.png`}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all"
                  >
                    Download PNG
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Position Modal */}
      {addPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleCreatePosition} className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              Add Electoral Position
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Position Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newPosName}
                onChange={(e) => setNewPosName(e.target.value)}
                placeholder="e.g. President, Vice President, Treasurer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Description <span className="text-slate-500">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={newPosDesc}
                onChange={(e) => setNewPosDesc(e.target.value)}
                placeholder="Responsibilities and term details..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setAddPosModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingPos}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                {creatingPos ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add Position
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Candidate Modal */}
      {addCandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleCreateCandidate} className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-400" />
              Nominate Candidate Profile
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Position <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedPosId}
                onChange={(e) => setSelectedPosId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Candidate Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={candName}
                onChange={(e) => setCandName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <ImageUpload
              label="Headshot Photo"
              value={candPhoto}
              onChange={(val) => setCandPhoto(val || '')}
              helperText="Upload candidate photo (PNG, JPG, WEBP)"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Bio / Tagline
              </label>
              <input
                type="text"
                value={candBio}
                onChange={(e) => setCandBio(e.target.value)}
                placeholder="e.g. Senior CS Representative"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Manifesto Summary
              </label>
              <textarea
                rows={2}
                value={candManifesto}
                onChange={(e) => setCandManifesto(e.target.value)}
                placeholder="Key goals and platform initiatives..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setAddCandModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingCand}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                {creatingCand ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                Add Candidate
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
