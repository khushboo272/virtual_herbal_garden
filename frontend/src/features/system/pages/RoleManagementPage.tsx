import React, { useState, useEffect, useCallback } from 'react';
import { useAdminUsers } from '../../../hooks/useAdmin';
import { systemApi } from '../api/system.api';
import { useReauth } from '../hooks/useReauth';
import { ReauthDialog } from '../components/ReauthDialog';
import { AdminAccountsTable } from '../components/AdminAccountsTable';
import { PermissionMatrixTable } from '../components/PermissionMatrixTable';
import { IAdminAccount, ICapability, SystemRole } from '../types/system.types';
import {
  Users,
  ShieldAlert,
  Search,
  Filter,
  KeyRound,
  CheckCircle2,
  X,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export const RoleManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'admins' | 'matrix'>('users');

  // Document title
  useEffect(() => {
    document.title = 'Role Management — Virtual Herbal Garden';
  }, []);

  // Reauth hook
  const {
    isOpen: isReauthOpen,
    openDialog: openReauthDialog,
    closeDialog: closeReauthDialog,
    submitReauth,
    executeWithReauth,
    isLoading: isReauthLoading,
    error: reauthError,
  } = useReauth();

  // Tab 1: Users & Roles
  const { users, isLoading: isUsersLoading, fetchUsers } = useAdminUsers();
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<any | null>(null);
  const [newRoleSelection, setNewRoleSelection] = useState<SystemRole>('USER');

  // Tab 2: Admin Accounts
  const [admins, setAdmins] = useState<IAdminAccount[]>([]);
  const [isAdminsLoading, setIsAdminsLoading] = useState(false);

  // Tab 3: Permission Matrix
  const [capabilities, setCapabilities] = useState<ICapability[]>([]);
  const [isMatrixLoading, setIsMatrixLoading] = useState(false);

  // Status feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAdmins = useCallback(async () => {
    setIsAdminsLoading(true);
    try {
      const data = await systemApi.getAdmins();
      setAdmins(data || []);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load administrator accounts' });
    } finally {
      setIsAdminsLoading(false);
    }
  }, []);

  const loadMatrix = useCallback(async () => {
    setIsMatrixLoading(true);
    try {
      const data = await systemApi.getRolesMatrix();
      setCapabilities(data?.capabilities || []);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load permission matrix' });
    } finally {
      setIsMatrixLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'admins') {
      loadAdmins();
    } else if (activeTab === 'matrix') {
      loadMatrix();
    }
  }, [activeTab, loadAdmins, loadMatrix]);

  // Compute stats safely
  const roleCounts: Record<string, number> = {
    GUEST: 0,
    USER: 0,
    BOTANIST: 0,
    ADMIN: 0,
    SUPER_ADMIN: 0,
  };
  (users || []).forEach((u) => {
    if (u && u.role) {
      roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
    }
  });

  // Filtered users
  const filteredUsers = (users || []).filter((u) => {
    const matchesSearch =
      !userSearch.trim() ||
      u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChangeSubmit = async () => {
    if (!selectedUserForRoleChange) return;
    setStatusMessage(null);
    try {
      await executeWithReauth(async (reauthToken) => {
        await systemApi.updateUserRole(
          selectedUserForRoleChange._id || selectedUserForRoleChange.id,
          newRoleSelection,
          reauthToken,
        );
      });
      setSelectedUserForRoleChange(null);
      setStatusMessage({
        type: 'success',
        text: `Role for ${selectedUserForRoleChange.displayName} updated to ${newRoleSelection}`,
      });
      fetchUsers();
      if (activeTab === 'admins') loadAdmins();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update user role' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">Role Management</h1>
          <p className="text-xs sm:text-sm text-emerald-700/80 mt-1">
            Govern role hierarchy, administer privileged accounts, and inspect platform capabilities.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-emerald-50 border border-emerald-200 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-white text-emerald-900 shadow-sm border border-emerald-200'
                : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            Users & Roles
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'admins'
                ? 'bg-white text-emerald-900 shadow-sm border border-emerald-200'
                : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Admin Accounts
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'matrix'
                ? 'bg-white text-emerald-900 shadow-sm border border-emerald-200'
                : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Permission Matrix
          </button>
        </div>
      </div>

      {/* Notifications banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Role Counts Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {['GUEST', 'USER', 'BOTANIST', 'ADMIN', 'SUPER_ADMIN'].map((role) => (
          <div key={role} className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm text-center">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{role.replace('_', ' ')}</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">{roleCounts[role] || 0}</p>
          </div>
        ))}
      </div>

      {/* TAB 1: Users & Roles */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 border border-emerald-100 rounded-2xl shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="p-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="ALL">All Roles</option>
                <option value="USER">USER</option>
                <option value="BOTANIST">BOTANIST</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="border border-emerald-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50/70 border-b border-emerald-100 text-emerald-900 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-400">
                        Loading registered members...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-500">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u._id === currentUser?._id || u.email === currentUser?.email;
                      const isSuperAdmin = u.role === 'SUPER_ADMIN';

                      return (
                        <tr key={u._id || u.id} className="hover:bg-emerald-50/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  (u.displayName || u.email || 'U').slice(0, 2)
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                                  {u.displayName}
                                  {isSelf && (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-gray-500 font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                u.role === 'SUPER_ADMIN'
                                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                                  : u.role === 'ADMIN'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : u.role === 'BOTANIST'
                                  ? 'bg-teal-100 text-teal-800 border-teal-300'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                                u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {u.isActive !== false ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedUserForRoleChange(u);
                                setNewRoleSelection(u.role === 'ADMIN' ? 'USER' : 'ADMIN');
                              }}
                              disabled={isSelf || isSuperAdmin}
                              title={
                                isSelf
                                  ? 'You cannot modify your own role'
                                  : isSuperAdmin
                                  ? 'Super Admin roles cannot be modified via API'
                                  : 'Change user role'
                              }
                              className="px-2.5 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Change Role
                            </button>
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

      {/* TAB 2: Admin Accounts */}
      {activeTab === 'admins' && (
        <AdminAccountsTable
          admins={admins}
          isLoading={isAdminsLoading}
          onRefresh={loadAdmins}
          onRequestReauth={executeWithReauth}
        />
      )}

      {/* TAB 3: Permission Matrix */}
      {activeTab === 'matrix' && (
        <PermissionMatrixTable capabilities={capabilities} isLoading={isMatrixLoading} />
      )}

      {/* Role Change Modal */}
      {selectedUserForRoleChange && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm">Change Account Role</h3>
            </div>
            <p className="text-xs text-gray-600">
              Update role for <span className="font-semibold text-gray-900">{selectedUserForRoleChange.displayName}</span> ({selectedUserForRoleChange.email}).
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Select New Role</label>
              <select
                value={newRoleSelection}
                onChange={(e) => setNewRoleSelection(e.target.value as SystemRole)}
                className="w-full p-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="USER">USER (Regular Consumer)</option>
                <option value="BOTANIST">BOTANIST (Herbal Researcher)</option>
                <option value="ADMIN">ADMIN (Platform Administrator)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedUserForRoleChange(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleChangeSubmit}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-Authentication Modal */}
      <ReauthDialog
        isOpen={isReauthOpen}
        onClose={closeReauthDialog}
        onSubmit={submitReauth}
        isLoading={isReauthLoading}
        errorMessage={reauthError}
        actionTitle="Confirm Role Modification"
        actionDescription="Modifying administrator account privileges requires recent step-up authentication. Please verify your credentials."
      />
    </div>
  );
};
