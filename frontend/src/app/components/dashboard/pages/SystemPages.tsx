// ──────────────────────────────────────────────────────────
// System pages for SUPER_ADMIN — /dashboard/system/*
// ──────────────────────────────────────────────────────────

import { Wrench, Shield, Users, ScrollText, Cpu, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../ui/table';
import { useAdminUsers } from '../../../../hooks/useAdmin';

// ── System Overview — /dashboard/system ──────────────────
export { SystemOverviewPage } from '../../../../features/system/pages/SystemOverviewPage';

// ── Feature Flags — /dashboard/system/feature-flags ──────
export { FeatureFlagsPage } from '../../../../features/system/pages/FeatureFlagsPage';


// ── Role Management — /dashboard/system/role-management ──
export function RoleManagementPage() {
  const { users: adminUsers } = useAdminUsers();

  const roleCounts: Record<string, number> = {};
  adminUsers.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Role Management</h1>
        <p className="text-green-600 mt-1">Manage user roles and permissions</p>
      </div>
      <div className="grid md:grid-cols-5 gap-4">
        {['GUEST', 'USER', 'BOTANIST', 'ADMIN', 'SUPER_ADMIN'].map((role) => (
          <Card key={role} className="border-2 border-green-200 bg-white text-center">
            <CardContent className="pt-6">
              <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900">{roleCounts[role] || 0}</p>
              <p className="text-xs text-gray-500 mt-1">{role.replace('_', ' ')}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-2 border-green-200 bg-white">
        <CardHeader><CardTitle className="text-green-900">Role Hierarchy</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {['GUEST (0)', 'USER (1)', 'BOTANIST (2)', 'ADMIN (3)', 'SUPER_ADMIN (4)'].map((r, i) => (
              <div key={r} className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700">{r}</Badge>
                {i < 4 && <span className="text-gray-400">→</span>}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">Higher roles inherit all permissions of lower roles.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Audit Log — /dashboard/system/audit-log ──────────────
export function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Audit Log</h1>
        <p className="text-green-600 mt-1">View system activity and changes</p>
      </div>
      <Card className="border-2 border-green-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <ScrollText className="w-5 h-5 text-green-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-green-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-green-50">
                <TableRow>
                  <TableHead className="text-green-800">Timestamp</TableHead>
                  <TableHead className="text-green-800">User</TableHead>
                  <TableHead className="text-green-800">Action</TableHead>
                  <TableHead className="text-green-800">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { time: '2 min ago', user: 'admin@garden.com', action: 'LOGIN', detail: 'Successful login' },
                  { time: '15 min ago', user: 'botanist@garden.com', action: 'PLANT_CREATE', detail: 'Created draft: Ashwagandha' },
                  { time: '1 hour ago', user: 'admin@garden.com', action: 'PLANT_APPROVE', detail: 'Approved: Shatavari' },
                ].map((log, i) => (
                  <TableRow key={i} className="hover:bg-green-50/50">
                    <TableCell className="text-gray-500 text-sm">{log.time}</TableCell>
                    <TableCell className="text-green-700 text-sm">{log.user}</TableCell>
                    <TableCell><Badge className="bg-blue-100 text-blue-700">{log.action}</Badge></TableCell>
                    <TableCell className="text-gray-600 text-sm">{log.detail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { AIModelConfigPage } from '../../../../features/system';
