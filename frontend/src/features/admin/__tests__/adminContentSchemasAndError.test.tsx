import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { contentItemSchema, contentListResponseSchema } from '../types/adminSchemas';
import { ContentManagementView } from '../components/ContentManagementView';
import * as adminApi from '../api/adminApi';

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

describe('Admin Content Schemas & Error Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('contentItemSchema & contentListResponseSchema', () => {
    it('successfully parses items where owner and createdBy are null', () => {
      const rawItem = {
        _id: '663d1f8e4f1a2b001c8e2020',
        commonName: 'Gotu Kola',
        scientificName: 'Centella asiatica',
        slug: 'gotu-kola',
        status: 'PUBLISHED',
        isPublished: true,
        isFeatured: false,
        owner: null,
        createdBy: null,
        images: [],
      };

      const result = contentItemSchema.safeParse(rawItem);
      expect(result.success).toBe(true);
    });

    it('successfully parses items where owner and createdBy are string ObjectIds', () => {
      const rawItem = {
        _id: '663d1f8e4f1a2b001c8e2021',
        commonName: 'Neem',
        slug: 'neem',
        status: 'PUBLISHED',
        isPublished: true,
        owner: '663d1f8e4f1a2b001c8e0002',
        createdBy: '663d1f8e4f1a2b001c8e0002',
      };

      const result = contentItemSchema.safeParse(rawItem);
      expect(result.success).toBe(true);
    });

    it('successfully parses full content list with nullish owner/createdBy', () => {
      const rawPayload = {
        items: [
          {
            _id: 'plant-1',
            commonName: 'Tulsi',
            slug: 'tulsi',
            status: 'PUBLISHED',
            isPublished: true,
            owner: null,
            createdBy: null,
          },
        ],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      const result = contentListResponseSchema.safeParse(rawPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('ContentManagementView error & fallback display', () => {
    it('displays error alert with retry button when getContentList fails', async () => {
      vi.mocked(adminApi.getContentList).mockRejectedValueOnce(
        new Error('Failed to load content list')
      );

      render(
        <MemoryRouter>
          <ContentManagementView type="plants" title="Plant Management" description="Manage plants" />
        </MemoryRouter>
      );

      // Should show the error alert banner and retry button
      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getAllByText(/Failed to load content list/i).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /Retry/i }).length).toBeGreaterThan(0);

      // Should NOT show the misleading "No content found" empty state
      expect(screen.queryByText('No content found')).toBeNull();
    });

    it('renders "Editorial Admin" fallback when owner and createdBy are null or string IDs', async () => {
      vi.mocked(adminApi.getContentList).mockResolvedValueOnce({
        items: [
          {
            _id: 'plant-null-owner',
            commonName: 'Ashwagandha',
            slug: 'ashwagandha',
            status: 'PUBLISHED',
            isPublished: true,
            isFeatured: false,
            owner: null as any,
            createdBy: null as any,
            images: [],
            updatedAt: '2026-10-31T12:00:00Z',
          },
        ],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      render(
        <MemoryRouter>
          <ContentManagementView type="plants" title="Plant Management" description="Manage plants" />
        </MemoryRouter>
      );

      expect(await screen.findByText('Ashwagandha')).toBeInTheDocument();
      expect(screen.getByText('Editorial Admin')).toBeInTheDocument();
    });
  });
});
