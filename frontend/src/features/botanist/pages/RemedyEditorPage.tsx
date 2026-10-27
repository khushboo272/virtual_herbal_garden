import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  FileText,
  Plus,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  Eye,
  Save,
  Send,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Leaf,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../app/components/ui/card';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { Textarea } from '../../../app/components/ui/textarea';
import { StatusBadge } from '../components/StatusBadge';
import { CompletenessChecklist, type ChecklistItem } from '../components/CompletenessChecklist';
import {
  MedicinalSafetyWarning,
  checkContentSafety,
} from '../components/MedicinalSafetyWarning';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import {
  createRemedyDraft,
  updateRemedyDraft,
  uploadRemedyCover,
  submitContribution,
  getContribution,
  searchPlantsAutocomplete,
} from '../api/contributionsApi';
import type { IRemedyDraftInput, IContributionItem } from '../types';
import { toast } from 'sonner';

interface IngredientRow {
  name: string;
  quantity: string;
  plantId?: string;
  plantName?: string;
}

interface StepRow {
  stepNumber: number;
  instruction: string;
}

export function RemedyEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  useDocumentTitle(
    isEditing ? 'Edit Remedy Draft | Virtual Herbal Garden' : 'New Remedy Draft | Virtual Herbal Garden'
  );

  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isAdminMode =
    searchParams.get('admin') === 'true' ||
    searchParams.get('admin') === '1' ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN';

  const handleAdminSaveAndPublish = async () => {
    try {
      setSubmitting(true);
      const savedId = await handleSaveDraft(true);
      const targetId = savedId || currentId;
      if (!targetId) {
        toast.error('Could not save draft before publishing');
        return;
      }
      const { api } = await import('../../../lib/api');
      await api.post(`/admin/content/remedies/${targetId}/publish`);
      toast.success('Remedy published directly to active library!');
      navigate('/dashboard/content/remedies');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish remedy');
    } finally {
      setSubmitting(false);
    }
  };

  // Form Fields
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('EASY');
  const [preparationTime, setPreparationTime] = useState<number>(15);
  const [usage, setUsage] = useState<'INTERNAL' | 'TOPICAL' | 'INHALATION'>('INTERNAL');
  const [traditionalSource, setTraditionalSource] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { name: '', quantity: '' },
  ]);
  const [preparationSteps, setPreparationSteps] = useState<StepRow[]>([
    { stepNumber: 1, instruction: '' },
  ]);
  const [precautions, setPrecautions] = useState<string[]>(['']);
  const [contraindications, setContraindications] = useState<string[]>(['']);
  const [references, setReferences] = useState<string[]>(['']);

  // Cover image
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Metadata / State
  const [currentId, setCurrentId] = useState<string | null>(id || null);
  const [currentSlug, setCurrentSlug] = useState<string>('');
  const [contributionItem, setContributionItem] = useState<IContributionItem | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Plant picker search state for ingredients
  const [activeIngredientIdx, setActiveIngredientIdx] = useState<number | null>(null);
  const [plantSearchResults, setPlantSearchResults] = useState<
    { id: string; commonName: string; scientificName: string }[]
  >([]);

  // Load existing remedy draft
  useEffect(() => {
    if (!id) return;
    async function loadItem() {
      try {
        setLoading(true);
        const res = await getContribution('remedy', id!);
        setContributionItem(res);
        setCurrentId(res.id);
        setCurrentSlug(res.slug);

        const doc = (res.data || res.rawDoc || res) as any;
        if (doc) {
          setTitle(doc.title || '');
          setSummary(doc.summary || doc.description?.slice(0, 150) || '');
          setDescription(doc.description || '');
          setDifficultyLevel(doc.difficultyLevel || doc.difficulty || 'EASY');
          setPreparationTime(doc.preparationTime || doc.prepTimeMinutes || 15);
          setUsage(doc.usage || 'INTERNAL');
          setTraditionalSource(doc.traditionalSource || '');

          if (Array.isArray(doc.ingredients) && doc.ingredients.length > 0) {
            setIngredients(
              doc.ingredients.map((ing: any) => ({
                name: ing.name || ing.item || '',
                quantity: ing.quantity || ing.amount || '',
                plantId: ing.plantId || ing.plant || undefined,
              }))
            );
          }

          if (Array.isArray(doc.preparationSteps) && doc.preparationSteps.length > 0) {
            setPreparationSteps(
              doc.preparationSteps.map((s: any, idx: number) => ({
                stepNumber: s.stepNumber || idx + 1,
                instruction: typeof s === 'string' ? s : s.instruction || '',
              }))
            );
          }

          if (Array.isArray(doc.precautions) && doc.precautions.length > 0) {
            setPrecautions(doc.precautions);
          }
          if (Array.isArray(doc.contraindications) && doc.contraindications.length > 0) {
            setContraindications(doc.contraindications);
          }
          if (Array.isArray(doc.references) && doc.references.length > 0) {
            setReferences(doc.references);
          }
          if (doc.coverImage?.url || doc.image) {
            setCoverImageUrl(doc.coverImage?.url || doc.image);
          }
        }
      } catch (err: any) {
        toast.error('Failed to load remedy draft');
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [id]);

  // Content safety checks
  const textCorpus = [
    title,
    summary,
    description,
    ...preparationSteps.map((s) => s.instruction),
    ...precautions,
    ...contraindications,
  ];
  const detectedSafetyPhrases = checkContentSafety(textCorpus);

  // Autosave timer
  useEffect(() => {
    if (!isDirty || !currentId) return;

    const timer = setTimeout(async () => {
      try {
        await handleSaveDraft(true);
      } catch {
        // silent
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isDirty, currentId, title, description, ingredients, preparationSteps, references]);

  const scrollToField = (fieldId: string) => {
    const el = document.getElementById(`field-${fieldId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const target = (el.querySelector('input, textarea, select') as HTMLElement) || el;
      if (target) {
        target.focus();
        target.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2');
        setTimeout(() => {
          target.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2');
        }, 2000);
      }
    }
  };

  // Checklist computation
  const cleanIngredients = ingredients.filter((i) => i.name.trim().length > 0);
  const cleanSteps = preparationSteps.filter((s) => s.instruction.trim().length > 0);
  const cleanReferences = references.filter((r) => r.trim().length > 0);

  const checklistItems: ChecklistItem[] = [
    {
      id: 'title',
      label: 'Remedy Title',
      isComplete: title.trim().length >= 3,
      isRequiredForReview: true,
      hint: 'Clear, traditional remedy title (min 3 characters)',
    },
    {
      id: 'description',
      label: 'Preparation Overview & Description',
      isComplete: description.trim().length >= 20,
      isRequiredForReview: true,
      hint: 'Describe purpose and traditional background (min 20 characters)',
    },
    {
      id: 'ingredients',
      label: 'At Least 1 Ingredient & Measure',
      isComplete: cleanIngredients.length >= 1,
      isRequiredForReview: true,
      hint: 'Add at least 1 botanic or herbal ingredient',
    },
    {
      id: 'steps',
      label: 'Numbered Preparation Steps',
      isComplete: cleanSteps.length >= 1,
      isRequiredForReview: true,
      hint: 'Add step-by-step preparation instructions',
    },
    {
      id: 'references',
      label: 'Citations & References (Min 1)',
      isComplete: cleanReferences.length >= 1,
      isRequiredForReview: true,
      hint: 'Traditional text or peer-reviewed citation',
    },
    {
      id: 'safety',
      label: 'Content Safety Validated',
      isComplete: detectedSafetyPhrases.length === 0,
      isRequiredForReview: true,
      hint: 'No fabricated curative or miracle claims',
    },
  ];

  const handleSaveDraft = async (isAuto = false): Promise<string | null> => {
    const titleToSave = title.trim() || (isAuto ? 'Untitled Remedy Draft' : '');
    if (!titleToSave) {
      if (!isAuto) toast.error('Remedy title is required to save a draft');
      return null;
    }
    if (!title.trim() && isAuto) {
      setTitle('Untitled Remedy Draft');
    }

    try {
      if (!isAuto) setSaving(true);

      const payload: Partial<IRemedyDraftInput> = {
        title: titleToSave,
        summary: summary.trim() || undefined,
        description: description.trim(),
        difficultyLevel,
        preparationTime: Number(preparationTime) || 15,
        usage,
        ingredients: cleanIngredients,
        preparationSteps: cleanSteps.map((s, idx) => ({
          stepNumber: idx + 1,
          instruction: s.instruction.trim(),
        })),
        precautions: precautions.filter((p) => p.trim().length > 0),
        contraindications: contraindications.filter((c) => c.trim().length > 0),
        traditionalSource: traditionalSource.trim() || undefined,
        references: cleanReferences,
      };

      if (currentId) {
        const updated = await updateRemedyDraft(currentId, payload);
        if (!isAuto) toast.success('Draft saved successfully');
        setIsDirty(false);
        if (updated?.slug && updated.slug !== id) {
          setCurrentSlug(updated.slug);
          navigate(`/dashboard/contributions/remedy/${updated.slug}`, { replace: true });
        }
        return currentId;
      } else {
        const created = await createRemedyDraft(payload);
        setCurrentId(created._id);
        setCurrentSlug(created.slug);
        if (!isAuto) toast.success('Remedy draft created!');
        const targetParam = created.slug || created._id;
        navigate(`/dashboard/contributions/remedy/${targetParam}`, { replace: true });
        setIsDirty(false);
        return created._id;
      }
    } catch (err: any) {
      if (!isAuto) toast.error(err?.message || 'Failed to save remedy draft');
      return null;
    } finally {
      if (!isAuto) setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (title.trim().length < 3) {
      toast.error('Remedy Title must be at least 3 characters.');
      scrollToField('title');
      return;
    }

    if (description.trim().length < 20) {
      toast.error(
        `Preparation Overview & Description must be at least 20 characters (currently ${description.trim().length}).`,
      );
      scrollToField('description');
      return;
    }

    if (cleanIngredients.length === 0) {
      toast.error('At least 1 ingredient with name and quantity is required.');
      scrollToField('ingredients');
      return;
    }

    if (cleanSteps.length === 0) {
      toast.error('At least 1 preparation instruction step is required.');
      scrollToField('steps');
      return;
    }

    if (cleanReferences.length === 0) {
      toast.error('At least one citation or traditional source reference is required');
      scrollToField('references');
      return;
    }

    if (detectedSafetyPhrases.length > 0) {
      toast.error('Submission blocked: unverified claims detected. Please rephrase with traditional context.');
      scrollToField('safety');
      return;
    }

    try {
      setSubmitting(true);
      const savedId = currentId || (await handleSaveDraft(true));
      if (!savedId) {
        toast.error('Please save your draft first');
        return;
      }
      await submitContribution('remedy', savedId);
      toast.success('Remedy submitted for review!');
      const targetParam = currentSlug || currentId;
      navigate(`/dashboard/contributions/remedy/${targetParam}/review`);
    } catch (err: any) {
      if (Array.isArray(err?.details) && err.details.length > 0) {
        const msgs = err.details.map((d: any) => d.message).join('; ');
        toast.error(`Please complete required fields: ${msgs}`);
      } else {
        toast.error(err?.message || 'Failed to submit remedy for review');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);

      let targetId = currentId;
      if (!targetId) {
        const savedId = await handleSaveDraft(true);
        if (!savedId) {
          setUploadingCover(false);
          e.target.value = '';
          return;
        }
        targetId = savedId;
      }

      const res = await uploadRemedyCover(targetId, file);
      const url = res.url || res.imageUrl;
      if (url) {
        setCoverImageUrl(url);
        toast.success('Cover image uploaded');
        setIsDirty(true);
      } else {
        toast.error('Could not get image URL from server');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload cover image');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  // Reorder steps
  const moveStep = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= preparationSteps.length) return;
    const copy = [...preparationSteps];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    copy.forEach((s, i) => {
      s.stepNumber = i + 1;
    });
    setPreparationSteps(copy);
    setIsDirty(true);
  };

  const addStep = () => {
    setPreparationSteps([
      ...preparationSteps,
      { stepNumber: preparationSteps.length + 1, instruction: '' },
    ]);
    setIsDirty(true);
  };

  const removeStep = (index: number) => {
    const copy = preparationSteps.filter((_, i) => i !== index);
    copy.forEach((s, i) => {
      s.stepNumber = i + 1;
    });
    setPreparationSteps(copy);
    setIsDirty(true);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '' }]);
    setIsDirty(true);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const searchPlantsForIngredient = async (query: string, index: number) => {
    setActiveIngredientIdx(index);
    if (!query || query.trim().length < 2) {
      setPlantSearchResults([]);
      return;
    }
    try {
      const results = await searchPlantsAutocomplete(query.trim());
      setPlantSearchResults(results);
    } catch {
      setPlantSearchResults([]);
    }
  };

  const selectPlantForIngredient = (plant: { id: string; commonName: string }, index: number) => {
    const copy = [...ingredients];
    copy[index].name = plant.commonName;
    copy[index].plantId = plant.id;
    copy[index].plantName = plant.commonName;
    setIngredients(copy);
    setActiveIngredientIdx(null);
    setPlantSearchResults([]);
    setIsDirty(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Reviewer Note Banner */}
      {contributionItem?.status === 'CHANGES_REQUESTED' && contributionItem.lastReviewComment && (
        <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold">Reviewer Feedback & Changes Requested</h3>
              <p className="text-xs text-orange-800 mt-1">"{contributionItem.lastReviewComment}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Remedy Preparation Editor
            </span>
            {contributionItem && <StatusBadge status={contributionItem.status} />}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {title || 'Untitled Traditional Remedy Draft'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isDirty ? 'Unsaved changes' : 'Draft up to date'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            onClick={() => handleSaveDraft(false)}
            disabled={saving}
            className="text-xs rounded-xl h-9 px-3.5 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>

          {currentSlug && (
            <Button
              variant="outline"
              onClick={() => window.open(`/remedies/${currentSlug}?preview=1`, '_blank')}
              className="text-xs rounded-xl h-9 px-3.5 flex items-center gap-1.5 text-slate-700"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Remedy Page
            </Button>
          )}

          {isAdminMode ? (
            <Button
              onClick={handleAdminSaveAndPublish}
              disabled={submitting}
              className="bg-green-700 hover:bg-green-800 text-white text-xs rounded-xl h-9 px-4 flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {submitting ? 'Publishing...' : 'Save & Publish'}
            </Button>
          ) : (
            <Button
              onClick={handleSubmitForReview}
              disabled={submitting}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-xl h-9 px-4 flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          )}
        </div>
      </div>

      {/* Real-time Content Safety Warning */}
      <MedicinalSafetyWarning detectedPhrases={detectedSafetyPhrases} />

      {/* Main Grid: Form Sections (Left) & Checklist (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Overview & Metadata */}
          <Card className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" /> Remedy Overview
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div id="field-title" className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="field-title-input" className="block text-xs font-semibold text-slate-700">
                    Remedy Title <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] ${title.trim().length >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {title.trim().length} / 3 min chars {title.trim().length >= 3 && '✓'}
                  </span>
                </div>
                <Input
                  id="field-title-input"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g., Traditional Tulsi-Ginger Decoction for Respiratory Comfort"
                  className="text-xs h-9 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preparation Difficulty
                </label>
                <select
                  value={difficultyLevel}
                  onChange={(e) => {
                    setDifficultyLevel(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full text-xs h-9 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preparation Time (Minutes)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={300}
                  value={preparationTime}
                  onChange={(e) => {
                    setPreparationTime(Number(e.target.value));
                    setIsDirty(true);
                  }}
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Method of Usage
                </label>
                <select
                  value={usage}
                  onChange={(e) => {
                    setUsage(e.target.value as any);
                    setIsDirty(true);
                  }}
                  className="w-full text-xs h-9 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none"
                >
                  <option value="INTERNAL">Internal (Decoction, Tea, Powder)</option>
                  <option value="TOPICAL">Topical (Poultice, Paste, Oil)</option>
                  <option value="INHALATION">Inhalation (Steam, Vapor)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Traditional Source / Tradition
                </label>
                <Input
                  value={traditionalSource}
                  onChange={(e) => {
                    setTraditionalSource(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g., Ayurvedic Pharmacopoeia of India, Siddha tradition"
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brief Summary
                </label>
                <Input
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="One sentence summary of the remedy's traditional use"
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div id="field-description" className="sm:col-span-2 space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="field-description-input" className="block text-xs font-semibold text-slate-700">
                    Preparation Overview & Detailed Description <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-medium transition-colors ${
                      description.trim().length >= 20
                        ? 'text-emerald-600'
                        : description.trim().length > 0
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {description.trim().length} / 20 min characters
                    {description.trim().length > 0 && description.trim().length < 20 && (
                      <span className="ml-1 font-semibold">({20 - description.trim().length} more needed)</span>
                    )}
                    {description.trim().length >= 20 && <span className="ml-1 font-semibold">✓</span>}
                  </span>
                </div>
                <Textarea
                  id="field-description-input"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  rows={4}
                  placeholder="Describe the therapeutic purpose, traditional background, and customary preparation (minimum 20 characters)..."
                  className={`w-full text-xs rounded-xl transition-all ${
                    description.trim().length > 0 && description.trim().length < 20
                      ? 'border-amber-400 focus:border-amber-500 bg-amber-50/10'
                      : ''
                  }`}
                  required
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Ingredients List with Plant Picker */}
          <Card id="field-ingredients" className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-600" /> Ingredients & Botanic Linkage
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link ingredients to existing library plants when possible
                </p>
              </div>
              <Button
                type="button"
                onClick={addIngredient}
                size="sm"
                className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs rounded-xl h-8 px-2.5"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Ingredient
              </Button>
            </div>

            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 relative"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={ing.name}
                        onChange={(e) => {
                          const copy = [...ingredients];
                          copy[idx].name = e.target.value;
                          setIngredients(copy);
                          searchPlantsForIngredient(e.target.value, idx);
                          setIsDirty(true);
                        }}
                        placeholder="Ingredient name (e.g., Fresh Tulsi Leaves)"
                        className="text-xs h-8 bg-white rounded-lg"
                      />
                      {/* Autocomplete Dropdown */}
                      {activeIngredientIdx === idx && plantSearchResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-9 z-20 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden divide-y divide-slate-100">
                          {plantSearchResults.map((plant) => (
                            <button
                              key={plant.id}
                              type="button"
                              onClick={() => selectPlantForIngredient(plant, idx)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 flex items-center justify-between"
                            >
                              <span className="font-semibold text-slate-900">{plant.commonName}</span>
                              <span className="text-[11px] text-slate-400 italic">
                                {plant.scientificName}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="w-44">
                      <Input
                        value={ing.quantity}
                        onChange={(e) => {
                          const copy = [...ingredients];
                          copy[idx].quantity = e.target.value;
                          setIngredients(copy);
                          setIsDirty(true);
                        }}
                        placeholder="Quantity (e.g., 10-12 leaves)"
                        className="text-xs h-8 bg-white rounded-lg"
                      />
                    </div>

                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {ing.plantId && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Linked to library plant profile
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Section 3: Numbered Preparation Steps with Reorder */}
          <Card id="field-steps" className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Step-by-Step Preparation Guide
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ordered instructions for home preparation
                </p>
              </div>
              <Button
                type="button"
                onClick={addStep}
                size="sm"
                className="bg-purple-50 text-purple-800 hover:bg-purple-100 text-xs rounded-xl h-8 px-2.5"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Step
              </Button>
            </div>

            <div className="space-y-3">
              {preparationSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80"
                >
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center shrink-0 mt-1">
                    {idx + 1}
                  </span>

                  <div className="flex-1">
                    <Textarea
                      value={step.instruction}
                      onChange={(e) => {
                        const copy = [...preparationSteps];
                        copy[idx].instruction = e.target.value;
                        setPreparationSteps(copy);
                        setIsDirty(true);
                      }}
                      rows={2}
                      placeholder={`Step ${idx + 1} instructions...`}
                      className="text-xs bg-white rounded-lg"
                    />
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => moveStep(idx, 'up')}
                        className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Move step up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                    )}
                    {idx < preparationSteps.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveStep(idx, 'down')}
                        className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Move step down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    )}
                    {preparationSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                        title="Remove step"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 4: Safety, Precautions & Contraindications */}
          <Card className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Safety, Contraindications & Usage Limits
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Precautions & Side Note Warnings
                </label>
                <Textarea
                  value={precautions.join('\n')}
                  onChange={(e) => {
                    setPrecautions(e.target.value.split('\n'));
                    setIsDirty(true);
                  }}
                  rows={3}
                  placeholder="e.g., Do not consume on an empty stomach&#10;Consume within 12 hours of boiling"
                  className="w-full text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contraindications
                </label>
                <Textarea
                  value={contraindications.join('\n')}
                  onChange={(e) => {
                    setContraindications(e.target.value.split('\n'));
                    setIsDirty(true);
                  }}
                  rows={3}
                  placeholder="e.g., Contraindicated for individuals with peptic ulcers or taking lithium"
                  className="w-full text-xs rounded-xl"
                />
              </div>
            </div>
          </Card>

          {/* Section 5: Sources & References (Min 1 required) */}
          <Card id="field-references" className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Traditional Citations & References <span className="text-rose-500">*</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  At least 1 verified source is mandatory for review
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setReferences([...references, ''])}
                size="sm"
                className="bg-purple-50 text-purple-800 hover:bg-purple-100 text-xs rounded-xl h-8 px-2.5"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Reference
              </Button>
            </div>

            <div className="space-y-2">
              {references.map((refStr, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={refStr}
                    onChange={(e) => {
                      const copy = [...references];
                      copy[idx] = e.target.value;
                      setReferences(copy);
                      setIsDirty(true);
                    }}
                    placeholder="e.g., Charaka Samhita, Chikitsa Sthana Ch. 3; or peer-reviewed journal article"
                    className="text-xs h-9 rounded-xl flex-1"
                    required={idx === 0}
                  />
                  {references.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setReferences(references.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Section 6: Cover Image */}
          <Card className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-600" /> Remedy Photograph
              </h3>
            </div>

            <div>
              <label className="inline-flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer border border-purple-200 transition-colors">
                <Upload className="w-4 h-4" />
                {uploadingCover ? 'Uploading...' : 'Upload Cover Photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>
            </div>

            {coverImageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video max-w-sm bg-slate-100">
                <img
                  src={coverImageUrl}
                  alt="Remedy cover"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar: Checklist & Controls */}
        <div className="space-y-6">
          <div className="sticky top-24 space-y-6">
            <CompletenessChecklist items={checklistItems} onItemClick={scrollToField} />

            <Card className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-4 space-y-2.5">
              <Button
                onClick={() => handleSaveDraft(false)}
                disabled={saving}
                variant="outline"
                className="w-full text-xs rounded-xl h-9"
              >
                {saving ? 'Saving...' : 'Save Draft (Ctrl+S)'}
              </Button>
              {isAdminMode ? (
                <Button
                  onClick={handleAdminSaveAndPublish}
                  disabled={submitting}
                  className="w-full bg-green-700 hover:bg-green-800 text-white text-xs rounded-xl h-9 font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  {submitting ? 'Publishing...' : 'Save & Publish'}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitForReview}
                  disabled={submitting}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-xl h-9 font-semibold"
                >
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </Button>
              )}
            </Card>

            <Card className="border border-purple-100 bg-purple-50/40 rounded-2xl p-4 text-xs text-purple-950 space-y-2">
              <h4 className="font-bold flex items-center gap-1.5 text-purple-900">
                <HelpCircle className="w-4 h-4 text-purple-600" /> Traditional Remedy Guidelines
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Remedies must present educational and cultural herbal preparation knowledge. No fabricated cure claims or guarantee language is permitted.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
