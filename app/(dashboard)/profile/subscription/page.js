'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import CurrentPlanCard from '@/components/profile/CurrentPlanCard';

export default function WorkspaceSubscriptionPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  const fetchProfile = useCallback(async (orgId = null) => {
    try {
      setLoading(true);
      const url = orgId ? `/api/user/profile?orgId=${encodeURIComponent(orgId)}` : '/api/user/profile';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setProfile(json.data);
        if (!orgId && json.data?.currentSubscription?.organization?.id) {
          setSelectedOrgId(json.data.currentSubscription.organization.id);
        }
      }
    } catch (err) {
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSelectOrg = (newOrgId) => {
    setSelectedOrgId(newOrgId);
    fetchProfile(newOrgId);
  };

  if (loading && !profile) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading subscription and tier telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Plan Component */}
      <CurrentPlanCard
        currentSubscription={profile?.currentSubscription}
        userOrganizations={profile?.userOrganizations || []}
        selectedOrgId={selectedOrgId}
        onSelectOrg={handleSelectOrg}
      />
    </div>
  );
}

