import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Send,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { submitPlantRegistrationRequest } from '../api/libraryApi';
import { toast } from 'sonner';

interface PlantCardSkeletonProps {
  viewMode?: 'grid' | 'list';
}

function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={`bg-gradient-to-r from-green-50 via-green-100 to-green-50 animate-pulse rounded-lg ${className}`}
    />
  );
}

export function PlantCardSkeleton({ viewMode = 'grid' }: PlantCardSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="flex items-start gap-4 bg-white rounded-xl border-2 border-green-50 p-4">
        <Shimmer className="w-24 h-20 flex-shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-3/4" />
          <div className="flex gap-2 pt-1">
            <Shimmer className="h-7 w-20" />
            <Shimmer className="h-7 w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-green-50 overflow-hidden">
      <Shimmer className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
        <div className="flex gap-1.5 pt-1">
          <Shimmer className="h-5 w-16" />
          <Shimmer className="h-5 w-20" />
        </div>
        <div className="flex gap-2 pt-2">
          <Shimmer className="h-9 flex-1" />
          <Shimmer className="h-9 flex-1" />
        </div>
      </div>
    </div>
  );
}

interface LibrarySkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

export function LibrarySkeleton({ count = 12, viewMode = 'grid' }: LibrarySkeletonProps) {
  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
          : 'space-y-4'
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <PlantCardSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  );
}

export interface ScannedPlantInfo {
  commonName: string;
  scientificName?: string;
  family?: string;
  description?: string;
  medicinalUses?: string[];
  keyBenefits?: string[];
  imageUrl?: string;
}

interface EmptyResultsProps {
  query?: string;
  scannedPlant?: ScannedPlantInfo;
  onReset: () => void;
}

export function EmptyResults({ query, scannedPlant, onReset }: EmptyResultsProps) {
  const navigate = useNavigate();

  // If no query was entered, just show simple filter clear
  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🌿</div>
        <h3 className="text-xl font-semibold text-green-900 mb-2">No plants found</h3>
        <p className="text-green-600 mb-6 max-w-xs">
          No plants match the selected filters. Try clearing some filters.
        </p>
        <button
          type="button"
          onClick={onReset}
          id="library-reset-button"
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors shadow-md cursor-pointer"
        >
          Clear all filters
        </button>
      </div>
    );
  }

  // State for plant registration form
  const [commonName, setCommonName] = useState(scannedPlant?.commonName || query);
  const [scientificName, setScientificName] = useState(scannedPlant?.scientificName || '');
  const [family, setFamily] = useState(scannedPlant?.family || '');
  const [description, setDescription] = useState(scannedPlant?.description || '');
  const [medicinalUses, setMedicinalUses] = useState(
    scannedPlant?.medicinalUses?.join(', ') || ''
  );
  const [notes, setNotes] = useState(
    scannedPlant ? 'Identified via AI Scanner' : 'Searched in Virtual Herbal Garden'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    plantName: string;
    message: string;
    redirectPrefill?: {
      motivation: string;
      qualifications: string;
    };
  } | null>(null);

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commonName.trim()) {
      toast.error('Please provide a common name for the plant.');
      return;
    }

    try {
      setIsSubmitting(true);
      const parsedUses = medicinalUses
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);

      const res = await submitPlantRegistrationRequest({
        commonName: commonName.trim(),
        scientificName: scientificName.trim() || undefined,
        family: family.trim() || undefined,
        description: description.trim() || undefined,
        medicinalUses: parsedUses.length > 0 ? parsedUses : undefined,
        imageUrl: scannedPlant?.imageUrl || undefined,
        notes: notes.trim() || undefined,
      });

      const successMsg = res?.message || 'Plant registration request submitted successfully!';
      toast.success(successMsg);
      setSubmittedData({
        plantName: commonName.trim(),
        message: successMsg,
        redirectPrefill: res?.redirect?.prefill,
      });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit plant registration request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedirectToBecomeContributor = () => {
    const motivationPrefill =
      submittedData?.redirectPrefill?.motivation ||
      `I noticed that ${commonName.trim() || query} was not available in the herbal catalog and submitted a registration request. As an herbal researcher, I would like to join as a Botanist to research and document verified medicinal plants.`;

    const qualificationsPrefill =
      submittedData?.redirectPrefill?.qualifications ||
      `Experienced in botanical identification, taxonomy, and traditional herbal remedies including species like ${commonName.trim() || query}.`;

    navigate('/dashboard/become-contributor', {
      state: {
        prefill: {
          motivation: motivationPrefill,
          qualifications: qualificationsPrefill,
        },
        plantName: submittedData?.plantName || commonName.trim() || query,
      },
    });
  };

  // ── Render Submitted Confirmation View ────────────────────────────────────
  if (submittedData) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-300 rounded-3xl shadow-xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Request Dispatched to Team
          </span>
          <h3 className="text-2xl font-bold text-emerald-950 mb-2">
            Thank you for contributing!
          </h3>
          <p className="text-emerald-800 text-sm leading-relaxed max-w-lg mx-auto">
            {submittedData.message ||
              `Your registration request for "${submittedData.plantName}" has been submitted to all Admins, Super Admins, and Botanists for botanical verification.`}
          </p>
        </div>

        <div className="p-5 bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-2xl text-left space-y-2">
          <h4 className="font-semibold text-emerald-900 text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Want to directly catalog this and other herbal species?
          </h4>
          <p className="text-emerald-700 text-xs leading-relaxed">
            Apply to become an official Botanist Contributor! We have pre-filled your application details with your research background so you can submit in one click.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            id="become-botanist-prefilled-btn"
            onClick={handleRedirectToBecomeContributor}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Become a Botanist (Pre-filled Application)
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto px-5 py-3 border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            Clear Filters & Browse
          </button>
        </div>
      </div>
    );
  }

  // ── Render Missing Plant Alert & Registration Form ────────────────────────
  return (
    <div className="max-w-3xl mx-auto my-8 space-y-6">
      {/* Missing Species Notice */}
      <div className="p-6 bg-amber-50/80 border border-amber-200 rounded-2xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-full mb-1">
              Plant Not Found in Database
            </span>
            <h3 className="text-xl font-bold text-amber-950">
              "{query}" is not in the Virtual Herbal Garden catalog
            </h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              We have automatically alerted all <strong>Administrators, Super Administrators, and Botanists</strong> with this inquiry so our research team can investigate and document this medicinal plant.
            </p>
          </div>
        </div>
      </div>

      {/* Registration Application Card */}
      <div className="bg-white border-2 border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h4 className="text-xl font-bold text-green-950 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Apply for New Plant Registration
            </h4>
            <p className="text-sm text-green-700 mt-1">
              Have details or observed this plant? Submit this quick registration request to fast-track its addition into the database.
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-gray-500 hover:text-green-700 underline self-start sm:self-auto cursor-pointer"
          >
            Clear search & reset
          </button>
        </div>

        <form onSubmit={handleSubmitRegistration} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Common Name *
              </label>
              <input
                type="text"
                required
                value={commonName}
                onChange={(e) => setCommonName(e.target.value)}
                placeholder="e.g. Japanese Maple, Ashwagandha"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Scientific Name (Botanical)
              </label>
              <input
                type="text"
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                placeholder="e.g. Acer palmatum"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Botanical Family
              </label>
              <input
                type="text"
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                placeholder="e.g. Sapindaceae"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Traditional / Medicinal Uses
              </label>
              <input
                type="text"
                value={medicinalUses}
                onChange={(e) => setMedicinalUses(e.target.value)}
                placeholder="e.g. Cooling decoctions, astringent bark"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Description & Characteristics
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Visual habit, leaves, flowers, or native habitat..."
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Notes & Source
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Identified via AI Scanner / field sighting"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              Notification will be dispatched to all Botanists and Admins to review and catalog.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              id="submit-plant-registration-btn"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Apply for New Plant Registration
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface LibraryErrorProps {
  message: string;
  onRetry: () => void;
}

export function LibraryError({ message, onRetry }: LibraryErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold text-green-900 mb-2">Something went wrong</h3>
      <p className="text-green-600 mb-6 max-w-xs">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        id="library-retry-button"
        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors shadow-md"
      >
        Try again
      </button>
    </div>
  );
}
