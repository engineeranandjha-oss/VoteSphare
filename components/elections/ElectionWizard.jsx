'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PositionManager from './PositionManager';
import CandidateManager from './CandidateManager';
import EligibilityAssigner from './EligibilityAssigner';
import {
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { startGlobalProgress, completeGlobalProgress } from '@/components/common/GlobalProgressProvider';

export default function ElectionWizard({ orgId }) {
  const router = useRouter();
  const [org, setOrg] = useState(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrg() {
      try {
        setLoadingOrg(true);
        const res = await fetch(`/api/orgs/${orgId}`);
        const json = await res.json();
        if (res.ok && json.success) {
          setOrg(json.data);
        }
      } catch {
        // Non-blocking
      } finally {
        setLoadingOrg(false);
      }
    }
    if (orgId) {
      loadOrg();
    }
  }, [orgId]);

  // STEP 1: General Details & Settings
  const [generalData, setGeneralData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    winningRule: 'plurality',
    majorityThreshold: 50,
    quorumPercentage: 0,
    showLiveTurnout: true,
  });

  // STEP 2: Positions
  const [positions, setPositions] = useState([
    {
      tempId: 'pos-1',
      name: 'President',
      description: 'Head of Organization',
      maxSelections: 1,
      order: 1,
    },
  ]);

  // STEP 3: Candidates
  const [candidates, setCandidates] = useState([]);

  // STEP 4: Eligibility & Launch
  const [assignAllActive, setAssignAllActive] = useState(true);
  const [notifyVoters, setNotifyVoters] = useState(true);
  const [launchAction, setLaunchAction] = useState('draft');

  function validateStep1() {
    if (!generalData.title.trim()) {
      setError('Election title is required.');
      return false;
    }
    if (generalData.startDate && generalData.endDate) {
      if (new Date(generalData.endDate) <= new Date(generalData.startDate)) {
        setError('End date must be scheduled after the start date.');
        return false;
      }
    }
    setError(null);
    return true;
  }

  function validateStep2() {
    if (positions.length === 0) {
      setError('You must configure at least one position for this election.');
      return false;
    }
    setError(null);
    return true;
  }

  function validateStep3() {
    for (const pos of positions) {
      const posCandidates = candidates.filter(
        (c) => c.positionTempId === pos.tempId
      );
      if (posCandidates.length === 0) {
        setError(
          `Position "${pos.name}" must have at least one candidate before launching.`
        );
        return false;
      }
    }
    setError(null);
    return true;
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setError(null);
    setStep((prev) => Math.min(prev + 1, 4));
  }

  function handleBack() {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      startGlobalProgress();
      setError(null);

      // 1. Create Election Record
      const electionPayload = {
        title: generalData.title.trim(),
        description: generalData.description.trim() || null,
        startDate: generalData.startDate || null,
        endDate: generalData.endDate || null,
        config: {
          winningRule: generalData.winningRule,
          majorityThreshold:
            generalData.winningRule === 'threshold'
              ? Number(generalData.majorityThreshold) || 50
              : 50,
          quorumPercentage: Number(generalData.quorumPercentage) || 0,
          showLiveTurnout: generalData.showLiveTurnout,
        },
      };

      const elecRes = await fetch(`/api/orgs/${orgId}/elections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(electionPayload),
      });

      const elecJson = await elecRes.json();
      if (!elecRes.ok) {
        throw new Error(elecJson.message || 'Failed to create election');
      }

      const createdElection = elecJson.data;
      const electionId = createdElection.id;

      // 2. Create Positions & Map Temporary IDs
      const posIdMap = new Map();
      for (const pos of positions) {
        const posRes = await fetch(`/api/elections/${electionId}/positions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: pos.name,
            description: pos.description,
            maxSelections: pos.maxSelections,
            order: pos.order,
          }),
        });

        const posJson = await posRes.json();
        if (posRes.ok) {
          posIdMap.set(pos.tempId, posJson.data.id);
        }
      }

      // 3. Create Candidates
      for (const cand of candidates) {
        const realPosId = posIdMap.get(cand.positionTempId);
        if (realPosId) {
          await fetch(`/api/positions/${realPosId}/candidates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: cand.name,
              bio: cand.bio,
              photo: cand.photo,
              manifesto: cand.manifesto,
            }),
          });
        }
      }

      // 4. Assign Voter Eligibility
      await fetch(`/api/elections/${electionId}/eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignAllActive: Boolean(assignAllActive),
        }),
      });

      // 5. Update Status if Launch Action is 'scheduled' or 'live'
      if (launchAction === 'scheduled' || launchAction === 'live') {
        await fetch(`/api/elections/${electionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: launchAction,
          }),
        });
      }

      // 6. Transition to Election Management View
      router.push(`/org/${orgId}/elections`);
    } catch (err) {
      setError(err.message || 'An error occurred during election creation');
      setSubmitting(false);
    } finally {
      completeGlobalProgress();
    }
  }

  if (!loadingOrg && org && org.userRole !== 'owner' && org.userRole !== 'admin') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          You are signed in as a voter in this organization. Election creation is restricted to organization owners and administrators.
        </p>
        <div className="pt-4">
          <Link
            href={`/org/${orgId}/dashboard`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/20"
          >
            Return to Workspace Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { num: 1, label: 'General Info', icon: Calendar },
          { num: 2, label: 'Positions', icon: Layers },
          { num: 3, label: 'Candidates', icon: Users },
          { num: 4, label: 'Launch', icon: CheckCircle2 },
        ].map((s) => {
          const IconComponent = s.icon;
          const isActive = step === s.num;
          const isComplete = step > s.num;

          return (
            <div
              key={s.num}
              className={`p-3.5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10'
                  : isComplete
                    ? 'bg-slate-900 border-emerald-500/30'
                    : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : isComplete
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isComplete ? '✓' : <IconComponent className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <div className="text-[11px] text-slate-400 font-medium">Step {s.num}</div>
                  <div className="text-xs font-bold text-white truncate">{s.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 flex items-center gap-2.5">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: General Details & Schedule */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Election Details & Rules
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure election title, voting dates, winning rules, and quorum thresholds.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Election Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={generalData.title}
                  onChange={(e) => setGeneralData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Student Council General Elections 2026"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={generalData.description}
                  onChange={(e) => setGeneralData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide background, guidelines, and voting instructions..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Timeline Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Start Date & Time <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={generalData.startDate}
                    onChange={(e) => setGeneralData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    End Date & Time <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={generalData.endDate}
                    onChange={(e) => setGeneralData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Winning Rule & Quorum */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Winning Rule
                  </label>
                  <select
                    value={generalData.winningRule}
                    onChange={(e) => setGeneralData((prev) => ({ ...prev, winningRule: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="plurality">Plurality (First-Past-The-Post / Most Votes)</option>
                    <option value="absolute_majority">Absolute Majority (50% + 1 Vote Required)</option>
                    <option value="threshold">Custom Supermajority Threshold (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Quorum Target (% Participation)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={generalData.quorumPercentage}
                    onChange={(e) => setGeneralData((prev) => ({ ...prev, quorumPercentage: e.target.value }))}
                    placeholder="e.g. 50 for 50% quorum"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Positions Setup */}
        {step === 2 && (
          <PositionManager positions={positions} onChange={setPositions} />
        )}

        {/* STEP 3: Candidates Setup */}
        {step === 3 && (
          <CandidateManager
            positions={positions}
            candidates={candidates}
            onChange={setCandidates}
          />
        )}

        {/* STEP 4: Eligibility & Launch */}
        {step === 4 && (
          <EligibilityAssigner
            assignAllActive={assignAllActive}
            onAssignAllChange={setAssignAllActive}
            notifyVoters={notifyVoters}
            onNotifyVotersChange={setNotifyVoters}
            launchAction={launchAction}
            onLaunchActionChange={setLaunchAction}
          />
        )}

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
          {step > 1 ? (
            <button
              type="button"
              disabled={submitting}
              onClick={handleBack}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              Next Step <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              aria-busy={submitting}
              onClick={handleSubmit}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-xs sm:text-sm text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {launchAction === 'live'
                      ? 'Building Ballot & Launching...'
                      : launchAction === 'scheduled'
                        ? 'Scheduling Election...'
                        : 'Creating Election Draft...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {launchAction === 'live'
                    ? 'Launch Live Election'
                    : launchAction === 'scheduled'
                      ? 'Schedule Election'
                      : 'Save Election as Draft'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
