// ──────────────────────────────────────────────────────────
// User Management Page — /dashboard/users
// Extracted from AdminPanel users tab
// ──────────────────────────────────────────────────────────

import { Users, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { useAdminUsers } from '../../../../hooks/useAdmin';
import { useAuth } from '../../../../contexts/AuthContext';
import { useState } from 'react';

export function UserManagementPage() {
  const { users: adminUsers, fetchUsers } = useAdminUsers();
  const { hasMinRole } = useAuth();
  const isSuperAdmin = hasMinRole('SUPER_ADMIN');
  const [search, setSearch] = useState('');

  const handleSearch = (val: string) => {
    setSearch(val);
    fetchUsers(1, 20, val || undefined);
  };

  const roleBadgeColor: Record<string, string> = {
    GUEST: 'bg-gray-100 text-gray-700 border-gray-300',
    USER: 'bg-blue-100 text-blue-700 border-blue-300',
    BOTANIST: 'bg-purple-100 text-purple-700 border-purple-300',
    ADMIN: 'bg-amber-100 text-amber-700 border-amber-300',
    SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">User Management</h1>
        <p className="text-green-600 mt-1">View and manage platform users</p>
      </div>

      <Card className="border-2 border-green-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Users className="w-5 h-5 text-green-600" />
            All Users
            <Badge className="ml-auto bg-green-100 text-green-700 border-green-300">
              {adminUsers.length} users
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search users by name or email..."
              className="max-w-md border-green-200"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="border-2 border-green-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-green-50">
                <TableRow>
                  <TableHead className="text-green-800">Name</TableHead>
                  <TableHead className="text-green-800">Email</TableHead>
                  <TableHead className="text-green-800">Role</TableHead>
                  <TableHead className="text-green-800">Joined</TableHead>
                  <TableHead className="text-green-800">Status</TableHead>
                  <TableHead className="text-green-800 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  adminUsers.map((u) => (
                    <TableRow key={u._id} className="hover:bg-green-50/50">
                      <TableCell className="font-medium text-green-900">{u.displayName}</TableCell>
                      <TableCell className="text-green-700">{u.email}</TableCell>
                      <TableCell>
                        <Badge className={roleBadgeColor[u.role] || 'bg-gray-100 text-gray-700'}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-green-700">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={u.isActive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}>
                          {u.isActive ? 'Active' : 'Banned'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isSuperAdmin ? (
                          <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                            <Shield className="w-4 h-4 mr-1" />
                            Change Role
                          </Button>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button size="sm" variant="outline" disabled className="opacity-50">
                                    <Shield className="w-4 h-4 mr-1" />
                                    Change Role
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Only a Super Admin can change user roles.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
