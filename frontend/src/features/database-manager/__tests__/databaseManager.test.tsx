import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DatabaseOverviewPage } from '../pages/DatabaseOverviewPage';
import { DatabaseImportPage } from '../pages/DatabaseImportPage';
import { DatabaseQueryPage } from '../pages/DatabaseQueryPage';
import { DatabaseIntegrityPage } from '../pages/DatabaseIntegrityPage';
import { JobProgress } from '../components/JobProgress';
import { databaseApi } from '../api/databaseApi';
import type { OverviewStats, DbJobItem, IntegrityReport } from '../types';

vi.mock('../api/databaseApi', () => ({
  databaseApi: {
    getOverview: vi.fn(),
    getCollections: vi.fn(),
    loadStarterPack: vi.fn(),
    dryRunImport: vi.fn(),
    commitImport: vi.fn(),
    getQueryExamples: vi.fn(),
    executeFind: vi.fn(),
    executeAggregate: vi.fn(),
    getIntegrityReport: vi.fn(),
    applyIntegrityFix: vi.fn(),
    ignoreIntegrityIssue: vi.fn(),
  },
}));

describe('Frontend Database Manager Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DatabaseOverviewPage', () => {
    const mockOverview: OverviewStats = {
      serverVersion: 'MongoDB 6.0.5',
      databaseName: 'virtual-herbal-garden',
      totalDocuments: 150,
      totalStorageSizeBytes: 1048576, // 1 MB
      totalCollections: 17,
      activeJobsCount: 0,
      backupFreshness: {
        lastBackupAt: new Date().toISOString(),
        isStale: false,
        totalBackups: 4,
      },
      collections: [
        {
          key: 'plants',
          label: 'Medicinal Plants',
          count: 50,
          publishedCount: 45,
          draftCount: 5,
          storageSizeBytes: 524288,
          avgObjSizeBytes: 1024,
          indexCount: 5,
          lastWriteAt: new Date().toISOString(),
        },
        {
          key: 'remedies',
          label: 'Herbal Remedies',
          count: 25,
          publishedCount: 20,
          draftCount: 5,
          storageSizeBytes: 262144,
          avgObjSizeBytes: 800,
          indexCount: 3,
          lastWriteAt: new Date().toISOString(),
        },
      ],
      recentJobs: [],
      recentAuditLogs: [],
    };

    it('renders live database metrics and collection cards', async () => {
      vi.mocked(databaseApi.getOverview).mockResolvedValue(mockOverview);

      render(
        <MemoryRouter>
          <DatabaseOverviewPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('virtual-herbal-garden')).toBeInTheDocument();
        expect(screen.getByText('MongoDB 6.0.5')).toBeInTheDocument();
        expect(screen.getByText('Medicinal Plants')).toBeInTheDocument();
        expect(screen.getByText('Herbal Remedies')).toBeInTheDocument();
      });
    });

    it('renders safely without throwing when stats have missing or undefined numeric fields', async () => {
      const partialOverview: any = {
        serverVersion: 'MongoDB 8.0.36',
        databaseName: 'herbal_garden_dev',
        totalDocuments: undefined, // Simulating missing top-level count
        totalStorageSizeBytes: undefined,
        totalCollections: 21,
        backupFreshness: undefined,
        collections: [
          {
            key: 'plants',
            label: 'Medicinal Plants',
            count: undefined, // Simulating missing collection count
            storageSizeBytes: undefined,
          },
        ],
        recentJobs: undefined,
      };
      vi.mocked(databaseApi.getOverview).mockResolvedValue(partialOverview);

      render(
        <MemoryRouter>
          <DatabaseOverviewPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('herbal_garden_dev')).toBeInTheDocument();
        expect(screen.getByText('Medicinal Plants')).toBeInTheDocument();
      });
    });
  });

  describe('DatabaseImportPage', () => {
    it('loads starter seed pack and triggers dry run validation', async () => {
      vi.mocked(databaseApi.getCollections).mockResolvedValue([
        {
          key: 'plants',
          label: 'Medicinal Plants',
          uniqueKey: 'slug',
          importable: true,
          exportable: true,
          editable: true,
          deletable: true,
          softDelete: false,
          refs: [],
          defaultColumns: ['slug', 'commonName'],
        },
      ]);

      vi.mocked(databaseApi.loadStarterPack).mockResolvedValue({
        categories: [{ name: 'Ayurvedic', slug: 'ayurvedic' }],
        plants: [{ commonName: 'Tulsi', slug: 'tulsi' }],
      });

      vi.mocked(databaseApi.dryRunImport).mockResolvedValue({
        batchId: 'batch-123',
        isBundle: true,
        collections: ['plants'],
        willInsert: 2,
        willUpdate: 0,
        willSkip: 0,
        errorCount: 0,
        summary: {
          willInsert: 2,
          willUpdate: 0,
          willSkip: 0,
          errorsCount: 0,
          total: 2,
        },
        rows: [
          {
            row: 1,
            collectionName: 'plants',
            uniqueValue: 'tulsi',
            action: 'insert',
            warnings: [],
            errors: [],
            docData: { commonName: 'Tulsi' },
          },
        ],
        errors: [],
      });

      render(
        <MemoryRouter>
          <DatabaseImportPage />
        </MemoryRouter>
      );

      const loadStarterBtn = screen.getByText('Load Starter Pack');
      fireEvent.click(loadStarterBtn);

      await waitFor(() => {
        expect(databaseApi.loadStarterPack).toHaveBeenCalled();
      });

      const dryRunBtn = screen.getByText('Run Dry Run');
      fireEvent.click(dryRunBtn);

      await waitFor(() => {
        expect(databaseApi.dryRunImport).toHaveBeenCalled();
        expect(screen.getByText('Dry Run Validation Diff (1 rows)')).toBeInTheDocument();
      });
    });
  });

  describe('DatabaseQueryPage', () => {
    it('switches between Find and Aggregate modes and executes query', async () => {
      vi.mocked(databaseApi.getCollections).mockResolvedValue([]);
      vi.mocked(databaseApi.getQueryExamples).mockResolvedValue([]);
      vi.mocked(databaseApi.executeFind).mockResolvedValue({
        results: [{ commonName: 'Neem', slug: 'neem' }],
        count: 1,
        durationMs: 12,
      });

      render(
        <MemoryRouter>
          <DatabaseQueryPage />
        </MemoryRouter>
      );

      const runBtn = screen.getByText('Run Query');
      fireEvent.click(runBtn);

      await waitFor(() => {
        expect(databaseApi.executeFind).toHaveBeenCalled();
        expect(screen.getByText(/Results: 1 document/)).toBeInTheDocument();
      });
    });
  });

  describe('DatabaseIntegrityPage', () => {
    const mockReport: IntegrityReport = {
      timestamp: new Date().toISOString(),
      healthScore: 95,
      totalIssues: 1,
      errorsCount: 0,
      warningsCount: 1,
      infoCount: 0,
      issues: [
        {
          id: 'warn-1',
          severity: 'warn',
          code: 'MISSING_CONTRAINDICATION',
          category: 'medical_safety',
          collectionName: 'remedies',
          docId: 'rem-1',
          slug: 'ginger-tea',
          message: 'Remedy has no contraindications listed',
          fixable: false,
        },
      ],
    };

    it('renders health score gauge and issue cards', async () => {
      vi.mocked(databaseApi.getIntegrityReport).mockResolvedValue(mockReport);

      render(
        <MemoryRouter>
          <DatabaseIntegrityPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('95')).toBeInTheDocument();
        expect(screen.getByText('Remedy has no contraindications listed')).toBeInTheDocument();
      });
    });
  });

  describe('JobProgress Component', () => {
    const mockJob: DbJobItem = {
      _id: 'job-1',
      batchId: 'batch-abc',
      type: 'import',
      collectionName: 'plants',
      status: 'running',
      progress: {
        current: 50,
        total: 100,
        percent: 50,
        message: 'Importing plant records...',
      },
      counts: {
        inserted: 48,
        updated: 2,
        skipped: 0,
        deleted: 0,
        errors: 0,
        total: 100,
      },
      errors: [],
      isUndone: false,
      createdAt: new Date().toISOString(),
    };

    it('displays progress percentage and counts', () => {
      render(<JobProgress job={mockJob} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Importing plant records...')).toBeInTheDocument();
      expect(screen.getByText('48')).toBeInTheDocument();
    });
  });
});

