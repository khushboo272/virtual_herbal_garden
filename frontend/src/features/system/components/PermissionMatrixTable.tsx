import React, { useState } from 'react';
import { ICapability, SystemRole } from '../types/system.types';
import { ShieldCheck, Search } from 'lucide-react';

interface PermissionMatrixTableProps {
  capabilities: ICapability[];
  isLoading?: boolean;
}

const roleBadgeColor: Record<SystemRole, string> = {
  GUEST: 'bg-gray-100 text-gray-700 border-gray-300',
  USER: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  BOTANIST: 'bg-teal-100 text-teal-800 border-teal-300',
  ADMIN: 'bg-amber-100 text-amber-800 border-amber-300',
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-300',
};

export const PermissionMatrixTable: React.FC<PermissionMatrixTableProps> = ({
  capabilities,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');

  const filtered = capabilities.filter((cap) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      cap.key.toLowerCase().includes(q) ||
      cap.description.toLowerCase().includes(q) ||
      cap.category.toLowerCase().includes(q) ||
      cap.minimumRole.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search capabilities, roles, descriptions..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-gray-500">
          Showing <span className="font-semibold text-gray-800">{filtered.length}</span> permissions
        </div>
      </div>

      {/* Table */}
      <div className="border border-emerald-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-50/70 border-b border-emerald-100 text-emerald-900 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Capability Key</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Required Minimum Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Loading capability registry...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No matching capabilities found.
                  </td>
                </tr>
              ) : (
                filtered.map((cap) => (
                  <tr key={cap.key} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-emerald-950">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {cap.key}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{cap.category}</td>
                    <td className="py-3 px-4 text-gray-700">{cap.description}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                      <span className="font-semibold text-gray-700">{cap.routeMethod}</span>{' '}
                      {cap.routePath}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          roleBadgeColor[cap.minimumRole] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {cap.minimumRole}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
