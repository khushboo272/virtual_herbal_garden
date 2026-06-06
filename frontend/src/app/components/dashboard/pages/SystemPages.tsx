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
export function SystemOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">System Overview</h1>
        <p className="text-green-600 mt-1">Super Admin system management panel</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-red-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Settings className="w-5 h-5 text-red-600" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'API Version', value: 'v1.0.0' },
              { label: 'AI Model', value: 'Gemini 2.5 Flash' },
              { label: 'Max Upload Size', value: '10 MB' },
              { label: 'Detection TTL', value: '90 days' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-800">{item.label}</span>
                <Badge className="bg-red-100 text-red-700">{item.value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-2 border-red-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Wrench className="w-5 h-5 text-red-600" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Database', status: 'Connected', ok: true },
              { label: 'R2 Storage', status: 'Connected', ok: true },
              { label: 'Socket.io', status: 'Active', ok: true },
              { label: 'AI Service', status: 'Ready', ok: true },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-800">{item.label}</span>
                <Badge className={item.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Feature Flags — /dashboard/system/feature-flags ──────
export function FeatureFlagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Feature Flags</h1>
        <p className="text-green-600 mt-1">Toggle platform features on or off</p>
      </div>
      <Card className="border-2 border-red-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Shield className="w-5 h-5 text-red-600" />
            Active Feature Flags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: '3D Garden', description: 'Enable the immersive 3D garden experience', enabled: true },
            { label: 'AI Plant Scanner', description: 'Enable AI-powered plant identification', enabled: true },
            { label: 'Guided Tours', description: 'Enable guided virtual tour feature', enabled: true },
            { label: 'Maintenance Mode', description: 'Show maintenance page to all users', enabled: false },
            { label: 'New User Registration', description: 'Allow new user signups', enabled: true },
          ].map((flag) => (
            <div key={flag.label} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-red-200 transition-colors">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{flag.label}</h4>
                <p className="text-xs text-gray-500">{flag.description}</p>
              </div>
              <Badge className={flag.enabled ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'}>
                {flag.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

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

// ── AI Model Config — /dashboard/system/ai-model-config ──
export function AIModelConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">AI Model Configuration</h1>
        <p className="text-green-600 mt-1">Configure AI plant identification settings</p>
      </div>
      <Card className="border-2 border-purple-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Cpu className="w-5 h-5 text-purple-600" />
            Active Model
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Model', value: 'Gemini 2.5 Flash' },
            { label: 'Endpoint', value: 'generativelanguage.googleapis.com' },
            { label: 'Max Tokens', value: '2048' },
            { label: 'Temperature', value: '0.3' },
            { label: 'Confidence Threshold', value: '75%' },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-800">{item.label}</span>
              <Badge className="bg-purple-100 text-purple-700">{item.value}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
