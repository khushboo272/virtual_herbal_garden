import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Leaf,
  Clock,
  ArrowLeft,
  Edit3,
  Undo,
  Trash2,
  Eye,
  Send,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../app/components/ui/card';
import { Button } from '../../../app/components/ui/button';
import { StatusBadge } from '../components/StatusBadge';
import { ReviewNotesTimeline } from '../components/ReviewNotesTimeline';
import { CorrectionRequestModal } from '../components/CorrectionRequestModal';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import {
  getContribution,
  withdrawContribution,
  submitContribution,
  deleteContribution,
} from '../api/contributionsApi';
import type { IContributionItem } from '../types';
import { toast } from 'sonner';

export function SubmissionDetailsPage() {
  const { type, id } = useParams<{ type: 'plant' | 'remedy'; id: string }>();
  const navigate = useNavigate();

  useDocumentTitle('Submission Review Details | Virtual Herbal Garden');

  const [item, setItem] = useState<IContributionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);

  const loadItem = async () => {
    if (!type || !id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getContribution(type, id);
      setItem(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load submission review details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItem();
  }, [type, id]);

  const handleWithdraw = async () => {
    if (!item) return;
    if (!window.confirm('Withdraw this submission back to draft status?')) return;
    try {
      await withdrawContribution(item.type, item.id);
      toast.success('Submission withdrawn to draft');
      loadItem();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to withdraw submission');
    }
  };

  const handleSubmit = async () => {
    if (!item) return;
    try {
      await submitContribution(item.type, item.id);
      toast.success('Submitted for botanical review');
      loadItem();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit item');
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!window.confirm('Permanently delete this draft contribution?')) return;
    try {
      await deleteContribution(item.type, item.id);
      toast.success('Contribution deleted');
      navigate('/dashboard/contributions');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete contribution');
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-sm text-slate-400">
        Loading submission history...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-12 text-center text-sm text-rose-600 space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p>{error || 'Submission not found'}</p>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/contributions')}
          className="text-xs rounded-xl"
        >
          Return to Contributions
        </Button>
      </div>
    );
  }

  const canEdit =
    item.status === 'DRAFT' ||
    item.status === 'CHANGES_REQUESTED' ||
    item.status === 'REJECTED';
  const isPending = item.status === 'PENDING_REVIEW';
  const isPublished = item.status === 'PUBLISHED';
  const previewUrl =
    item.type === 'plant'
      ? `/library/${item.slug}?preview=1`
      : `/remedies/${item.slug}?preview=1`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/contributions')}
          className="text-xs text-slate-600 hover:text-slate-900 -ml-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to My Contributions
        </Button>
      </div>

      {/* Main Header Card */}
      <Card className="border border-slate-200/80 shadow-xs rounded-2xl bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                item.type === 'plant'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {item.type === 'plant' ? <Leaf className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{item.title}</h1>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {item.subtitle || `${item.type.toUpperCase()} • Created ${new Date(item.createdAt).toLocaleDateString()}`}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && (
              <Button
                onClick={() => navigate(`/dashboard/contributions/${item.type}/${item.slug || item.id}`)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-xl h-9 px-3.5 flex items-center gap-1.5 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit in Draft Editor
              </Button>
            )}

            {isPending && (
              <Button
                variant="outline"
                onClick={handleWithdraw}
                className="text-xs rounded-xl h-9 px-3.5 text-amber-700 border-amber-200 bg-amber-50/50 flex items-center gap-1.5"
              >
                <Undo className="w-3.5 h-3.5" /> Withdraw to Draft
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => window.open(previewUrl, '_blank')}
              className="text-xs rounded-xl h-9 px-3 flex items-center gap-1.5 text-slate-700"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </Button>

            {isPublished && (
              <Button
                variant="outline"
                onClick={() => setCorrectionModalOpen(true)}
                className="text-xs rounded-xl h-9 px-3 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              >
                Request Correction
              </Button>
            )}

            {canEdit && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="text-xs rounded-xl h-9 px-2.5 text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Review Notes & Activity Timeline */}
      <Card className="border border-slate-200/80 shadow-xs rounded-2xl bg-white p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" /> Botanical Review History
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Audited review notes, state transitions, and revision requests
            </p>
          </div>
        </div>

        <ReviewNotesTimeline notes={item.reviewNotes} />
      </Card>

      {/* Bibliographic References Verification */}
      {item.references && item.references.length > 0 && (
        <Card className="border border-slate-200/80 shadow-xs rounded-2xl bg-white p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Registered Citations & References</h3>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
            {item.references.map((ref, idx) => (
              <li key={idx} className="leading-relaxed">
                {ref}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Correction Request Modal */}
      <CorrectionRequestModal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        type={item.type}
        id={item.id}
        itemTitle={item.title}
        onSuccess={loadItem}
      />
    </div>
  );
}
