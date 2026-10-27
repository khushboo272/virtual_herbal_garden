import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../app/components/ui/dialog';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { adminApi, ImpactSummary } from '../api/adminApi';

interface DeleteImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'plants' | 'remedies';
  itemId: string;
  itemTitle: string;
  itemSlug: string;
  onConfirm: (slug: string) => Promise<void>;
}

export function DeleteImpactModal({
  isOpen,
  onClose,
  type,
  itemId,
  itemTitle,
  itemSlug,
  onConfirm,
}: DeleteImpactModalProps) {
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [typedSlug, setTypedSlug] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && itemId) {
      setIsLoading(true);
      setTypedSlug('');
      adminApi
        .getContentImpact(type, itemId)
        .then((data) => setImpact(data))
        .catch(() => setImpact(null))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, type, itemId]);

  const canDelete = typedSlug === itemSlug;

  const handleDelete = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    try {
      await onConfirm(typedSlug);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" /> Delete Content Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-slate-700">
          <p>
            You are about to permanently delete <strong>{itemTitle}</strong>.
          </p>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
            <span className="font-semibold text-slate-800 uppercase block">Impact Analysis</span>
            {isLoading ? (
              <div className="flex items-center gap-2 py-2 text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculating referenced dependencies...
              </div>
            ) : impact ? (
              <div className="space-y-1">
                <p>• Remedies referencing: <strong>{impact.remedies}</strong></p>
                <p>• Tours referencing: <strong>{impact.tours}</strong></p>
                <p>• User gardens containing: <strong>{impact.userGardens}</strong></p>
                <p>• Bookmarks referencing: <strong>{impact.bookmarks}</strong></p>
              </div>
            ) : (
              <p className="text-slate-500">No dependency impact data available.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Type <code className="bg-slate-100 text-red-700 px-1 py-0.5 rounded font-mono">{itemSlug}</code> to confirm deletion:
            </label>
            <Input
              value={typedSlug}
              onChange={(e) => setTypedSlug(e.target.value)}
              placeholder={itemSlug}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
