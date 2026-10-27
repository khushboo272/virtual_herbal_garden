import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Leaf,
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
  Sparkles,
  HelpCircle,
  X,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../app/components/ui/card';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { Textarea } from '../../../app/components/ui/textarea';
import { Badge } from '../../../app/components/ui/badge';
import { StatusBadge } from '../components/StatusBadge';
import { CompletenessChecklist, type ChecklistItem } from '../components/CompletenessChecklist';
import {
  MedicinalSafetyWarning,
  checkContentSafety,
} from '../components/MedicinalSafetyWarning';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import {
  createPlantDraft,
  updatePlantDraft,
  uploadPlantImage,
  uploadPlantModel,
  submitContribution,
  getContribution,
  searchPlantsAutocomplete,
} from '../api/contributionsApi';
import type { IPlantDraftInput, IContributionItem } from '../types';
import { toast } from 'sonner';

const COMMON_PARTS = ['LEAVES', 'ROOTS', 'BARK', 'FLOWERS', 'SEEDS', 'FRUIT', 'STEM', 'WHOLE_PLANT'];
const PLANT_TYPES = ['HERB', 'SHRUB', 'TREE', 'CLIMBER', 'CREEPER', 'GRASS'];
const SUNLIGHT_OPTIONS = ['FULL_SUN', 'PARTIAL_SHADE', 'FULL_SHADE'];
const WATER_OPTIONS = ['LOW', 'MODERATE', 'HIGH'];

interface MedicinalUseRow {
  use: string;
  details: string;
}

export function PlantEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  useDocumentTitle(isEditing ? 'Edit Plant Draft | Virtual Herbal Garden' : 'New Plant Draft | Virtual Herbal Garden');

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
      await api.post(`/admin/content/plants/${targetId}/publish`);
      toast.success('Plant published directly to active library!');
      navigate('/dashboard/content/plants');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish plant');
    } finally {
      setSubmitting(false);
    }
  };

  // Form Fields State
  const [commonName, setCommonName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [family, setFamily] = useState('');
  const [plantType, setPlantType] = useState('HERB');
  const [nativeRegion, setNativeRegion] = useState('');
  const [description, setDescription] = useState('');
  const [medicinalUses, setMedicinalUses] = useState<MedicinalUseRow[]>([{ use: '', details: '' }]);
  const [partsUsed, setPartsUsed] = useState<string[]>([]);
  const [keyBenefits, setKeyBenefits] = useState<string[]>(['']);
  const [sunlight, setSunlight] = useState('FULL_SUN');
  const [waterRequirements, setWaterRequirements] = useState('MODERATE');
  const [soilType, setSoilType] = useState('');
  const [climate, setClimate] = useState('');
  const [propagation, setPropagation] = useState('');
  const [toxicity, setToxicity] = useState('NONE');
  const [precautions, setPrecautions] = useState<string[]>(['']);
  const [references, setReferences] = useState<string[]>(['']);
  const [aliases, setAliases] = useState<string[]>([]);
  const [aliasInput, setAliasInput] = useState('');

  // Image & 3D state
  const [images, setImages] = useState<{ url: string; caption?: string; isHero?: boolean }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [model3dUrl, setModel3dUrl] = useState<string | null>(null);
  const [uploadingModel, setUploadingModel] = useState(false);

  // Metadata / Server State
  const [currentId, setCurrentId] = useState<string | null>(id || null);
  const [currentSlug, setCurrentSlug] = useState<string>('');
  const [contributionItem, setContributionItem] = useState<IContributionItem | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<{ name: string; slug: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load existing draft if editing
  useEffect(() => {
    if (!id) return;
    async function loadItem() {
      try {
        setLoading(true);
        const res = await getContribution('plant', id!);
        setContributionItem(res);
        setCurrentId(res.id);
        setCurrentSlug(res.slug);

        const doc = (res.data || res.rawDoc || res) as any;
        if (doc) {
          setCommonName(doc.commonName || '');
          setScientificName(doc.scientificName || '');
          setFamily(doc.family || '');
          setPlantType(doc.plantType || 'HERB');
          setNativeRegion(doc.nativeRegion || (Array.isArray(doc.regionNative) ? doc.regionNative.join(', ') : '') || '');
          setDescription(doc.description || '');

          if (Array.isArray(doc.medicinalUses) && doc.medicinalUses.length > 0) {
            setMedicinalUses(
              doc.medicinalUses.map((u: any) =>
                typeof u === 'string' ? { use: u, details: '' } : { use: u.use || '', details: u.details || '' }
              )
            );
          }

          if (Array.isArray(doc.partsUsed)) {
            setPartsUsed(doc.partsUsed.map((p: any) => String(p).toUpperCase()));
          }
          if (Array.isArray(doc.keyBenefits) && doc.keyBenefits.length > 0) setKeyBenefits(doc.keyBenefits);
          const cult = doc.growingConditions || doc.cultivation || {};
          if (cult) {
            setSunlight(cult.sunlight || 'FULL_SUN');
            setWaterRequirements(cult.water || cult.waterRequirements || 'MODERATE');
            setSoilType(cult.soil || cult.soilType || '');
            setClimate(cult.climate || '');
            setPropagation(cult.propagation || '');
          }
          if (doc.toxicityLevel || doc.toxicity) {
            setToxicity(doc.toxicityLevel || doc.toxicity);
          }
          if (doc.precautions && doc.precautions.length > 0) setPrecautions(doc.precautions);
          if (doc.references && doc.references.length > 0) setReferences(doc.references);
          if (Array.isArray(doc.aliases)) setAliases(doc.aliases);
          if (Array.isArray(doc.images)) {
            setImages(doc.images.map((img: any, i: number) => ({ url: img.cardUrl || img.fullUrl || img.url, caption: img.caption || img.alt || '', isHero: img.isPrimary ?? (i === 0) })));
          }
          if (doc.model3dUrl || doc.modelUrl) setModel3dUrl(doc.model3dUrl || doc.modelUrl);
        }
      } catch (err: any) {
        toast.error('Failed to load plant draft');
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [id]);

  // Live duplicate scientificName warning check
  useEffect(() => {
    if (!scientificName || scientificName.trim().length < 3) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const matches = await searchPlantsAutocomplete(scientificName.trim());
        const exact = matches.find(
          (m) =>
            m.scientificName.toLowerCase() === scientificName.trim().toLowerCase() &&
            m.id !== currentId
        );
        if (exact) {
          setDuplicateWarning({ name: exact.scientificName, slug: exact.slug });
        } else {
          setDuplicateWarning(null);
        }
      } catch {
        // silent
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [scientificName, currentId]);

  // Content safety check on all text
  const textCorpus = [
    description,
    ...medicinalUses.map((m) => `${m.use} ${m.details}`),
    ...keyBenefits,
    ...precautions,
  ];
  const detectedSafetyPhrases = checkContentSafety(textCorpus);

  // Autosave timer (debounced every 10 seconds if dirty and draft has an ID)
  useEffect(() => {
    if (!isDirty || !currentId) return;

    const timer = setTimeout(async () => {
      try {
        await handleSaveDraft(true);
      } catch {
        // silent background save
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [
    isDirty,
    currentId,
    commonName,
    scientificName,
    family,
    description,
    medicinalUses,
    keyBenefits,
    references,
  ]);

  // Completeness items for checklist
  const cleanMedicinalUses = medicinalUses.filter((m) => m.use.trim().length > 0);
  const cleanReferences = references.filter((r) => r.trim().length > 0);
  const cleanKeyBenefits = keyBenefits.filter((b) => b.trim().length > 0);

  const checklistItems: ChecklistItem[] = [
    {
      id: 'names',
      label: 'Common & Scientific Names',
      isComplete: commonName.trim().length >= 2 && scientificName.trim().length >= 2,
      isRequiredForReview: true,
      hint: 'Scientific binomial is mandatory',
    },
    {
      id: 'family',
      label: 'Botanical Family',
      isComplete: family.trim().length > 0,
      isRequiredForReview: true,
      hint: 'Botanical family is mandatory (e.g., Lamiaceae)',
    },
    {
      id: 'description',
      label: 'Botanical Description',
      isComplete: description.trim().length >= 20,
      isRequiredForReview: true,
      hint: 'At least 20 characters describing morphology',
    },
    {
      id: 'medicinalUses',
      label: 'Medicinal Uses (Rows)',
      isComplete: cleanMedicinalUses.length >= 1,
      isRequiredForReview: true,
      hint: 'Add at least one specific therapeutic use',
    },
    {
      id: 'partsUsed',
      label: 'Parts Used',
      isComplete: partsUsed.length >= 1,
      isRequiredForReview: true,
      hint: 'Select at least one plant part',
    },
    {
      id: 'keyBenefits',
      label: 'Key Benefits',
      isComplete: cleanKeyBenefits.length >= 1,
      isRequiredForReview: true,
    },
    {
      id: 'references',
      label: 'Citations & References (Min 1)',
      isComplete: cleanReferences.length >= 1,
      isRequiredForReview: true,
      hint: 'At least one reputable scientific/traditional reference',
    },
    {
      id: 'images',
      label: 'At Least One Plant Image',
      isComplete: images.length >= 1,
      isRequiredForReview: true,
      hint: 'Upload authentic botanical photography',
    },
    {
      id: 'safety',
      label: 'Content Safety Validated',
      isComplete: detectedSafetyPhrases.length === 0,
      isRequiredForReview: true,
      hint: 'No absolute claims ("cures", "guaranteed", etc.)',
    },
    {
      id: 'duplicate',
      label: 'No Duplicate Species Binomial',
      isComplete: !duplicateWarning,
      isRequiredForReview: true,
      hint: 'Binomial must be unique in repository',
    },
  ];

  const handleSaveDraft = async (isAuto = false): Promise<string | null> => {
    const nameToSave = commonName.trim() || (isAuto ? 'Untitled Plant Draft' : '');
    if (!nameToSave) {
      if (!isAuto) toast.error('Common name is required to save a draft');
      return null;
    }
    if (!commonName.trim() && isAuto) {
      setCommonName('Untitled Plant Draft');
    }

    try {
      if (!isAuto) setSaving(true);

      const payload: Partial<IPlantDraftInput> & Record<string, unknown> = {
        commonName: nameToSave,
        scientificName: scientificName.trim() || undefined,
        family: family.trim() || undefined,
        plantType,
        nativeRegion: nativeRegion.trim() || undefined,
        regionNative: nativeRegion.trim() ? [nativeRegion.trim()] : ['Unspecified'],
        description: description.trim() || undefined,
        medicinalUses: cleanMedicinalUses.map((m) =>
          m.details?.trim() ? `${m.use.trim()}: ${m.details.trim()}` : m.use.trim()
        ),
        partsUsed: partsUsed.map((p) => p.toLowerCase()),
        keyBenefits: cleanKeyBenefits,
        growingConditions: {
          sunlight,
          water: waterRequirements,
          soil: soilType.trim() || undefined,
          climate: climate.trim() || undefined,
          propagation: propagation.trim() || undefined,
        },
        cultivation: {
          sunlight,
          water: waterRequirements,
          soil: soilType.trim() || undefined,
          climate: climate.trim() || undefined,
          propagation: propagation.trim() || undefined,
        },
        sunlight,
        waterRequirements,
        soilType: soilType.trim() || undefined,
        climate: climate.trim() || undefined,
        propagation: propagation.trim() || undefined,
        toxicityLevel: toxicity,
        toxicity,
        precautions: precautions.filter((p) => p.trim().length > 0),
        references: cleanReferences,
        aliases,
      };

      if (currentId) {
        const updated = await updatePlantDraft(currentId, payload);
        if (!isAuto) toast.success('Draft saved successfully');
        setIsDirty(false);
        if (updated?.slug && updated.slug !== id) {
          setCurrentSlug(updated.slug);
          navigate(`/dashboard/contributions/plant/${updated.slug}`, { replace: true });
        }
        return currentId;
      } else {
        const created = await createPlantDraft(payload);
        setCurrentId(created._id);
        setCurrentSlug(created.slug);
        if (!isAuto) toast.success('Draft created! You can now add photos and submit for review');
        const targetParam = created.slug || created._id;
        navigate(`/dashboard/contributions/plant/${targetParam}`, { replace: true });
        setIsDirty(false);
        return created._id;
      }
    } catch (err: any) {
      if (!isAuto) toast.error(err?.message || 'Failed to save draft');
      return null;
    } finally {
      if (!isAuto) setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    setFieldErrors({});

    if (!currentId) {
      toast.error('Please save your draft first');
      return;
    }

    if (detectedSafetyPhrases.length > 0) {
      toast.error('Cannot submit: unverified curative claims detected. Please rephrase.');
      return;
    }

    if (duplicateWarning) {
      toast.error(`A plant with scientific name "${duplicateWarning.name}" already exists.`);
      return;
    }

    try {
      setSubmitting(true);
      // Save any pending changes first
      await handleSaveDraft(true);

      await submitContribution('plant', currentId);
      toast.success('Submitted for botanical review!');
      const targetParam = currentSlug || currentId;
      navigate(`/dashboard/contributions/plant/${targetParam}/review`);
    } catch (err: any) {
      if (err?.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else if (Array.isArray(err?.details)) {
        const errMap: Record<string, string> = {};
        err.details.forEach((d: any) => {
          if (d.field && d.message) errMap[d.field] = d.message;
        });
        setFieldErrors(errMap);
      }
      if (Array.isArray(err?.details) && err.details.length > 0) {
        const msgs = err.details.map((d: any) => d.message).join('; ');
        toast.error(`Please complete required fields: ${msgs}`);
      } else {
        toast.error(err?.message || 'Failed to submit for review. Please check the completeness checklist.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 7) {
      toast.error('Maximum 7 photos allowed per plant (1 hero + 6 gallery)');
      return;
    }

    try {
      setUploadingImage(true);

      let targetId = currentId;
      if (!targetId) {
        const savedId = await handleSaveDraft(true);
        if (!savedId) {
          setUploadingImage(false);
          e.target.value = '';
          return;
        }
        targetId = savedId;
      }

      const res = await uploadPlantImage(targetId, file);
      const url = res?.url;
      if (url) {
        setImages((prev) => [...prev, { url, isHero: prev.length === 0 }]);
        toast.success('Photo uploaded successfully');
        setIsDirty(true);
      } else {
        toast.error('Upload succeeded but no photo URL was returned');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload image. Verify file is JPEG/PNG/WebP.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentId) {
      toast.error('Please save the draft before uploading a 3D model');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.glb')) {
      toast.error('Only binary GLB 3D files are supported');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('3D model must be under 10 MB');
      return;
    }

    try {
      setUploadingModel(true);
      await uploadPlantModel(currentId, file, 'lod0');
      toast.success('3D model uploaded successfully');
      setIsDirty(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload 3D model. Cloudflare R2 may not be configured.');
    } finally {
      setUploadingModel(false);
      e.target.value = '';
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    const copy = [...images];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    // Hero is always index 0
    copy.forEach((img, i) => {
      img.isHero = i === 0;
    });
    setImages(copy);
    setIsDirty(true);
  };

  const removeImage = (index: number) => {
    const copy = images.filter((_, i) => i !== index);
    copy.forEach((img, i) => {
      img.isHero = i === 0;
    });
    setImages(copy);
    setIsDirty(true);
  };

  const addMedicinalUse = () => {
    setMedicinalUses([...medicinalUses, { use: '', details: '' }]);
    setIsDirty(true);
  };

  const removeMedicinalUse = (index: number) => {
    setMedicinalUses(medicinalUses.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const addReference = () => {
    setReferences([...references, '']);
    setIsDirty(true);
  };

  const removeReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const togglePartUsed = (part: string) => {
    if (partsUsed.includes(part)) {
      setPartsUsed(partsUsed.filter((p) => p !== part));
    } else {
      setPartsUsed([...partsUsed, part]);
    }
    setIsDirty(true);
  };

  const addAlias = () => {
    if (aliasInput.trim() && !aliases.includes(aliasInput.trim())) {
      setAliases([...aliases, aliasInput.trim()]);
      setAliasInput('');
      setIsDirty(true);
    }
  };

  const removeAlias = (alias: string) => {
    setAliases(aliases.filter((a) => a !== alias));
    setIsDirty(true);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-sm text-slate-500">
        Loading plant draft details...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Reviewer Note Banner for Changes Requested */}
      {contributionItem?.status === 'CHANGES_REQUESTED' && contributionItem.lastReviewComment && (
        <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold">Reviewer Feedback & Changes Requested</h3>
              <p className="text-xs text-orange-800 mt-1 leading-relaxed">
                "{contributionItem.lastReviewComment}"
              </p>
              <p className="text-[11px] text-orange-700 font-medium mt-2">
                Make the required adjustments below, save, and submit for review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Editor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Plant Profile Editor
            </span>
            {contributionItem && <StatusBadge status={contributionItem.status} />}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {commonName || 'Untitled Plant Draft'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isDirty ? 'Unsaved changes' : 'All changes saved to draft'}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
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
              onClick={() => window.open(`/library/${currentSlug}?preview=1`, '_blank')}
              className="text-xs rounded-xl h-9 px-3.5 flex items-center gap-1.5 text-slate-700"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Library Page
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

      {/* Content Safety Warning (Real-time) */}
      <MedicinalSafetyWarning detectedPhrases={detectedSafetyPhrases} />

      {/* Main Grid: Form Sections (Left) & Completeness Checklist (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Body */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Taxonomy & Basics */}
          <Card className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600" /> Botanical Taxonomy & Basics
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Nomenclature, family, and origin</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Common Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={commonName}
                  onChange={(e) => {
                    setCommonName(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g., Tulsi / Holy Basil"
                  className="text-xs h-9 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scientific Binomial Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={scientificName}
                  onChange={(e) => {
                    setScientificName(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g., Ocimum sanctum"
                  className={`text-xs h-9 rounded-xl italic ${
                    duplicateWarning ? 'border-rose-400 bg-rose-50/50' : ''
                  }`}
                  required
                />
                {duplicateWarning && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Species already exists in library ({duplicateWarning.name}).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Botanical Family <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={family}
                  onChange={(e) => {
                    setFamily(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g., Lamiaceae"
                  className={`text-xs h-9 rounded-xl ${fieldErrors.family ? 'border-rose-400 bg-rose-50/50' : ''}`}
                  required
                />
                {fieldErrors.family && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {fieldErrors.family}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Growth Type
                </label>
                <select
                  value={plantType}
                  onChange={(e) => {
                    setPlantType(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full text-xs h-9 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none focus:border-purple-400"
                >
                  {PLANT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Native Region & Habitat
                </label>
                <Input
                  value={nativeRegion}
                  onChange={(e) => {
                    setNativeRegion(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g., Indian Subcontinent, tropical Asia"
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              {/* Aliases / Local Vernacular Names */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vernacular & Local Aliases
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAlias();
                      }
                    }}
                    placeholder="Type alias and press Add (e.g., Vrinda, Tulasi)"
                    className="text-xs h-9 rounded-xl flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addAlias}
                    size="sm"
                    className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs"
                  >
                    Add
                  </Button>
                </div>
                {aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {aliases.map((al) => (
                      <span
                        key={al}
                        className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-xs"
                      >
                        {al}
                        <button
                          type="button"
                          onClick={() => removeAlias(al)}
                          className="hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Section 2: Botanical Description */}
          <Card className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" /> Botanical Description
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed morphological and ecological characteristics
              </p>
            </div>

            <div>
              <Textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsDirty(true);
                }}
                rows={4}
                placeholder="Describe leaf morphology, branching, scent, floral structure, and distinguishing traits..."
                className="w-full text-xs rounded-xl"
                required
              />
            </div>
          </Card>

          {/* Section 3: Medicinal Uses (Repeatable Rows) */}
          <Card className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Medicinal Uses (Structured)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Document therapeutic applications with educational and traditional context
                </p>
              </div>
              <Button
                type="button"
                onClick={addMedicinalUse}
                size="sm"
                className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs rounded-xl h-8 px-2.5"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
              </Button>
            </div>

            <div className="space-y-3">
              {medicinalUses.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/70"
                >
                  <div className="flex-1 space-y-2">
                    <Input
                      value={row.use}
                      onChange={(e) => {
                        const copy = [...medicinalUses];
                        copy[idx].use = e.target.value;
                        setMedicinalUses(copy);
                        setIsDirty(true);
                      }}
                      placeholder="Indication / Use (e.g., Respiratory health, adaptogenic support)"
                      className="text-xs h-8 bg-white rounded-lg"
                    />
                    <Input
                      value={row.details}
                      onChange={(e) => {
                        const copy = [...medicinalUses];
                        copy[idx].details = e.target.value;
                        setMedicinalUses(copy);
                        setIsDirty(true);
                      }}
                      placeholder="Details / Traditional preparation notes (e.g., Infusion taken with honey)"
                      className="text-xs h-8 bg-white rounded-lg"
                    />
                  </div>
                  {medicinalUses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicinalUse(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Section 4: Parts Used & Key Benefits */}
          <Card className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Parts Used & Key Benefits</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Parts Used (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_PARTS.map((part) => {
                  const selected = partsUsed.includes(part);
                  return (
                    <button
                      key={part}
                      type="button"
                      onClick={() => togglePartUsed(part)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        selected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      {part}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Key Benefits (One per line)
              </label>
              <Textarea
                value={keyBenefits.join('\n')}
                onChange={(e) => {
                  setKeyBenefits(e.target.value.split('\n'));
                  setIsDirty(true);
                }}
                rows={3}
                placeholder="Boosts natural vitality&#10;Supports respiratory comfort&#10;Mild antimicrobial qualities"
                className="w-full text-xs rounded-xl"
              />
            </div>
          </Card>

          {/* Section 5: Cultivation Profile */}
          <Card className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Cultivation & Agronomy</h3>
              <p className="text-xs text-slate-500 mt-0.5">Growing guidelines for herbal gardeners</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sunlight Needs
                </label>
                <select
                  value={sunlight}
                  onChange={(e) => {
                    setSunlight(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full text-xs h-9 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none"
                >
                  {SUNLIGHT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Water Requirements
                </label>
                <select
                  value={waterRequirements}
                  onChange={(e) => {
                    setWaterRequirements(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full text-xs h-9 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none"
                >
                  {WATER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Soil Composition
                </label>
                <Input
                  value={soilType}
                  onChange={(e) => {
                    setSoilType(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g., Well-drained loamy, pH 6.0-7.5"
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Climate & Propagation
                </label>
                <Input
                  value={propagation}
                  onChange={(e) => {
                    setPropagation(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g., Seeds or stem cuttings"
                  className="text-xs h-9 rounded-xl"
                />
              </div>
            </div>
          </Card>

          {/* Section 6: Safety, Precautions & Toxicity */}
          <Card className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Safety, Precautions & Toxicity</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Precautions & Contraindications (One per line)
              </label>
              <Textarea
                value={precautions.join('\n')}
                onChange={(e) => {
                  setPrecautions(e.target.value.split('\n'));
                  setIsDirty(true);
                }}
                rows={3}
                placeholder="Not recommended in high doses during early pregnancy&#10;May interact with anticoagulant medications"
                className="w-full text-xs rounded-xl"
              />
            </div>
          </Card>

          {/* Section 7: Citations & Bibliographic References (Min 1 required) */}
          <Card className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Scientific Sources & References <span className="text-rose-500">*</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  At least 1 verified citation is required for publication review
                </p>
              </div>
              <Button
                type="button"
                onClick={addReference}
                size="sm"
                className="bg-purple-50 text-purple-800 hover:bg-purple-100 text-xs rounded-xl h-8 px-2.5"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Citation
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
                    placeholder="e.g., World Health Organization (WHO) Monographs on Selected Medicinal Plants, Vol. 2"
                    className="text-xs h-9 rounded-xl flex-1"
                    required={idx === 0}
                  />
                  {references.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReference(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Section 8: Image Gallery & 3D Model */}
          <Card className="border border-slate-200/80 rounded-2xl shadow-xs bg-white p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" /> Media & Photographs
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hero photo + up to 6 gallery pictures. Verified magic-byte validation.
              </p>
            </div>

            {/* Upload Button */}
            <div>
              <label className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer border border-emerald-200 transition-colors">
                <Upload className="w-4 h-4" />
                {uploadingImage ? 'Uploading Image...' : 'Upload Plant Photograph'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400 ml-3">
                {images.length}/7 images uploaded
              </span>
            </div>

            {/* Gallery Grid with Reorder */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100"
                  >
                    <img
                      src={img.url}
                      alt={`Plant photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {img.isHero && (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        Hero Photo
                      </span>
                    )}

                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 'up')}
                          className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white"
                          title="Move left/up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 'down')}
                          className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white"
                          title="Move right/down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Optional 3D Model Upload */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Interactive 3D Botanical Model (Optional, GLB format up to 10 MB)
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer border border-purple-200 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploadingModel ? 'Uploading GLB Model...' : 'Upload GLB Model'}
                  <input
                    type="file"
                    accept=".glb"
                    onChange={handleModelUpload}
                    disabled={uploadingModel}
                    className="hidden"
                  />
                </label>
                {model3dUrl && (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Model Attached
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar: Completeness Checklist & Guidelines */}
        <div className="space-y-6">
          <div className="sticky top-24 space-y-6">
            <CompletenessChecklist items={checklistItems} />

            {/* Quick Actions in Checklist Box */}
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

            {/* Guidelines Card */}
            <Card className="border border-purple-100 bg-purple-50/40 rounded-2xl p-4 text-xs text-purple-950 space-y-2">
              <h4 className="font-bold flex items-center gap-1.5 text-purple-900">
                <HelpCircle className="w-4 h-4 text-purple-600" /> Botanical Contributor FAQ
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Entries are reviewed by senior botanists and admins. Submissions are checked for scientific citations, authentic photography, and content safety.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
