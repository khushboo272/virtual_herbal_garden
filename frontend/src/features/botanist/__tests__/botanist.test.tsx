import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { CompletenessChecklist, type ChecklistItem } from '../components/CompletenessChecklist';
import { MedicinalSafetyWarning, checkContentSafety } from '../components/MedicinalSafetyWarning';
import { ReviewNotesTimeline } from '../components/ReviewNotesTimeline';
import { MyContributionsPage } from '../pages/MyContributionsPage';
import * as contributionsApi from '../api/contributionsApi';

vi.mock('../api/contributionsApi', () => ({
  listContributions: vi.fn(),
  getContributionSummary: vi.fn(),
  submitContribution: vi.fn(),
  deleteDraft: vi.fn(),
  getAIFeedbackQueue: vi.fn(),
  getAIFeedbackStats: vi.fn(),
  submitAIFeedback: vi.fn(),
}));

describe('Botanist Feature Unit & Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StatusBadge', () => {
    it('renders DRAFT badge with neutral styling', () => {
      render(<StatusBadge status="DRAFT" />);
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('renders PENDING_REVIEW badge with amber styling', () => {
      render(<StatusBadge status="PENDING_REVIEW" />);
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
    });

    it('renders CHANGES_REQUESTED badge with alert styling', () => {
      render(<StatusBadge status="CHANGES_REQUESTED" />);
      expect(screen.getByText('Changes Requested')).toBeInTheDocument();
    });

    it('renders PUBLISHED badge with emerald styling', () => {
      render(<StatusBadge status="PUBLISHED" />);
      expect(screen.getByText('Published')).toBeInTheDocument();
    });

    it('renders REJECTED badge with red styling', () => {
      render(<StatusBadge status="REJECTED" />);
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });
  });

  describe('MedicinalSafetyWarning', () => {
    it('checkContentSafety returns empty when content is safe', () => {
      const phrases = checkContentSafety([
        'Tulsi Leaves Decoction',
        'Traditionally used in Ayurveda to support respiratory comfort.',
      ]);
      expect(phrases.length).toBe(0);
      const { container } = render(<MedicinalSafetyWarning detectedPhrases={phrases} />);
      expect(container.firstChild).toBeNull();
    });

    it('checkContentSafety detects banned words and displays warning', () => {
      const phrases = checkContentSafety([
        'Miracle formula',
        'Guaranteed to cure with no side effects completely.',
      ]);
      expect(phrases).toContain('guaranteed');
      expect(phrases).toContain('no side effects');

      render(<MedicinalSafetyWarning detectedPhrases={phrases} />);
      expect(screen.getByText(/Medicinal Content Safety Restriction/i)).toBeInTheDocument();
      expect(screen.getByText(/"guaranteed"/i)).toBeInTheDocument();
    });
  });

  describe('CompletenessChecklist', () => {
    it('calculates completion correctly and highlights checklist items', () => {
      const items: ChecklistItem[] = [
        { id: 'names', label: 'Common & Scientific Name', isComplete: true, isRequiredForReview: true },
        { id: 'desc', label: 'Detailed Description', isComplete: false, isRequiredForReview: true, hint: 'At least 20 chars' },
        { id: 'refs', label: 'Authoritative Citations', isComplete: false, isRequiredForReview: true, hint: 'Min 1 required' },
      ];

      render(<CompletenessChecklist items={items} />);
      expect(screen.getByText(/Ready for Review/i)).toBeInTheDocument();
      expect(screen.getByText('1/3')).toBeInTheDocument();
      expect(screen.getByText('Common & Scientific Name')).toBeInTheDocument();
      expect(screen.getByText('Detailed Description')).toBeInTheDocument();
    });

    it('displays Ready to Submit when all items are complete', () => {
      const items: ChecklistItem[] = [
        { id: 'names', label: 'Common & Scientific Name', isComplete: true, isRequiredForReview: true },
        { id: 'refs', label: 'Citations', isComplete: true, isRequiredForReview: true },
      ];

      render(<CompletenessChecklist items={items} />);
      expect(screen.getByText('2/2')).toBeInTheDocument();
      expect(screen.getByText('Ready to Submit')).toBeInTheDocument();
    });
  });

  describe('ReviewNotesTimeline', () => {
    it('renders empty state when no notes exist', () => {
      render(<ReviewNotesTimeline notes={[]} />);
      expect(screen.getByText(/No review notes or activity recorded yet/i)).toBeInTheDocument();
    });

    it('renders timeline entries with reviewer action and comments', () => {
      const notes = [
        {
          at: '2026-10-24T10:00:00.000Z',
          action: 'CHANGES_REQUESTED' as const,
          comment: 'Please add secondary botanical references and specify harvest season.',
        },
      ];
      render(<ReviewNotesTimeline notes={notes} />);
      expect(screen.getByText(/Changes Requested/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Please add secondary botanical references/i),
      ).toBeInTheDocument();
    });
  });

  describe('MyContributionsPage', () => {
    it('fetches and renders contribution list with status badges', async () => {
      vi.mocked(contributionsApi.listContributions).mockResolvedValue({
        items: [
          {
            id: 'p1',
            type: 'plant',
            title: 'Tulsi',
            slug: 'tulsi',
            status: 'PENDING_REVIEW',
            isPublished: false,
            submittedAt: '2026-10-24T12:00:00.000Z',
            updatedAt: '2026-10-24T12:00:00.000Z',
            createdAt: '2026-10-24T10:00:00.000Z',
          },
        ],
        meta: { page: 1, limit: 15, total: 1, totalPages: 1 },
      });

      render(
        <MemoryRouter>
          <MyContributionsPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Tulsi')).toBeInTheDocument();
        expect(screen.getAllByText('Pending Review').length).toBeGreaterThan(0);
      });
    });
  });
});
