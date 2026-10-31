import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DatabaseNav } from '../components/DatabaseNav';
import { DatabaseOverviewPage } from './DatabaseOverviewPage';
import { DatabaseImportPage } from './DatabaseImportPage';
import { DatabaseBrowsePage } from './DatabaseBrowsePage';
import { DatabaseExportPage } from './DatabaseExportPage';
import { DatabaseBackupsPage } from './DatabaseBackupsPage';
import { DatabaseQueryPage } from './DatabaseQueryPage';
import { DatabaseIntegrityPage } from './DatabaseIntegrityPage';
import { DatabaseToolsPage } from './DatabaseToolsPage';
import { DatabaseHistoryPage } from './DatabaseHistoryPage';
import { useAuth } from '../../../contexts/AuthContext';

export const DatabaseManagerApp: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-full flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
      <DatabaseNav isSuperAdmin={isSuperAdmin} />
      <div className="flex-1">
        <Routes>
          <Route index element={<DatabaseOverviewPage />} />
          <Route path="import" element={<DatabaseImportPage />} />
          <Route path="browse" element={<DatabaseBrowsePage />} />
          <Route path="export" element={<DatabaseExportPage />} />
          <Route
            path="backups"
            element={isSuperAdmin ? <DatabaseBackupsPage /> : <Navigate to="/dashboard/database" replace />}
          />
          <Route path="query" element={<DatabaseQueryPage />} />
          <Route path="integrity" element={<DatabaseIntegrityPage />} />
          <Route path="tools" element={<DatabaseToolsPage />} />
          <Route path="history" element={<DatabaseHistoryPage />} />
          <Route path="*" element={<Navigate to="/dashboard/database" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default DatabaseManagerApp;

