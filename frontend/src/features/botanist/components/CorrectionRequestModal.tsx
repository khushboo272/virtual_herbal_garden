import React, { useState } from 'react';
import { Button } from '../../../app/components/ui/button';
import { Textarea } from '../../../app/components/ui/textarea';
import { AlertCircle, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { requestCorrection } from '../api/contributionsApi';

interface CorrectionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'plant' | 'remedy';
  id: string;
  itemTitle: string;
  onSuccess?: () => void;
}

export function CorrectionRequestModal({
  isOpen,
  onClose,
  type,
  id,
  itemTitle,
  onSuccess,
}: CorrectionRequestModalProps) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || note.trim().length < 5) {
      toast.error('Please describe the correction needed (min 5 characters)');
      return;
    }

    try {
      setSubmitting(true);
      await requestCorrection(type, id, note.trim());
      toast.success('Correction request submitted to administrators');
      setNote('');
      onClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit correction request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Request Correction</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              For published {type}: <span className="font-semibold text-gray-800">{itemTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Published botanical content cannot be directly mutated. Submitting this request
              notifies administrators who will review your proposed corrections.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Correction Details & Rationale
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe the inaccurate information, missing references, or proposed update..."
              rows={4}
              className="w-full text-sm rounded-xl border-slate-200 focus:border-purple-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !note.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Submitting...' : 'Send Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
