import { useState, useEffect, useId } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { getTour, createTour, updateTour, publishTour } from '../api/toursApi';
import type { TourCheckpointAdmin, TourLevel } from '../types/tour.types';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

const HEALTH_OPTIONS = [
  { slug: 'immunity', label: 'Immunity' },
  { slug: 'digestion', label: 'Digestion' },
  { slug: 'skin-care', label: 'Skin Care' },
  { slug: 'stress', label: 'Stress & Sleep' },
  { slug: 'respiratory', label: 'Respiratory Health' },
  { slug: 'pain-relief', label: 'Pain & Inflammation' },
  { slug: 'womens-health', label: "Women's Health" },
  { slug: 'heart-health', label: 'Heart & Circulation' },
];

export function AdminTourEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();

  useDocumentTitle(isEditing ? 'Edit Tour | Admin Dashboard' : 'Create New Tour | Admin Dashboard');

  // Metadata Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustom, setIsSlugCustom] = useState(false);
  const [summary, setSummary] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [healthCategory, setHealthCategory] = useState('immunity');
  const [level, setLevel] = useState<TourLevel>('BEGINNER');
  const [tagsInput, setTagsInput] = useState('');
  const [sequential, setSequential] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  // Checkpoints State
  const [checkpoints, setCheckpoints] = useState<TourCheckpointAdmin[]>([
    {
      key: 'cp1',
      order: 1,
      title: 'Introduction to Botanical Medicine',
      summary: 'Overview of secondary metabolites and historical usage.',
      body: 'Detailed botanical lesson text in **markdown**.',
      durationMinutes: 3,
      plantSlugs: ['tulsi'],
      remedySlugs: ['tulsi-kadha-herbal-decoction'],
      keyTakeaways: ['Plants produce bioactive secondary metabolites.'],
      quiz: {
        passScore: 0.6,
        questions: [
          {
            prompt: 'Which plant parts contain bioactive secondary metabolites?',
            options: ['Only synthetic seeds', 'Leaves, roots, or bark depending on species'],
            correctIndex: 1,
            explanation: 'Secondary metabolites concentrate across various organs depending on botanical species.',
          },
        ],
      },
    },
  ]);

  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const [previewMarkdownIdx, setPreviewMarkdownIdx] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-generate slug from title unless manually edited
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugCustom) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  // Load existing tour if editing
  useEffect(() => {
    if (!isEditing || !id) return;
    setIsLoading(true);
    getTour(id, true)
      .then((data: any) => {
        setTitle(data.title || '');
        setSlug(data.slug || '');
        setIsSlugCustom(true);
        setSummary(data.summary || data.description || '');
        setCoverImage(data.coverImage || data.coverImageUrl || '');
        setHealthCategory(data.healthCategory || 'immunity');
        setLevel(data.level || 'BEGINNER');
        setTagsInput(Array.isArray(data.tags) ? data.tags.join(', ') : '');
        setSequential(data.sequential ?? true);
        setIsFeatured(Boolean(data.isFeatured));
        setSortOrder(data.sortOrder || 0);

        if (Array.isArray(data.checkpoints) && data.checkpoints.length > 0) {
          setCheckpoints(data.checkpoints as any);
        }
      })
      .catch((err) => {
        setErrorMessage(err?.message || 'Failed to load tour details');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, isEditing]);

  // Checkpoint Reordering (Up/Down Buttons)
  const moveCheckpoint = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= checkpoints.length) return;

    const list = [...checkpoints];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Re-assign order numbers
    const reordered = list.map((cp, idx) => ({ ...cp, order: idx + 1 }));
    setCheckpoints(reordered);
    setExpandedIndex(targetIndex);
  };

  const addCheckpoint = () => {
    const nextOrder = checkpoints.length + 1;
    const newCp: TourCheckpointAdmin = {
      key: `cp-${Date.now().toString().slice(-4)}`,
      order: nextOrder,
      title: `Checkpoint ${nextOrder}`,
      summary: '',
      body: 'Write lesson body in markdown...',
      durationMinutes: 3,
      plantSlugs: [],
      remedySlugs: [],
      keyTakeaways: [],
      quiz: {
        passScore: 0.6,
        questions: [],
      },
    };
    setCheckpoints([...checkpoints, newCp]);
    setExpandedIndex(checkpoints.length);
  };

  const removeCheckpoint = (index: number) => {
    if (checkpoints.length <= 1) {
      alert('Tours must retain at least 1 checkpoint');
      return;
    }
    const filtered = checkpoints.filter((_, idx) => idx !== index);
    const reordered = filtered.map((cp, idx) => ({ ...cp, order: idx + 1 }));
    setCheckpoints(reordered);
    setExpandedIndex(Math.max(0, index - 1));
  };

  const updateCheckpointField = (index: number, field: keyof TourCheckpointAdmin, value: any) => {
    setCheckpoints((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Validation
  const validateForm = (): string | null => {
    if (!title.trim()) return 'Title is required';
    if (!slug.trim()) return 'Slug is required';
    if (checkpoints.length === 0) return 'At least 1 checkpoint is required';

    const keys = checkpoints.map((c) => c.key.trim());
    if (new Set(keys).size !== keys.length) {
      return 'Each checkpoint must have a unique key';
    }

    for (const [i, cp] of checkpoints.entries()) {
      if (!cp.title.trim()) return `Checkpoint #${i + 1} is missing a title`;
      if (cp.quiz && cp.quiz.questions) {
        for (const [qI, q] of cp.quiz.questions.entries()) {
          if (!q.prompt.trim()) return `Question #${qI + 1} in Checkpoint #${i + 1} has an empty prompt`;
          if (q.options.length < 2) return `Question #${qI + 1} in Checkpoint #${i + 1} must have at least 2 options`;
          if (q.correctIndex < 0 || q.correctIndex >= q.options.length) {
            return `Question #${qI + 1} in Checkpoint #${i + 1} has an invalid correct option index`;
          }
        }
      }
    }
    return null;
  };

  const handleSave = async (publishImmediate = false) => {
    const valError = validateForm();
    if (valError) {
      setErrorMessage(valError);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const cpTotalMinutes = checkpoints.reduce((sum, c) => sum + (c.durationMinutes || 0), 0);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim(),
      coverImage: coverImage.trim() || undefined,
      healthCategory,
      level,
      tags: tagsArray,
      sequential,
      isFeatured,
      sortOrder: Number(sortOrder) || 0,
      estimatedMinutes: cpTotalMinutes > 0 ? cpTotalMinutes : 15,
      checkpoints,
    };

    try {
      let savedTour: any;
      if (isEditing && id) {
        savedTour = await updateTour(id, payload);
      } else {
        savedTour = await createTour(payload);
      }

      if (publishImmediate && savedTour) {
        await publishTour(savedTour._id || savedTour.id);
      }

      setSuccessMessage(
        publishImmediate
          ? 'Tour saved and published successfully!'
          : 'Tour draft saved successfully.'
      );

      if (!isEditing && savedTour) {
        setTimeout(() => {
          navigate(`/dashboard/tours/manage/${savedTour._id || savedTour.id}`);
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save tour');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 animate-pulse">
        Loading tour builder interface...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/dashboard/tours/manage"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-800 hover:text-green-950 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tours List
          </Link>
          <h1 className="text-3xl font-extrabold text-green-950">
            {isEditing ? 'Tour Builder & Editor' : 'Create New Guided Tour'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Note: Botanists may draft tours. Only administrators with ADMIN+ roles can publish tours to the public hub.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {slug && (
            <a
              href={`/virtual-tour/${slug}?preview=1`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold"
            >
              <Eye className="w-4 h-4" />
              Preview
            </a>
          )}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-green-300 bg-white hover:bg-green-50 text-green-800 text-xs font-semibold cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            Publish Tour
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metadata Section */}
      <div className="bg-white rounded-3xl border border-green-100 p-6 sm:p-8 shadow-sm space-y-5">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
          1. Tour Core Metadata
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tour Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Skin & Wound Healing Trail"
              className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tour Slug (URL) *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugCustom(true);
              }}
              placeholder="e.g. skin-wound-healing-trail"
              className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-600 focus:outline-hidden font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Summary Description *</label>
          <textarea
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="A short educational overview of this pathway..."
            className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-600 focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Health Category</label>
            <select
              value={healthCategory}
              onChange={(e) => setHealthCategory(e.target.value)}
              className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-600"
            >
              {HEALTH_OPTIONS.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Learning Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-600"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Cover Image URL</label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-600 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. skin, aloe, neem, burns"
              className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <input
              id="seq-toggle"
              type="checkbox"
              checked={sequential}
              onChange={(e) => setSequential(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded"
            />
            <label htmlFor="seq-toggle" className="text-xs font-semibold text-gray-800 cursor-pointer">
              Sequential (Enforce Checkpoint Order)
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <input
              id="featured-toggle"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded"
            />
            <label htmlFor="featured-toggle" className="text-xs font-semibold text-gray-800 cursor-pointer">
              Featured on Home Page
            </label>
          </div>
        </div>
      </div>

      {/* Checkpoints Builder Section */}
      <div className="bg-white rounded-3xl border border-green-100 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              2. Checkpoints Timeline ({checkpoints.length} stops)
            </h2>
            <p className="text-xs text-gray-500">
              Use the Up / Down controls to re-order checkpoints without drag-and-drop.
            </p>
          </div>

          <button
            type="button"
            onClick={addCheckpoint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Checkpoint
          </button>
        </div>

        {/* Checkpoints List */}
        <div className="space-y-4">
          {checkpoints.map((cp, idx) => {
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={idx}
                className="border border-gray-200 rounded-2xl overflow-hidden transition-all bg-white"
              >
                {/* Checkpoint Header Summary Row */}
                <div className="p-4 bg-gray-50 flex items-center justify-between gap-4">
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}
                  >
                    <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="font-bold text-gray-900 text-sm">{cp.title || 'Untitled Checkpoint'}</div>
                    <span className="text-[11px] font-mono text-gray-400">({cp.key})</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveCheckpoint(idx, 'UP')}
                      title="Move Up"
                      className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === checkpoints.length - 1}
                      onClick={() => moveCheckpoint(idx, 'DOWN')}
                      title="Move Down"
                      className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCheckpoint(idx)}
                      title="Delete Checkpoint"
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Checkpoint Expanded Editor Details */}
                {isExpanded && (
                  <div className="p-6 space-y-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Checkpoint Title</label>
                        <input
                          type="text"
                          value={cp.title}
                          onChange={(e) => updateCheckpointField(idx, 'title', e.target.value)}
                          className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Key (Stable Identifier)</label>
                        <input
                          type="text"
                          value={cp.key}
                          onChange={(e) => updateCheckpointField(idx, 'key', e.target.value)}
                          className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Short Lesson Summary</label>
                      <input
                        type="text"
                        value={cp.summary}
                        onChange={(e) => updateCheckpointField(idx, 'summary', e.target.value)}
                        placeholder="Brief 1-line overview..."
                        className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                      />
                    </div>

                    {/* Markdown Body & Live Preview */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-gray-700">Lesson Body (Markdown Supported)</label>
                        <button
                          type="button"
                          onClick={() => setPreviewMarkdownIdx(previewMarkdownIdx === idx ? null : idx)}
                          className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                        >
                          {previewMarkdownIdx === idx ? 'Close Preview' : 'Show Live Preview'}
                        </button>
                      </div>

                      {previewMarkdownIdx === idx ? (
                        <div className="p-4 bg-emerald-50/20 border border-emerald-200 rounded-xl prose prose-xs max-w-none text-gray-800">
                          <ReactMarkdown>{cp.body}</ReactMarkdown>
                        </div>
                      ) : (
                        <textarea
                          rows={6}
                          value={cp.body}
                          onChange={(e) => updateCheckpointField(idx, 'body', e.target.value)}
                          placeholder="Write botanical lesson text here..."
                          className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white font-mono"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Linked Plant Slugs (comma separated)</label>
                        <input
                          type="text"
                          value={(cp.plantSlugs || []).join(', ')}
                          onChange={(e) =>
                            updateCheckpointField(
                              idx,
                              'plantSlugs',
                              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          placeholder="e.g. tulsi, neem"
                          className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Linked Remedy Slugs (comma separated)</label>
                        <input
                          type="text"
                          value={(cp.remedySlugs || []).join(', ')}
                          onChange={(e) =>
                            updateCheckpointField(
                              idx,
                              'remedySlugs',
                              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          placeholder="e.g. tulsi-kadha-herbal-decoction"
                          className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Optional Audio Narration URL</label>
                      <input
                        type="text"
                        value={cp.audioUrl || ''}
                        onChange={(e) => updateCheckpointField(idx, 'audioUrl', e.target.value)}
                        placeholder="Leave blank to use automatic speech synthesis"
                        className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
