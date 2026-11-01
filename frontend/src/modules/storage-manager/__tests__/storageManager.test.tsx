import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StorageTree } from '../components/StorageTree';
import { StorageToolbar } from '../components/StorageToolbar';
import { StorageItemGrid } from '../components/StorageItemGrid';
import { StorageItemList } from '../components/StorageItemList';
import { StoragePreviewDrawer } from '../components/StoragePreviewDrawer';
import { StorageUploadModal } from '../components/StorageUploadModal';
import { StorageToolsView } from '../components/StorageToolsView';
import { StorageTrashView } from '../components/StorageTrashView';
import { storageApi } from '../api/storageApi';
import { IStorageItem, IBucketStats } from '../types';

vi.mock('../api/storageApi', () => ({
  storageApi: {
    list: vi.fn(),
    stat: vi.fn(),
    getBucketInfo: vi.fn(),
    createFolder: vi.fn(),
    presignUpload: vi.fn(),
    presignDownload: vi.fn(),
    copyObject: vi.fn(),
    moveObject: vi.fn(),
    deleteObject: vi.fn(),
    deleteMany: vi.fn(),
    deletePrefix: vi.fn(),
    updateMetadata: vi.fn(),
    downloadZip: vi.fn(),
    syncCheck: vi.fn(),
    coverageReport: vi.fn(),
    listTrash: vi.fn(),
    restoreTrash: vi.fn(),
    emptyTrash: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Frontend Storage Manager Module Tests', () => {
  const formatBytes = (bytes: number) => `${bytes} B`;

  const mockItem: IStorageItem = {
    key: 'plants/tulsi/hero.webp',
    name: 'hero.webp',
    size: 204800,
    lastModified: new Date('2026-11-01T10:00:00Z'),
    etag: '"etag12345"',
    contentType: 'image/webp',
    publicUrl: 'https://cdn.test/plants/tulsi/hero.webp',
    isFolder: false,
    dbUsageCount: 1,
    dbReferences: [
      {
        collection: 'plants',
        id: 'plant123',
        name: 'Tulsi',
        field: 'images[0].url',
      },
    ],
  };

  const mockStats: IBucketStats = {
    totalObjects: 124,
    totalBytes: 524288000,
    perFolderUsage: {
      'plants/': { objects: 80, bytes: 300000000 },
      'models/': { objects: 20, bytes: 150000000 },
      'remedies/': { objects: 15, bytes: 50000000 },
      'tours/': { objects: 9, bytes: 24288000 },
    },
    freeTierLimitBytes: 10737418240, // 10 GB
    freeTierWarningThresholdBytes: 8589934592, // 8 GB
    lastScannedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. StorageTree Component', () => {
    it('renders quick links and bucket meter', () => {
      render(
        <StorageTree
          currentPrefix=""
          onSelectPrefix={vi.fn()}
          stats={mockStats}
          onRefreshStats={vi.fn()}
          isSuperAdmin={true}
          formatBytes={formatBytes}
        />
      );

      expect(screen.getByText('Quick Links')).toBeInTheDocument();
      expect(screen.getByText('Plants')).toBeInTheDocument();
      expect(screen.getByText('3D Models')).toBeInTheDocument();
      expect(screen.getByText('Remedies')).toBeInTheDocument();
      expect(screen.getByText('Backups')).toBeInTheDocument();
      expect(screen.getByText('Trash Safety Net')).toBeInTheDocument();
      expect(screen.getByText('R2 Free Tier (10 GB)')).toBeInTheDocument();
    });

    it('triggers onSelectPrefix when a quick link is clicked', () => {
      const handleSelect = vi.fn();
      render(
        <StorageTree
          currentPrefix=""
          onSelectPrefix={handleSelect}
          stats={mockStats}
          onRefreshStats={vi.fn()}
          isSuperAdmin={false}
          formatBytes={formatBytes}
        />
      );

      fireEvent.click(screen.getByText('Plants'));
      expect(handleSelect).toHaveBeenCalledWith('plants/');
    });
  });

  describe('2. StorageToolbar Component', () => {
    it('renders breadcrumbs and handles filter updates', () => {
      const handleSearch = vi.fn();
      const handleTypeFilter = vi.fn();
      const handleUpload = vi.fn();

      render(
        <StorageToolbar
          currentPrefix="plants/tulsi/"
          onNavigatePrefix={vi.fn()}
          viewMode="grid"
          onToggleViewMode={vi.fn()}
          searchQuery=""
          onSearchChange={handleSearch}
          typeFilter="ALL"
          onTypeFilterChange={handleTypeFilter}
          dbFilter="ALL"
          onDbFilterChange={vi.fn()}
          sortField="name"
          sortDirection="asc"
          onSortChange={vi.fn()}
          onUploadClick={handleUpload}
          onCreateFolderClick={vi.fn()}
          onRefreshClick={vi.fn()}
          selectedCount={0}
          onBulkDeleteClick={vi.fn()}
          onBulkDownloadClick={vi.fn()}
        />
      );

      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(screen.getByText('tulsi')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Upload'));
      expect(handleUpload).toHaveBeenCalled();
    });
  });

  describe('3. StorageItemGrid & StorageItemList Components', () => {
    it('renders storage item cards in grid mode with thumbnails and DB link badge', () => {
      const handleSelectKey = vi.fn();
      const handleOpenPreview = vi.fn();

      render(
        <StorageItemGrid
          items={[mockItem]}
          selectedKeys={[]}
          onSelectKey={handleSelectKey}
          onOpenFolder={vi.fn()}
          onOpenPreview={handleOpenPreview}
          onDelete={vi.fn()}
          onDownload={vi.fn()}
          onCopyUrl={vi.fn()}
          formatBytes={formatBytes}
        />
      );

      expect(screen.getByText('hero.webp')).toBeInTheDocument();
      expect(screen.getByText('1 DB link')).toBeInTheDocument();

      fireEvent.click(screen.getByText('hero.webp'));
      expect(handleSelectKey).toHaveBeenCalledWith('plants/tulsi/hero.webp', false, false);
    });

    it('renders storage item rows in table list mode and supports multi-select', () => {
      const handleSelectKey = vi.fn();

      render(
        <StorageItemList
          items={[mockItem]}
          selectedKeys={['plants/tulsi/hero.webp']}
          onSelectKey={handleSelectKey}
          onSelectAll={vi.fn()}
          onOpenFolder={vi.fn()}
          onOpenPreview={vi.fn()}
          onDelete={vi.fn()}
          onDownload={vi.fn()}
          onCopyUrl={vi.fn()}
          formatBytes={formatBytes}
        />
      );

      expect(screen.getByText('hero.webp')).toBeInTheDocument();
      expect(screen.getByText('1 link')).toBeInTheDocument();
      const checkbox = screen.getByLabelText('Select hero.webp') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('4. StoragePreviewDrawer Component', () => {
    it('renders object details, database references, and handles copy public URL', () => {
      render(
        <StoragePreviewDrawer
          item={mockItem}
          onClose={vi.fn()}
          onDelete={vi.fn()}
          onRefresh={vi.fn()}
          formatBytes={formatBytes}
        />
      );

      expect(screen.getByText('File Details')).toBeInTheDocument();
      expect(screen.getByText('plants/tulsi/hero.webp')).toBeInTheDocument();
      expect(screen.getByText('Database References')).toBeInTheDocument();
      expect(screen.getByText('Tulsi')).toBeInTheDocument();
      expect(screen.getByText('field: images[0].url')).toBeInTheDocument();
    });
  });

  describe('5. StorageUploadModal Component', () => {
    it('renders smart botanical naming selector and drag drop area', () => {
      render(
        <StorageUploadModal
          isOpen={true}
          onClose={vi.fn()}
          currentPrefix="plants/"
          onUploadComplete={vi.fn()}
          formatBytes={formatBytes}
        />
      );

      expect(screen.getByText('Upload to Storage (R2)')).toBeInTheDocument();
      expect(screen.getByText('Smart Botanical Naming')).toBeInTheDocument();
      expect(screen.getByText(/Drag & Drop files or click to browse/i)).toBeInTheDocument();
      expect(screen.getByText(/Client-Side Image Optimisation \(WebP\)/i)).toBeInTheDocument();
    });
  });

  describe('6. StorageToolsView & StorageTrashView Components', () => {
    it('renders sync check data and broken link warnings', async () => {
      vi.mocked(storageApi.syncCheck).mockResolvedValueOnce({
        orphans: [{ key: 'misc/unreferenced.jpg', size: 1024, lastModified: new Date() }],
        brokenLinks: [
          {
            collection: 'plants',
            id: 'p1',
            name: 'Gotu Kola',
            field: 'images[0].url',
            url: 'https://cdn.test/plants/gotu-kola/hero.webp',
            key: 'plants/gotu-kola/hero.webp',
          },
        ],
        wrongLocations: [],
        caseMismatches: [],
        stats: {
          totalR2Keys: 50,
          totalDbLinks: 49,
          orphanCount: 1,
          brokenLinkCount: 1,
        },
      });

      render(<StorageToolsView formatBytes={formatBytes} />);

      await waitFor(() => {
        expect(screen.getByText('Total R2 Objects')).toBeInTheDocument();
        expect(screen.getByText('Gotu Kola')).toBeInTheDocument();
        expect(screen.getByText('404 Missing')).toBeInTheDocument();
        expect(screen.getByText('misc/unreferenced.jpg')).toBeInTheDocument();
      });
    });

    it('renders trash items with restore button and warning on referenced items', async () => {
      vi.mocked(storageApi.listTrash).mockResolvedValueOnce({
        items: [
          {
            _id: 'trash1',
            originalKey: 'plants/neem/hero.webp',
            trashKey: 'trash/20261101/plants/neem/hero.webp',
            deletedBy: 'admin@test.com',
            deletedAt: new Date(),
            size: 102400,
            contentType: 'image/webp',
            dbRefsSnapshot: [{ collection: 'plants', id: 'n1', field: 'images[0].url' }],
          },
        ],
        meta: { total: 1, page: 1, totalPages: 1 },
      });

      render(<StorageTrashView formatBytes={formatBytes} isSuperAdmin={true} />);

      await waitFor(() => {
        expect(screen.getByText('plants/neem/hero.webp')).toBeInTheDocument();
        expect(screen.getByText('Restore')).toBeInTheDocument();
        expect(screen.getByText(/Was referenced by 1 DB entry/i)).toBeInTheDocument();
      });
    });
  });
});

