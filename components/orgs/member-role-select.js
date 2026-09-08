'use client';

import { useState } from 'react';
import { Shield, ShieldAlert, User, Loader2 } from 'lucide-react';

/**
 * Member role selector component.
 *
 * @param {{
 *   memberId: string,
 *   currentRole: 'owner' | 'admin' | 'voter',
 *   canManage: boolean,
 *   isOwner: boolean,
 *   onRoleChange: (memberId: string, newRole: string) => Promise<void>
 * }} props
 */
export default function MemberRoleSelect({
  memberId,
  currentRole,
  canManage,
  isOwner,
  onRoleChange,
}) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const newRole = e.target.value;
    if (newRole === role) return;

    try {
      setLoading(true);
      await onRoleChange(memberId, newRole);
      setRole(newRole);
    } catch {
      // Revert on failure
      setRole(currentRole);
    } finally {
      setLoading(false);
    }
  };

  // If this member is the owner or the caller cannot manage roles, render static badge
  if (isOwner || !canManage || currentRole === 'owner') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500">
        <ShieldAlert className="h-3.5 w-3.5" />
        <span className="capitalize">{currentRole}</span>
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      {loading ? (
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Updating...</span>
        </div>
      ) : (
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-2.5 text-muted-foreground">
            {role === 'admin' ? (
              <Shield className="h-3.5 w-3.5 text-blue-400" />
            ) : (
              <User className="h-3.5 w-3.5 text-emerald-400" />
            )}
          </span>
          <select
            value={role}
            onChange={handleChange}
            className="cursor-pointer appearance-none rounded-lg border border-border/80 bg-background/80 py-1.5 pl-8 pr-7 text-xs font-medium text-foreground transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="admin">Admin</option>
            <option value="voter">Voter</option>
          </select>
          <span className="pointer-events-none absolute right-2 text-xs text-muted-foreground">
            ▾
          </span>
        </div>
      )}
    </div>
  );
}
