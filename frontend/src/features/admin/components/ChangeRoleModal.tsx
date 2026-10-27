import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../app/components/ui/dialog';
import { Button } from '../../../app/components/ui/button';
import { Badge } from '../../../app/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { UserRole } from '../../../types';

const ROLE_RANKS: Record<string, number> = {
  GUEST: 0,
  USER: 1,
  BOTANIST: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    displayName: string;
    email: string;
    role: string;
  } | null;
  currentUserRole: string;
  currentUserId: string;
  onSave: (newRole: UserRole) => Promise<void>;
}

export function ChangeRoleModal({
  isOpen,
  onClose,
  user,
  currentUserRole,
  currentUserId,
  onSave,
}: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');
  const [isSaving, setIsSaving] = useState(false);

  // Policy calculation
  const isSelf = user?.id === currentUserId;
  const targetRank = user ? (ROLE_RANKS[user.role] ?? 1) : 1;
  const currentRank = ROLE_RANKS[currentUserRole] ?? 0;
  const isTargetHigherOrEqual = targetRank >= currentRank;

  let isAllowed = true;
  let reason = '';
  let allowedRoles: UserRole[] = [];

  if (isSelf) {
    isAllowed = false;
    reason = 'You cannot modify your own role.';
  } else if (isTargetHigherOrEqual) {
    isAllowed = false;
    reason = 'Cannot modify a user with equal or higher privileges.';
  } else if (currentUserRole === 'ADMIN') {
    allowedRoles = ['USER', 'BOTANIST'];
  } else if (currentUserRole === 'SUPER_ADMIN') {
    allowedRoles = ['USER', 'BOTANIST', 'ADMIN'];
  } else {
    isAllowed = false;
    reason = 'Insufficient administrative privileges.';
  }

  useEffect(() => {
    if (allowedRoles.length > 0) {
      const match = allowedRoles.find((r) => r === user?.role);
      setSelectedRole(match || allowedRoles[0]);
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    if (!isAllowed) return;
    setIsSaving(true);
    try {
      await onSave(selectedRole);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Role for {user?.displayName}</DialogTitle>
        </DialogHeader>

        {user && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Current Role:</span>
              <Badge className="bg-slate-100 text-slate-800">{user.role}</Badge>
            </div>

            {!isAllowed ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
                {reason}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Assign New Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white"
                >
                  {allowedRoles.map((r) => (
                    <option key={r} value={r}>
                      {r === 'BOTANIST' ? 'Botanist' : r === 'USER' ? 'Regular User' : r}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  Changing a user's role revokes active refresh tokens immediately.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isAllowed || isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
