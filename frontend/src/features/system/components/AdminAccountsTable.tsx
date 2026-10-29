import React, { useState } from 'react';
import { IAdminAccount, ISessionItem, SystemRole } from '../types/system.types';
import { systemApi } from '../api/system.api';
import {
  ShieldAlert,
  Smartphone,
  Clock,
  KeyRound,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AdminAccountsTableProps {
  admins: IAdminAccount[];
  isLoading?: boolean;
  onRefresh: () => void;
  onRequestReauth: <T>(action: (token: string) => Promise<T>) => Promise<T>;
}

export const AdminAccountsTable: React.FC<AdminAccountsTableProps> = ({
  admins,
  isLoading = false,
  onRefresh,
  onRequestReauth,
}) => {
  const [selectedAdmin, setSelectedAdmin] = useState<IAdminAccount | null>(null);
  const [sessions, setSessions] = useState<ISessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [roleChangeModalAdmin, setRoleChangeModalAdmin] = useState<IAdminAccount | null>(null);
  const [targetRole, setTargetRole] = useState<SystemRole>('USER');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleOpenSessions = async (admin: IAdminAccount) => {
    setSelectedAdmin(admin);
    setLoadingSessions(true);
    setActionError(null);
    try {
      const data = await systemApi.getUserSessions(admin.id);
      setSessions(data || []);
    } catch (err: any) {
      setActionError(err.message || 'Failed to fetch sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!selectedAdmin) return;
    try {
      await onRequestReauth(async (reauthToken) => {
        await systemApi.revokeUserSession(selectedAdmin.id, sessionId, reauthToken);
      });
      // Refresh session list
      const data = await systemApi.getUserSessions(selectedAdmin.id);
      setSessions(data || []);
      setActionSuccess('Session successfully revoked');
    } catch (err: any) {
      setActionError(err.message || 'Failed to revoke session');
    }
  };

  const handleRoleChangeSubmit = async () => {
    if (!roleChangeModalAdmin) return;
    setActionError(null);
    try {
      await onRequestReauth(async (reauthToken) => {
        await systemApi.updateUserRole(roleChangeModalAdmin.id, targetRole, reauthToken);
      });
      setRoleChangeModalAdmin(null);
      setActionSuccess(`Role updated to ${targetRole}`);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to change role');
    }
  };

  return (
    <div className="space-y-4">
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="border border-emerald-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-50/70 border-b border-emerald-100 text-emerald-900 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Admin Account</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">2FA Status</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4">Actions (30d)</th>
                <th className="py-3 px-4 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Loading administrator accounts...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No administrator accounts found.
                  </td>
                </tr>
              ) : (
                admins.map((admin, idx) => (
                  <tr key={admin.id || (admin as any)._id || admin.email || idx} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0">
                          {admin.avatarUrl ? (
                            <img src={admin.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            admin.displayName.slice(0, 2)
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{admin.displayName}</p>
                          <p className="text-[11px] text-gray-500 font-mono">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          admin.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {admin.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {admin.is2faEnabled ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <Smartphone className="w-3.5 h-3.5" />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                          <SmartphoneOff className="w-3.5 h-3.5" />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] uppercase font-semibold">
                        {admin.provider}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {admin.lastActiveAt
                          ? formatDistanceToNow(new Date(admin.lastActiveAt), { addSuffix: true })
                          : 'Never'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-semibold text-gray-800">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        {admin.actionsInLast30Days}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenSessions(admin)}
                          className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          Sessions
                        </button>
                        {admin.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => {
                              setRoleChangeModalAdmin(admin);
                              setTargetRole('USER');
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                          >
                            Change Role
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Sessions Modal */}
      {selectedAdmin && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Active Sessions for {selectedAdmin.displayName}</h3>
                <p className="text-xs text-emerald-200">{selectedAdmin.email}</p>
              </div>
              <button onClick={() => setSelectedAdmin(null)} className="text-emerald-200 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {loadingSessions ? (
                <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  Loading active devices...
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-center text-gray-500 py-6 text-xs">No active sessions found for this user.</p>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-3 border border-gray-200 rounded-xl flex items-center justify-between bg-gray-50 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{sess.device}</p>
                      <p className="text-[11px] text-gray-500 font-mono">
                        {sess.ip} • Last used{' '}
                        {sess.lastUsedAt ? formatDistanceToNow(new Date(sess.lastUsedAt), { addSuffix: true }) : 'recently'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeSession(sess.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Revoke
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-right">
              <button
                onClick={() => setSelectedAdmin(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {roleChangeModalAdmin && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm">Update Account Role</h3>
            </div>
            <p className="text-xs text-gray-600">
              Select the new role for <span className="font-semibold">{roleChangeModalAdmin.displayName}</span>. Granting or
              revoking the ADMIN role will require your step-up re-authentication.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">New Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as SystemRole)}
                className="w-full p-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="USER">USER (Regular Member)</option>
                <option value="BOTANIST">BOTANIST (Contributor)</option>
                <option value="ADMIN">ADMIN (Platform Administrator)</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setRoleChangeModalAdmin(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChangeSubmit}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
