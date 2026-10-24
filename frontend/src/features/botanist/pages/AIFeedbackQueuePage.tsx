import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  Search,
  Filter,
  Check,
  RotateCcw,
  Clock,
  Eye,
  Send,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Leaf,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../app/components/ui/card';
import { Button } from '../../../app/components/ui/button';
import { Badge } from '../../../app/components/ui/badge';
import { Input } from '../../../app/components/ui/input';
import { Textarea } from '../../../app/components/ui/textarea';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import {
  getAIFeedbackQueue,
  submitAIFeedback,
  getAIFeedbackStats,
  searchPlantsAutocomplete,
} from '../api/contributionsApi';
import type { IAIFeedbackQueueItem, IAIFeedbackStats, FeedbackVerdict } from '../types';
import { toast } from 'sonner';

export function AIFeedbackQueuePage() {
  useDocumentTitle('AI Feedback Queue | Virtual Herbal Garden');

  // Filter state
  const [stateFilter, setStateFilter] = useState<'pending' | 'reviewed' | 'all'>('pending');
  const [confidenceFilter, setConfidenceFilter] = useState<'low' | 'all'>('all');
  const [page, setPage] = useState(1);

  // Data state
  const [items, setItems] = useState<IAIFeedbackQueueItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [stats, setStats] = useState<IAIFeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Per-card feedback interaction state
  const [selectedVerdicts, setSelectedVerdicts] = useState<Record<string, FeedbackVerdict>>({});
  const [selectedPlants, setSelectedPlants] = useState<
    Record<string, { id: string; name: string }>
  >({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [plantSearches, setPlantSearches] = useState<Record<string, string>>({});
  const [plantPickerResults, setPlantPickerResults] = useState<
    Record<string, { id: string; commonName: string; scientificName: string }[]>
  >({});
  const [submittingCard, setSubmittingCard] = useState<Record<string, boolean>>({});

  const loadStats = async () => {
    try {
      const res = await getAIFeedbackStats();
      setStats(res);
    } catch {
      // silent
    }
  };

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAIFeedbackQueue({
        state: stateFilter,
        confidence: confidenceFilter,
        page,
        limit: 12,
      });
      setItems(res.items);
      setMeta(res.meta);

      // Pre-populate any existing feedback
      const existingVerdicts: Record<string, FeedbackVerdict> = {};
      const existingComments: Record<string, string> = {};
      res.items.forEach((item) => {
        if (item.myFeedback) {
          existingVerdicts[item.id] = item.myFeedback.verdict;
          if (item.myFeedback.comment) {
            existingComments[item.id] = item.myFeedback.comment;
          }
        }
      });
      setSelectedVerdicts((prev) => ({ ...prev, ...existingVerdicts }));
      setComments((prev) => ({ ...prev, ...existingComments }));
    } catch (err: any) {
      toast.error('Failed to load AI feedback queue');
    } finally {
      setLoading(false);
    }
  }, [stateFilter, confidenceFilter, page]);

  useEffect(() => {
    loadStats();
    fetchQueue();
  }, [fetchQueue]);

  const handlePlantSearch = async (cardId: string, query: string) => {
    setPlantSearches((prev) => ({ ...prev, [cardId]: query }));
    if (!query || query.trim().length < 2) {
      setPlantPickerResults((prev) => ({ ...prev, [cardId]: [] }));
      return;
    }
    try {
      const results = await searchPlantsAutocomplete(query.trim());
      setPlantPickerResults((prev) => ({ ...prev, [cardId]: results }));
    } catch {
      setPlantPickerResults((prev) => ({ ...prev, [cardId]: [] }));
    }
  };

  const handleSelectCorrectPlant = (
    cardId: string,
    plant: { id: string; commonName: string }
  ) => {
    setSelectedPlants((prev) => ({ ...prev, [cardId]: { id: plant.id, name: plant.commonName } }));
    setPlantSearches((prev) => ({ ...prev, [cardId]: plant.commonName }));
    setPlantPickerResults((prev) => ({ ...prev, [cardId]: [] }));
  };

  const handleSubmitFeedback = async (card: IAIFeedbackQueueItem) => {
    const verdict = selectedVerdicts[card.id];
    if (!verdict) {
      toast.error('Please choose a verdict (Correct, Incorrect, Not a Plant, Unsure)');
      return;
    }

    if (verdict === 'INCORRECT' && !selectedPlants[card.id]?.id) {
      toast.error('Please specify the correct plant identity for incorrect identification');
      return;
    }

    const payload = {
      verdict,
      correctPlantId: selectedPlants[card.id]?.id,
      comment: comments[card.id]?.trim() || undefined,
    };

    try {
      setSubmittingCard((prev) => ({ ...prev, [card.id]: true }));

      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.id === card.id
            ? {
                ...item,
                myFeedback: {
                  verdict,
                  correctPlantId: selectedPlants[card.id]?.id,
                  comment: payload.comment,
                  reviewedAt: new Date().toISOString(),
                },
              }
            : item
        )
      );

      await submitAIFeedback(card.id, payload);
      toast.success('Feedback recorded. Thank you for training our vision models!');
      loadStats();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit feedback');
      fetchQueue();
    } finally {
      setSubmittingCard((prev) => ({ ...prev, [card.id]: false }));
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            AI Scanner Quality Control
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            AI Feedback Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verify community identification scans to improve AI model accuracy and prevent botanical misidentification.
          </p>
        </div>
      </div>

      {/* Stats Header Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-amber-900 mt-0.5">
                {stats?.pendingCount ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">My Reviews</p>
              <p className="text-2xl font-bold text-purple-900 mt-0.5">
                {stats?.myReviews ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Scans Reviewed</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {stats?.reviewedCount ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Model Precision</p>
              <p className="text-2xl font-bold text-emerald-900 mt-0.5">
                {stats ? `${stats.accuracyRate}%` : '---'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider ml-1">
            Status:
          </span>
          <button
            onClick={() => {
              setStateFilter('pending');
              setPage(1);
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
              stateFilter === 'pending'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Verification
          </button>
          <button
            onClick={() => {
              setStateFilter('reviewed');
              setPage(1);
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
              stateFilter === 'reviewed'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Already Reviewed
          </button>
          <button
            onClick={() => {
              setStateFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
              stateFilter === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Detections
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Confidence:
          </span>
          <button
            onClick={() => {
              setConfidenceFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
              confidenceFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setConfidenceFilter('low');
              setPage(1);
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
              confidenceFilter === 'low'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Low (&lt; 70%)
          </button>
        </div>
      </div>

      {/* Scans Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading AI detections...</div>
      ) : items.length === 0 ? (
        <Card className="border border-slate-200/80 rounded-2xl p-12 text-center bg-white space-y-2">
          <Sparkles className="w-10 h-10 text-purple-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Queue is clear!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No detections require review under the selected filter criteria. Check back when users submit new scans.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((card) => {
            const verdict = selectedVerdicts[card.id];
            const isSubmitting = submittingCard[card.id];
            const confidencePercent = Math.round(card.confidence * 100);

            return (
              <Card
                key={card.id}
                className="border border-slate-200/80 shadow-xs rounded-2xl bg-white overflow-hidden flex flex-col hover:border-purple-200 transition-all"
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  {card.thumbnail ? (
                    <img
                      src={card.thumbnail}
                      alt="AI scan capture"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Leaf className="w-10 h-10" />
                    </div>
                  )}

                  {/* Confidence Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs ${
                        confidencePercent >= 80
                          ? 'bg-emerald-600 text-white'
                          : confidencePercent >= 60
                          ? 'bg-amber-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {confidencePercent}% Confidence
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="absolute bottom-2 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-medium">
                    {new Date(card.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  {/* Top Match */}
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      AI Top Match
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {card.topMatch?.commonName || 'Unknown plant'}
                    </h3>
                    {card.topMatch?.scientificName && (
                      <p className="text-xs text-slate-500 italic">
                        {card.topMatch.scientificName}
                      </p>
                    )}

                    {/* Alternatives */}
                    {card.alternatives.length > 0 && (
                      <div className="mt-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Alternatives: </span>
                        {card.alternatives.map((alt) => alt.commonName).join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Existing Review Badge if already submitted */}
                  {card.myFeedback && (
                    <div className="bg-purple-50 rounded-xl p-2.5 text-xs text-purple-900 flex items-center justify-between border border-purple-100">
                      <span className="font-medium">
                        Your verdict: <span className="font-bold">{card.myFeedback.verdict}</span>
                      </span>
                      <Check className="w-4 h-4 text-purple-600" />
                    </div>
                  )}

                  {/* Verdict Buttons */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-700 block">
                      Botanist Verification:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedVerdicts((prev) => ({ ...prev, [card.id]: 'CORRECT' }))
                        }
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-1 ${
                          verdict === 'CORRECT'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-emerald-50/60 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedVerdicts((prev) => ({ ...prev, [card.id]: 'INCORRECT' }))
                        }
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-1 ${
                          verdict === 'INCORRECT'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-rose-50/60 text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedVerdicts((prev) => ({ ...prev, [card.id]: 'NOT_A_PLANT' }))
                        }
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-1 ${
                          verdict === 'NOT_A_PLANT'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-amber-50/60 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> Not a Plant
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedVerdicts((prev) => ({ ...prev, [card.id]: 'UNSURE' }))
                        }
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-1 ${
                          verdict === 'UNSURE'
                            ? 'bg-slate-700 text-white border-slate-700'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> Unsure
                      </button>
                    </div>

                    {/* Plant Picker if Incorrect */}
                    {verdict === 'INCORRECT' && (
                      <div className="space-y-1.5 pt-1 relative">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Identify Correct Plant Species:
                        </label>
                        <Input
                          value={plantSearches[card.id] || ''}
                          onChange={(e) => handlePlantSearch(card.id, e.target.value)}
                          placeholder="Search plant library..."
                          className="text-xs h-8 rounded-lg"
                        />
                        {/* Dropdown */}
                        {plantPickerResults[card.id]?.length > 0 && (
                          <div className="absolute left-0 right-0 top-14 z-20 bg-white rounded-xl shadow-lg border border-slate-200 divide-y divide-slate-100 max-h-40 overflow-y-auto">
                            {plantPickerResults[card.id].map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleSelectCorrectPlant(card.id, p)}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-purple-50 flex items-center justify-between"
                              >
                                <span className="font-semibold">{p.commonName}</span>
                                <span className="text-[10px] text-slate-400 italic">
                                  {p.scientificName}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedPlants[card.id]?.id && (
                          <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Selected: {selectedPlants[card.id].name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Optional Comment */}
                    <div className="pt-1">
                      <Input
                        value={comments[card.id] || ''}
                        onChange={(e) =>
                          setComments((prev) => ({ ...prev, [card.id]: e.target.value }))
                        }
                        placeholder="Add review note or morphological observation..."
                        className="text-xs h-8 rounded-lg"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      size="sm"
                      onClick={() => handleSubmitFeedback(card)}
                      disabled={isSubmitting || !verdict}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-xl h-8 font-medium mt-1"
                    >
                      {isSubmitting ? 'Recording...' : card.myFeedback ? 'Update Verdict' : 'Submit Feedback'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Page {meta.page} of {meta.totalPages} ({meta.total} detections)
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs rounded-xl h-8 px-3"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs rounded-xl h-8 px-3"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
