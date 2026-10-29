import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ContentManagementView } from '../components/ContentManagementView';
import * as adminApi from '../api/adminApi';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../api/adminApi', () => ({
  getContentList: vi.fn(),
  publishContent: vi.fn(),
  unpublishContent: vi.fn(),
  toggleFeatureContent: vi.fn(),
  getContentImpact: vi.fn(),
  deleteContent: vi.fn(),
  bulkPublishContent: vi.fn(),
  bulkUnpublishContent: vi.fn(),
  bulkFeatureContent: vi.fn(),
  bulkStatusContent: vi.fn(),
  bulkDeleteContent: vi.fn(),
}));

const mockItems = [
  {
    _id: 'plant-1',
    id: 'plant-1',
    title: 'Ashwagandha',
    slug: 'ashwagandha',
    scientificName: 'Withania somnifera',
    family: 'Solanaceae',
    isPublished: false,
    status: 'DRAFT',
    isFeatured: false,
    updatedAt: new Date().toISOString(),
    owner: { displayName: 'Dr. Arun Sharma' },
    medicinalUses: ['Stress relief', 'Immunity'],
  },
  {
    _id: 'plant-2',
    id: 'plant-2',
    title: 'Brahmi',
    slug: 'brahmi',
    scientificName: 'Bacopa monnieri',
    family: 'Plantaginaceae',
    isPublished: true,
    status: 'PUBLISHED',
    isFeatured: false,
    updatedAt: new Date().toISOString(),
    owner: { displayName: 'Dr. Priya Iyer' },
    medicinalUses: ['Cognition'],
  },
];

describe('ContentManagementView Bulk Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminApi.getContentList).mockResolvedValue({
      items: mockItems,
      pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it('renders all bulk action options when items are selected', async () => {
    render(
      <MemoryRouter>
        <ContentManagementView type="plants" title="Plant Management" description="Manage plants" />
      </MemoryRouter>
    );

    expect(await screen.findByText('Ashwagandha')).toBeInTheDocument();
    expect(screen.getByText('Brahmi')).toBeInTheDocument();

    // Initially bulk toolbar is hidden
    expect(screen.queryByText(/item\(s\) selected/i)).toBeNull();

    // Select the "Select All" checkbox in table header
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // header checkbox

    // Bulk toolbar should now be visible with 2 items selected
    expect(await screen.findByText(/2 item\(s\) selected/i)).toBeInTheDocument();

    // Advanced bulk action controls should be available
    expect(screen.getByRole('button', { name: /Bulk Publish/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bulk Unpublish/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bulk Feature/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bulk Unfeature/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bulk Delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Deselect All/i })).toBeInTheDocument();
  });

  it('triggers bulkPublishContent when clicking Bulk Publish', async () => {
    vi.mocked(adminApi.bulkPublishContent).mockResolvedValue({ processed: 2, success: true });

    render(
      <MemoryRouter>
        <ContentManagementView type="plants" title="Plant Management" description="Manage plants" />
      </MemoryRouter>
    );

    expect(await screen.findByText('Ashwagandha')).toBeInTheDocument();

    // Select all
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const publishBtn = await screen.findByRole('button', { name: /Bulk Publish/i });
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(adminApi.bulkPublishContent).toHaveBeenCalledWith('plants', ['plant-1', 'plant-2']);
    });
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Published 2 item(s)'));
  });

  it('triggers bulkFeatureContent when clicking Feature or Unfeature', async () => {
    vi.mocked(adminApi.bulkFeatureContent).mockResolvedValue({ processed: 2, success: true });

    render(
      <MemoryRouter>
        <ContentManagementView type="plants" title="Plant Management" description="Manage plants" />
      </MemoryRouter>
    );

    expect(await screen.findByText('Ashwagandha')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const featureBtn = await screen.findByRole('button', { name: /Bulk Feature/i });
    fireEvent.click(featureBtn);

    await waitFor(() => {
      expect(adminApi.bulkFeatureContent).toHaveBeenCalledWith('plants', ['plant-1', 'plant-2'], true);
    });
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Featured 2 item(s)'));
  });

  it('triggers bulkStatusContent when changing status from dropdown', async () => {
    vi.mocked(adminApi.bulkStatusContent).mockResolvedValue({ processed: 2, success: true });

    render(
      <MemoryRouter>
        <ContentManagementView type="plants" title="Plant Management" description="Manage plants" />
      </MemoryRouter>
    );

    expect(await screen.findByText('Ashwagandha')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const statusSelect = screen.getByDisplayValue('Change Status...');
    fireEvent.change(statusSelect, { target: { value: 'DRAFT' } });

    await waitFor(() => {
      expect(adminApi.bulkStatusContent).toHaveBeenCalledWith('plants', ['plant-1', 'plant-2'], 'DRAFT');
    });
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Status updated for 2 item(s)'));
  });

  it('triggers export and download when clicking Export (CSV)', async () => {
    // Mock URL methods
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    render(
      <MemoryRouter>
        <ContentManagementView type="plants" title="Plant Management" description="Manage plants" />
      </MemoryRouter>
    );

    expect(await screen.findByText('Ashwagandha')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const exportBtn = screen.getByRole('button', { name: /Export \(CSV\)/i });
    fireEvent.click(exportBtn);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Exported 2 item(s) to CSV'));
  });

  it('opens confirmation modal and executes bulk delete', async () => {
    vi.mocked(adminApi.bulkDeleteContent).mockResolvedValue({ processed: 2, success: true });

    render(
      <MemoryRouter>
        <ContentManagementView type="plants" title="Plant Management" description="Manage plants" />
      </MemoryRouter>
    );

    expect(await screen.findByText('Ashwagandha')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const bulkDeleteBtn = screen.getByRole('button', { name: /Bulk Delete/i });
    fireEvent.click(bulkDeleteBtn);

    // Modal opens
    expect(await screen.findByText('Confirm Bulk Deletion')).toBeInTheDocument();
    expect(screen.getByText(/1 item\(s\) are currently published/i)).toBeInTheDocument();

    const unpublishAndDeleteBtn = screen.getByRole('button', { name: /Unpublish & Delete All/i });
    fireEvent.click(unpublishAndDeleteBtn);

    await waitFor(() => {
      expect(adminApi.bulkDeleteContent).toHaveBeenCalledWith('plants', ['plant-1', 'plant-2']);
    });
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Deleted 2 item(s) successfully'));
  });
});

