import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  Edit,
  ExternalLink,
  AlertTriangle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Star,
  Leaf,
  FileText,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Badge } from '../../../app/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../app/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../app/components/ui/dialog';
import { Textarea } from '../../../app/components/ui/textarea';
import { Checkbox } from '../../../app/components/ui/checkbox';
import {
  getModerationItemDetail,
  approveModerationItem,
  rejectModerationItem,
  requestChangesModerationItem,
} from '../api/adminApi';
import type { ModerationItemDetail } from '../types/admin.types';
import { toast } from 'sonner';

export function ModerationReviewPage() {
  const { type, id } = useParams<{ type: 'plant' | 'remedy'; id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<ModerationItemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [featureOnHome, setFeatureOnHome] = useState(false);
  const [actionComment, setActionComment] = useState('');
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'CHANGES' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadDetail = async () => {
    if (!type || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getModerationItemDetail(type, id);
      setDetail(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load item for moderation review');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [type, id]);

  const handleApprove = async () => {
    if (!type || !id) return;
    try {
      setIsProcessing(true);
      await approveModerationItem(type, id, { feature: featureOnHome });
      toast.success(`${type === 'plant' ? 'Plant' : 'Remedy'} approved and published!`);
      setActionType(null);
      if (detail?.queuePosition?.nextId) {
        navigate(`/dashboard/moderation/${type}/${detail.queuePosition.nextId}`);
      } else {
        navigate(`/dashboard/moderation?type=${type}`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve item');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!type || !id || !actionComment.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      setIsProcessing(true);
      await rejectModerationItem(type, id, { reason: actionComment.trim() });
      toast.success('Submission rejected and feedback recorded.');
      setActionType(null);
      if (detail?.queuePosition?.nextId) {
        navigate(`/dashboard/moderation/${type}/${detail.queuePosition.nextId}`);
      } else {
        navigate(`/dashboard/moderation?type=${type}`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject item');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!type || !id || !actionComment.trim()) {
      toast.error('Please specify feedback on changes requested');
      return;
    }
    try {
      setIsProcessing(true);
      await requestChangesModerationItem(type, id, { comment: actionComment.trim() });
      toast.success('Changes requested. Contributor has been notified.');
      setActionType(null);
      if (detail?.queuePosition?.nextId) {
        navigate(`/dashboard/moderation/${type}/${detail.queuePosition.nextId}`);
      } else {
        navigate(`/dashboard/moderation?type=${type}`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to request changes');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500 animate-pulse">Loading submission details...</div>;
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard/moderation')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Moderation Queue
        </Button>
        <Card className="border-red-200 bg-red-50 p-6">
          <p className="text-red-800">{error || 'Item not found'}</p>
        </Card>
      </div>
    );
  }

  const { item, duplicateCandidates, safetyFindings, reviewHistory, queuePosition } = detail;
  const isPlant = type === 'plant';

  return (
    <div className="space-y-6">
      {/* Top Bar with Queue Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/moderation?type=${type}`)}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {isPlant ? item.commonName : item.title}
              </h1>
              <Badge className="bg-amber-100 text-amber-800 font-semibold text-xs">
                {item.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Submitted by <span className="font-medium text-slate-700">{item.owner?.displayName || item.createdBy?.displayName || 'Contributor'}</span>
            </p>
          </div>
        </div>

        {/* Previous / Next in Queue */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!queuePosition?.prevId}
            onClick={() => queuePosition?.prevId && navigate(`/dashboard/moderation/${type}/${queuePosition.prevId}`)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!queuePosition?.nextId}
            onClick={() => queuePosition?.nextId && navigate(`/dashboard/moderation/${type}/${queuePosition.nextId}`)}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Preview (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images preview gallery */}
          {item.images && item.images.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase text-slate-500">
                  Media & Photos ({item.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {item.images.map((img: any, idx: number) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                      <img src={img.url} alt={img.alt || 'Plant preview'} className="w-full h-full object-cover" />
                      {img.isPrimary && (
                        <Badge className="absolute top-1 left-1 bg-green-700 text-white text-[10px]">
                          Hero
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3D Model Badge if exists */}
          {item.model3d?.url && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <Layers className="w-6 h-6 text-emerald-700 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">3D Botanical Asset Attached</h4>
                  <p className="text-xs text-emerald-700 font-mono mt-0.5">{item.model3d.url}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plant Core Details */}
          {isPlant && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">Botanical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Scientific Name</span>
                    <p className="font-serif italic font-medium text-slate-800">{item.scientificName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Family</span>
                    <p className="font-medium text-slate-800">{item.family}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Plant Type</span>
                    <p className="font-medium text-slate-800">{item.plantType}</p>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Description</span>
                  <p className="text-slate-700 mt-1 leading-relaxed whitespace-pre-line">{item.description}</p>
                </div>

                {item.medicinalUses && item.medicinalUses.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Medicinal Uses</span>
                    <ul className="mt-2 space-y-1.5 list-disc list-inside text-slate-700">
                      {item.medicinalUses.map((u: any, i: number) => (
                        <li key={i}>
                          <strong className="font-medium text-slate-900">{u.use || u}:</strong> {u.details || ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.partsUsed && item.partsUsed.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Parts Used</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {item.partsUsed.map((p: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {item.precautions && item.precautions.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="text-xs text-amber-800 uppercase font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Precautions & Contraindications
                    </span>
                    <ul className="mt-1 list-disc list-inside text-xs text-amber-900">
                      {item.precautions.map((pr: string, i: number) => (
                        <li key={i}>{pr}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Remedy Core Details */}
          {!isPlant && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">Remedy Recipe & Preparation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Description</span>
                  <p className="text-slate-700 mt-1 leading-relaxed whitespace-pre-line">{item.description}</p>
                </div>

                {item.ingredients && item.ingredients.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Ingredients</span>
                    <ul className="mt-2 space-y-1 text-slate-700">
                      {item.ingredients.map((ing: any, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <strong className="text-slate-900">{ing.name || ing.partUsed}</strong>: {ing.quantity} {ing.unit || ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.preparationSteps && item.preparationSteps.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Preparation Steps</span>
                    <ol className="mt-2 space-y-2 text-slate-700 list-decimal list-inside">
                      {item.preparationSteps.map((s: any, i: number) => (
                        <li key={i} className="pl-1">
                          {s.instruction || s}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sources and References */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase text-slate-500">
                References & Literature Citations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.references && item.references.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  {item.references.map((ref: string, i: number) => (
                    <li key={i} className="break-words">
                      {ref}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> No literature citations or references provided.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Panel: Checklist, Safety Findings, Duplicates, Review History & Actions */}
        <div className="space-y-6">
          {/* Action Box */}
          <Card className="border-green-300 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Editorial Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 pb-2">
                <Checkbox
                  id="feature-home"
                  checked={featureOnHome}
                  onCheckedChange={(checked) => setFeatureOnHome(Boolean(checked))}
                />
                <label htmlFor="feature-home" className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Feature on Homepage upon approval
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Publish
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setActionType('CHANGES')}
                  className="w-full border-amber-300 text-amber-800 hover:bg-amber-50"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-amber-600" />
                  Request Changes
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setActionType('REJECT')}
                  className="w-full border-red-200 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                  Reject Submission
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => navigate(`/dashboard/contributions/${type}/${item._id}?admin=true`)}
                  className="w-full text-slate-600 hover:text-slate-900 text-xs"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit as Admin in Studio
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Safety & Compliance Findings */}
          <Card className={safetyFindings?.hasIssues ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <ShieldAlert className={safetyFindings?.hasIssues ? 'w-4 h-4 text-red-600' : 'w-4 h-4 text-green-600'} />
                Content Safety Check
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              {safetyFindings?.hasIssues ? (
                <div className="space-y-2">
                  <p className="text-red-700 font-medium">Unverified medical or curative claims detected:</p>
                  <ul className="list-disc list-inside text-red-600 space-y-1">
                    {safetyFindings.findings.map((f, i) => (
                      <li key={i}>
                        <span className="font-semibold">"{f.text}"</span> ({f.reason})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-green-700 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Passed automated medical claim filters.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Duplicate Warnings */}
          <Card className={duplicateCandidates?.length > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <AlertTriangle className={duplicateCandidates?.length > 0 ? 'w-4 h-4 text-amber-600' : 'w-4 h-4 text-slate-400'} />
                Duplicate Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              {duplicateCandidates && duplicateCandidates.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-amber-800 font-medium">Existing library entries with similar names:</p>
                  <div className="space-y-1.5">
                    {duplicateCandidates.map((dup) => (
                      <div key={dup.id} className="p-2 bg-white rounded border border-amber-200 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{dup.commonName || dup.title}</p>
                          <p className="italic text-slate-500 text-[11px]">{dup.scientificName}</p>
                        </div>
                        <a
                          href={isPlant ? `/plant/${dup.slug}` : `/remedies/${dup.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-green-700 hover:underline flex items-center gap-0.5"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-600">No duplicate plant names found in active library.</p>
              )}
            </CardContent>
          </Card>

          {/* Review History Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Review History
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              {reviewHistory && reviewHistory.length > 0 ? (
                <div className="space-y-3">
                  {reviewHistory.map((h, i) => (
                    <div key={i} className="border-l-2 border-slate-200 pl-3 py-0.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {h.action}
                        </Badge>
                        <span className="text-slate-400">
                          {new Date(h.at).toLocaleDateString()}
                        </span>
                      </div>
                      {h.comment && <p className="text-slate-700 mt-1 italic">"{h.comment}"</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">First-time submission. No previous review history.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rejection / Request Changes Modal */}
      <Dialog open={actionType !== null} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'REJECT' ? 'Reject Submission' : 'Request Changes from Contributor'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {actionType === 'REJECT'
              ? 'Please provide a clear reason why this submission does not meet editorial standards.'
              : 'Specify exact modifications the contributor should make to their draft before re-submitting.'}
          </p>
          <Textarea
            value={actionComment}
            onChange={(e) => setActionComment(e.target.value)}
            placeholder={
              actionType === 'REJECT'
                ? 'e.g. Unverified medicinal claims violate guidelines.'
                : 'e.g. Please add peer-reviewed botanical citations in the references field.'
            }
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Cancel
            </Button>
            {actionType === 'REJECT' ? (
              <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !actionComment.trim()}>
                Confirm Rejection
              </Button>
            ) : (
              <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleRequestChanges} disabled={isProcessing || !actionComment.trim()}>
                Send Feedback
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
