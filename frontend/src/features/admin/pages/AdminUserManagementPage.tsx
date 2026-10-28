import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  Ban,
  Unlock,
  LogOut,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  X,
  Activity,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { Badge } from '../../../app/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../app/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../app/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../app/components/ui/dialog';
import { Textarea } from '../../../app/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../app/components/ui/tooltip';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getAdminUsers,
  getAdminUserDetail,
  updateUserRole,
  banUser,
  forceLogoutUser,
} from '../api/adminApi';
import type {
  AdminUserListItem,
  AdminUserDetail,
  PaginationData,
  UserRole,
} from '../types/admin.types';
import {
  safeFormatDate,
  safeRole,
  safeRoleBadgeClass,
  safeDisplayName,
  safeAvatarInitial,
  safeCount,
  ROLE_HIERARCHY,
  ROLE_BADGES,
} from '../utils/adminFormatters';
import { toast } from 'sonner';

export function AdminUserManagementPage() {
  const { user: currentActor } = useAuth();
  const actorRole = (currentActor?.role || 'ADMIN') as UserRole;
  const actorId = currentActor?._id || currentActor?.sub || '';

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');

  // Detail Drawer State
  const [drawerUser, setDrawerUser] = useState<AdminUserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modals
  const [roleModalTarget, setRoleModalTarget] = useState<AdminUserListItem | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<UserRole>('USER');
  const [banModalTarget, setBanModalTarget] = useState<AdminUserListItem | null>(null);
  const [banReason, setBanReason] = useState('');
  const [bannedUntilDate, setBannedUntilDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadUsers = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminUsers({
        q,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        provider: providerFilter !== 'ALL' ? providerFilter : undefined,
        page,
        limit: 20,
      });
      setUsers(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, [roleFilter, statusFilter, providerFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(1);
  };

  // Open User Detail Drawer
  const handleOpenDetail = async (targetId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await getAdminUserDetail(targetId);
      setDrawerUser(detail);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load user details');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Role Policy Check for UI
  const getRoleChangePolicy = (target: AdminUserListItem): { allowed: boolean; allowedRoles: UserRole[]; reason?: string } => {
    if (target.id === actorId || target._id === actorId) {
      return { allowed: false, allowedRoles: [], reason: 'You cannot modify your own role.' };
    }

    const actorLevel = ROLE_HIERARCHY[actorRole] ?? 0;
    const targetLevel = ROLE_HIERARCHY[target.role] ?? 0;

    if (targetLevel >= actorLevel) {
      return { allowed: false, allowedRoles: [], reason: 'Cannot modify a user with an equal or higher administrative role.' };
    }

    if (actorRole === 'ADMIN') {
      if (target.role === 'USER') {
        return { allowed: true, allowedRoles: ['BOTANIST'] };
      }
      if (target.role === 'BOTANIST') {
        return { allowed: true, allowedRoles: ['USER'] };
      }
      return { allowed: false, allowedRoles: [], reason: 'Admins may only toggle USER and BOTANIST roles.' };
    }

    if (actorRole === 'SUPER_ADMIN') {
      const roles: UserRole[] = (['USER', 'BOTANIST', 'ADMIN'] as UserRole[]).filter((r) => r !== target.role);
      return { allowed: true, allowedRoles: roles };
    }

    return { allowed: false, allowedRoles: [], reason: 'Insufficient privileges.' };
  };

  // Execute Role Change
  const handleConfirmRoleChange = async () => {
    if (!roleModalTarget) return;
    try {
      setIsProcessing(true);
      await updateUserRole(roleModalTarget.id || roleModalTarget._id, newSelectedRole);
      toast.success(`Role updated to ${newSelectedRole} for ${roleModalTarget.displayName}`);
      setRoleModalTarget(null);
      loadUsers(pagination.page);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update user role');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Ban / Unban
  const handleConfirmBan = async (shouldBan: boolean) => {
    if (!banModalTarget) return;
    try {
      setIsProcessing(true);
      await banUser(banModalTarget.id || banModalTarget._id, {
        isActive: !shouldBan,
        banReason: shouldBan ? banReason.trim() : undefined,
        bannedUntil: shouldBan && bannedUntilDate ? bannedUntilDate : null,
      });
      toast.success(shouldBan ? 'User account suspended.' : 'User account reinstated.');
      setBanModalTarget(null);
      setBanReason('');
      setBannedUntilDate('');
      loadUsers(pagination.page);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update ban status');
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct Reinstate for already suspended users
  const handleReinstate = async (u: AdminUserListItem) => {
    try {
      setIsProcessing(true);
      await banUser(u.id || u._id, {
        isActive: true,
        banReason: undefined,
        bannedUntil: null,
      });
      toast.success(`Account reinstated for ${u.displayName}`);
      loadUsers(pagination.page);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reinstate user');
    } finally {
      setIsProcessing(false);
    }
  };

  // Force Logout
  const handleForceLogout = async (u: AdminUserListItem) => {
    if (!window.confirm(`Force log out all active sessions for ${u.displayName}?`)) return;
    try {
      await forceLogoutUser(u.id || u._id);
      toast.success(`Active sessions revoked for ${u.displayName}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to force logout');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
        <p className="text-slate-600 mt-1">Manage accounts, enforce role policies, and review user audit activity</p>
      </div>

      {/* Filter and Search Card */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search users by name, email..."
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">USER</option>
              <option value="BOTANIST">BOTANIST</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active Only</option>
              <option value="banned">Banned / Suspended</option>
            </select>

            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 outline-none"
            >
              <option value="ALL">All Providers</option>
              <option value="google">Google OAuth</option>
              <option value="local">Email / Local</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 animate-pulse">Loading users...</div>
          ) : error ? (
            <div className="py-14 px-4 text-center space-y-4">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
              <div>
                <h3 className="font-semibold text-slate-800 text-base">Failed to load users</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => loadUsers(pagination.page)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : !Array.isArray(users) || users.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-semibold text-slate-800 text-base">No users found</h3>
              <p className="text-sm text-slate-500">Try modifying your search criteria or role filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const policy = getRoleChangePolicy(u);
                  const userDisplayName = safeDisplayName(u);
                  const userInitial = safeAvatarInitial(userDisplayName);
                  const userRole = safeRole(u.role);
                  return (
                    <TableRow key={u.id || u._id} className="hover:bg-slate-50/60">
                      <TableCell>
                        <div
                          onClick={() => handleOpenDetail(u.id || u._id)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {userInitial}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:text-green-700 transition-colors block">
                              {userDisplayName}
                            </span>
                            <span className="text-xs text-slate-400 block">{u.email || 'No email'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={safeRoleBadgeClass(userRole)}>
                          {userRole}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.isBanned || !u.isActive ? (
                          <Badge variant="destructive" className="text-xs">
                            Suspended
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-xs">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-600 uppercase font-mono">
                          {u.provider ? String(u.provider).toUpperCase() : 'LOCAL'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {safeFormatDate(u.createdAt, 'N/A')}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {safeFormatDate(u.lastActiveAt, 'Never')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details Drawer Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-600 hover:text-slate-900"
                            title="View User Details"
                            onClick={() => handleOpenDetail(u.id || u._id)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {/* Role Change with Tooltip */}
                          {policy.allowed ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-green-700 border-green-300 hover:bg-green-50"
                              onClick={() => {
                                setRoleModalTarget(u);
                                setNewSelectedRole(policy.allowedRoles[0]);
                              }}
                            >
                              <Shield className="w-3.5 h-3.5 mr-1" />
                              Role
                            </Button>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled
                                      className="h-8 px-2.5 text-xs opacity-40 cursor-not-allowed"
                                    >
                                      <Shield className="w-3.5 h-3.5 mr-1" />
                                      Role
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">{policy.reason}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          {/* Ban / Unban */}
                          {policy.allowed ? (
                            u.isBanned || !u.isActive ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-green-700 hover:text-green-800 hover:bg-green-50"
                                title="Reinstate User"
                                onClick={() => handleReinstate(u)}
                              >
                                <Unlock className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                                title="Suspend Account"
                                onClick={() => {
                                  setBanModalTarget(u);
                                  setBanReason('');
                                  setBannedUntilDate('');
                                }}
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </Button>
                            )
                          ) : null}

                          {/* Force Logout */}
                          {policy.allowed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-slate-500 hover:text-slate-800"
                              title="Force Logout"
                              onClick={() => handleForceLogout(u)}
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
              <span>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => loadUsers(pagination.page - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadUsers(pagination.page + 1)}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Change Modal */}
      <Dialog open={roleModalTarget !== null} onOpenChange={() => setRoleModalTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role for {roleModalTarget?.displayName}</DialogTitle>
          </DialogHeader>
          {roleModalTarget && (
            <div className="space-y-4 text-sm text-slate-700">
              <p>
                Current Role: <Badge className={ROLE_BADGES[roleModalTarget.role]}>{roleModalTarget.role}</Badge>
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Assign New Role
                </label>
                <select
                  value={newSelectedRole}
                  onChange={(e) => setNewSelectedRole(e.target.value as UserRole)}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white"
                >
                  {getRoleChangePolicy(roleModalTarget).allowedRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500">
                Changing a user's role revokes all their active refresh tokens and triggers an immediate email notification.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleModalTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-green-700 hover:bg-green-800 text-white"
              disabled={isProcessing}
              onClick={handleConfirmRoleChange}
            >
              Confirm Role Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban / Suspension Modal */}
      <Dialog open={banModalTarget !== null} onOpenChange={() => setBanModalTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" /> Suspend Account
            </DialogTitle>
          </DialogHeader>
          {banModalTarget && (
            <div className="space-y-4 text-sm text-slate-700">
              <p>
                You are suspending <strong>{banModalTarget.displayName}</strong> ({banModalTarget.email}).
                The user will be immediately logged out and blocked from logging in.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Suspension Reason (Required)
                </label>
                <Textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Terms of service violation: spamming botanical comments."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Ban Until (Optional — leave empty for indefinite)
                </label>
                <Input
                  type="date"
                  value={bannedUntilDate}
                  onChange={(e) => setBannedUntilDate(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanModalTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isProcessing || !banReason.trim()}
              onClick={() => handleConfirmBan(true)}
            >
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Drawer / Modal */}
      <Dialog open={drawerUser !== null} onOpenChange={() => setDrawerUser(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-700" /> User Profile & Activity
            </DialogTitle>
          </DialogHeader>

          {drawerUser && (
            <div className="space-y-6 text-sm text-slate-700">
              {/* Profile Header */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{safeDisplayName(drawerUser.user)}</h3>
                  <p className="text-xs text-slate-500">{drawerUser.user?.email || 'No email'}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Provider: {drawerUser.user?.provider ? String(drawerUser.user.provider).toUpperCase() : 'LOCAL'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={safeRoleBadgeClass(drawerUser.user?.role)}>
                    {safeRole(drawerUser.user?.role)}
                  </Badge>
                  <p className="text-xs text-slate-400 mt-2">
                    Joined {safeFormatDate(drawerUser.user?.createdAt, 'N/A')}
                  </p>
                </div>
              </div>

              {/* Stats Counters */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Platform Activity Counts</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-xl font-bold text-slate-900 block">{safeCount(drawerUser.counts?.contributions)}</span>
                    <span className="text-xs text-slate-500">Contributions</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-xl font-bold text-slate-900 block">{safeCount(drawerUser.counts?.scans)}</span>
                    <span className="text-xs text-slate-500">AI Scans</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-xl font-bold text-slate-900 block">{safeCount(drawerUser.counts?.bookmarks)}</span>
                    <span className="text-xs text-slate-500">Bookmarks</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-xl font-bold text-slate-900 block">{safeCount(drawerUser.counts?.tourCompletions)}</span>
                    <span className="text-xs text-slate-500">Tours Done</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity Log */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Recent 20 Activity Logs</h4>
                {!Array.isArray(drawerUser.recentActivity) || drawerUser.recentActivity.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No activity recorded for this user.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-100 rounded-lg p-2">
                    {drawerUser.recentActivity.map((act) => (
                      <div key={act.id || act._id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {act.action || 'LOG'}
                          </Badge>
                          <span className="text-slate-800">{act.entityType || ''}</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {safeFormatDate(act.createdAt, 'N/A')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDrawerUser(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
