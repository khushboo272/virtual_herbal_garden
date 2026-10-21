import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Share2, Leaf, MapPin, Star, Sparkles,
  AlertCircle, Lock, BookOpen, ChevronRight, Loader2
} from 'lucide-react';
import { PlantImage } from '../components/PlantImage';
import { usePlant, usePlantReviews } from '../hooks/usePlant';
import { useFavorite, useShare } from '../hooks/useFavorite';
import { useAuth } from '../../../contexts/AuthContext';
import { PlantViewer3DModal } from '../../../app/components/PlantViewer3DModal';
import { getRelated } from '../api/libraryApi';
import type { LibraryPlant, PlantReview } from '../types/library.types';

// ── Star rating input ──────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
          aria-label={`Rate ${n} stars`}
        >
          <Star
            className={`w-6 h-6 ${
              n <= (hovered || value)
                ? 'fill-amber-400 stroke-amber-400'
                : 'stroke-green-300 fill-transparent'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Review card ────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: PlantReview }) {
  const userName =
    typeof review.user === 'object' ? review.user.displayName : 'Anonymous';
  return (
    <div className="bg-white rounded-xl border border-green-100 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-medium text-green-900">{userName}</p>
          <div className="flex gap-0.5 mt-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`w-3.5 h-3.5 ${
                  n <= review.rating ? 'fill-amber-400 stroke-amber-400' : 'stroke-green-200 fill-transparent'
                }`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-green-400 flex-shrink-0">
          {new Date(review.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
        </span>
      </div>
      {review.title && <p className="text-sm font-semibold text-green-800 mb-1">{review.title}</p>}
      {review.body && <p className="text-sm text-green-600 leading-relaxed">{review.body}</p>}
    </div>
  );
}

// ── Related plant card ─────────────────────────────────────────────────────

function RelatedPlantCard({ plant }: { plant: LibraryPlant }) {
  const image = plant.images?.find((img) => img.isPrimary)?.url ?? plant.images?.[0]?.url;
  return (
    <Link
      to={`/plant/${plant.slug}`}
      className="group flex-shrink-0 w-36 sm:w-40"
    >
      <div className="rounded-xl overflow-hidden border-2 border-green-100 group-hover:border-green-300 transition-colors">
        <PlantImage src={image} alt={plant.commonName} heightClass="h-28" className="w-full" />
        <div className="p-2">
          <p className="text-xs font-semibold text-green-900 line-clamp-1">{plant.commonName}</p>
          <p className="text-xs italic text-green-400 line-clamp-1">{plant.scientificName}</p>
        </div>
      </div>
    </Link>
  );
}

// ── Main PlantDetailPage ───────────────────────────────────────────────────

export function PlantDetailPage() {
  const { id: slugOrId = '' } = useParams<{ id: string }>();
  const { plant, isLoading, error } = usePlant(slugOrId);
  const { isFavorite, toggle: toggleFavorite } = useFavorite(plant?._id ?? '');
  const { share, copied } = useShare();
  const { isAuthenticated } = useAuth();
  const [show3D, setShow3D] = useState(false);
  const [activeTab, setActiveTab] = useState<'uses' | 'cultivation' | 'precautions'>('uses');
  const [related, setRelated] = useState<LibraryPlant[]>([]);
  const {
    reviews,
    total: reviewTotal,
    isLoading: reviewsLoading,
    isSubmitting,
    submitReview,
  } = usePlantReviews(plant?._id ?? '');
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', body: '' });
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Load related plants
  useEffect(() => {
    if (!plant?._id) return;
    getRelated(plant._id)
      .then(setRelated)
      .catch(() => setRelated([]));
  }, [plant?._id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          <p className="text-green-600 text-sm">Loading plant details…</p>
        </div>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50/30">
        <div className="text-center">
          <p className="text-2xl mb-3">🌿</p>
          <h2 className="text-xl font-semibold text-green-900 mb-2">Plant not found</h2>
          <p className="text-green-600 mb-4">{error || 'This plant could not be loaded.'}</p>
          <Link
            to="/library"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage =
    plant.images?.find((img) => img.isPrimary)?.url ?? plant.images?.[0]?.url;
  const cultivationText = plant.growingConditions
    ? [
        plant.growingConditions.soil && `Soil: ${plant.growingConditions.soil}.`,
        plant.growingConditions.water && `Water: ${plant.growingConditions.water}.`,
        plant.growingConditions.sunlight && `Sunlight: ${plant.growingConditions.sunlight}.`,
        plant.growingConditions.climate && `Climate: ${plant.growingConditions.climate}.`,
        plant.growingConditions.hardinessZone && `Hardiness Zone: ${plant.growingConditions.hardinessZone}.`,
      ]
        .filter(Boolean)
        .join(' ')
    : 'Cultivation information not available.';

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewError('');
    if (reviewForm.rating === 0) {
      setReviewError('Please select a star rating.');
      return;
    }
    try {
      await submitReview(reviewForm);
      setReviewSuccess(true);
      setReviewForm({ rating: 0, title: '', body: '' });
    } catch (err: unknown) {
      const e = err as { message?: string };
      if (e?.message?.includes('409') || e?.message?.includes('already')) {
        setReviewError('You have already reviewed this plant.');
      } else {
        setReviewError('Failed to submit review. Please try again.');
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/60 via-emerald-50/30 to-teal-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Back button */}
        <Link
          to="/library"
          className="inline-flex items-center gap-2 text-green-700 hover:text-green-900 mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Library
        </Link>

        {/* ── Hero section ──────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-8 mb-10">

          {/* Image gallery */}
          <div>
            <div className="rounded-2xl overflow-hidden border-4 border-white shadow-2xl relative bg-green-100">
              <PlantImage
                src={primaryImage}
                alt={plant.commonName}
                heightClass="h-[440px]"
                className="w-full"
              />
              {/* 3D button overlay */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
                <button
                  type="button"
                  id="plant-open-3d"
                  onClick={() => setShow3D(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-xl transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Open 3D Interactive View
                </button>
              </div>
              {/* Animated hotspot markers */}
              <div className="absolute top-16 right-16 w-7 h-7 bg-green-500 rounded-full animate-pulse border-4 border-white shadow-lg" />
              <div className="absolute bottom-28 left-12 w-7 h-7 bg-emerald-400 rounded-full animate-pulse border-4 border-white shadow-lg" />
            </div>

            {/* Thumbnail row (shows other images if present) */}
            {plant.images && plant.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {plant.images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-colors ${
                      idx === 0 ? 'border-green-500' : 'border-green-100 hover:border-green-300'
                    }`}
                  >
                    <img src={img.url} alt={img.alt || plant.commonName} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Plant info */}
          <div className="space-y-5">
            {/* Category + title + actions */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {plant.tags?.[0] && (
                    <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-3 border border-green-200">
                      {plant.tags[0]}
                    </span>
                  )}
                  <h1 className="text-4xl font-bold text-green-900 mb-1">{plant.commonName}</h1>
                  <p className="text-lg italic text-green-500">{plant.scientificName}</p>
                  {plant.ayurvedicNames?.length > 0 && (
                    <p className="text-sm text-green-500 mt-1">
                      Also known as: {plant.ayurvedicNames.join(', ')}
                    </p>
                  )}
                </div>

                {/* Favorite + Share */}
                <div className="flex gap-2 flex-shrink-0">
                  {isAuthenticated ? (
                    <>
                      <button
                        type="button"
                        id="plant-favorite-btn"
                        onClick={toggleFavorite}
                        className={`p-2.5 rounded-xl border-2 transition-all ${
                          isFavorite
                            ? 'bg-rose-50 border-rose-300 text-rose-500'
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-400 stroke-rose-400' : ''}`} />
                      </button>
                      <button
                        type="button"
                        id="plant-share-btn"
                        onClick={() => share(plant.commonName, plant.shortDescription ?? undefined)}
                        className="p-2.5 rounded-xl border-2 border-green-200 text-green-600 hover:bg-green-50 relative transition-all"
                        aria-label="Share this plant"
                      >
                        <Share2 className="w-5 h-5" />
                        {copied && (
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs bg-green-800 text-white px-2 py-0.5 rounded whitespace-nowrap">
                            Copied!
                          </span>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="relative group">
                      <button
                        type="button"
                        disabled
                        className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-300 cursor-not-allowed"
                        aria-label="Sign in to save favorites"
                      >
                        <Lock className="w-5 h-5" />
                      </button>
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Sign in to save
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick info cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border-2 border-green-100 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-500">Native Region</p>
                  <p className="text-sm font-medium text-green-900 truncate">
                    {plant.regionNative?.[0] ?? '—'}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border-2 border-green-100 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-500">Plant Type</p>
                  <p className="text-sm font-medium text-green-900 capitalize">
                    {plant.plantType ?? plant.family ?? 'Herb'}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border-2 border-green-100 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-green-500">Rating</p>
                  <p className="text-sm font-medium text-green-900">
                    {plant.avgRating > 0 ? `${plant.avgRating.toFixed(1)} / 5` : 'No reviews yet'}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border-2 border-green-100 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-500">Family</p>
                  <p className="text-sm font-medium text-green-900 truncate">{plant.family}</p>
                </div>
              </div>
            </div>

            {/* Short description */}
            {plant.shortDescription && (
              <p className="text-green-700 leading-relaxed">{plant.shortDescription}</p>
            )}

            {/* Tabs */}
            <div className="border-2 border-green-100 rounded-2xl overflow-hidden">
              {/* Tab headers */}
              <div className="flex border-b-2 border-green-100 bg-green-50">
                {(['uses', 'cultivation', 'precautions'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    id={`plant-tab-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'bg-white text-green-700 border-b-2 -mb-px border-green-600'
                        : 'text-green-500 hover:text-green-700'
                    }`}
                  >
                    {tab === 'uses' ? 'Medicinal Uses' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-5 bg-white">
                {activeTab === 'uses' && (
                  <div className="space-y-4">
                    <p className="text-sm text-green-700 leading-relaxed">{plant.description}</p>
                    <ul className="space-y-2">
                      {plant.medicinalUses.map((use) => (
                        <li key={use} className="flex items-start gap-2 text-sm text-green-700">
                          <Leaf className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {use}
                        </li>
                      ))}
                    </ul>
                    {plant.partsUsed?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-800 mb-2">Parts Used</p>
                        <div className="flex flex-wrap gap-1.5">
                          {plant.partsUsed.map((part) => (
                            <span
                              key={part}
                              className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full capitalize"
                            >
                              {part}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'cultivation' && (
                  <p className="text-sm text-green-700 leading-relaxed">{cultivationText}</p>
                )}

                {activeTab === 'precautions' && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800 mb-1">Safety Information</p>
                      <ul className="space-y-1">
                        <li className="text-sm text-amber-700">
                          Toxicity level: <strong>{plant.toxicityLevel}</strong>
                        </li>
                        <li className="text-sm text-amber-700">
                          Always consult a qualified healthcare provider before medicinal use.
                        </li>
                        {plant.toxicityLevel !== 'NONE' && (
                          <li className="text-sm text-amber-700">
                            Not recommended for pregnant or breastfeeding women without professional advice.
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Related Plants ────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-green-900">Related Plants</h2>
              <Link
                to="/library"
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 transition-colors"
              >
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {related.map((r) => (
                <RelatedPlantCard key={r._id} plant={r} />
              ))}
            </div>
          </section>
        )}

        {/* ── Reviews ──────────────────────────────────────────────── */}
        <section id="plant-reviews">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-green-900">Reviews</h2>
            <span className="text-sm text-green-500">
              ({reviewTotal} {reviewTotal === 1 ? 'review' : 'reviews'})
            </span>
            {plant.avgRating > 0 && (
              <span className="flex items-center gap-0.5 text-sm text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                {plant.avgRating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Review form */}
          {isAuthenticated && !reviewSuccess && (
            <form onSubmit={handleSubmitReview} className="bg-white rounded-2xl border-2 border-green-100 p-5 mb-6">
              <h3 className="text-base font-semibold text-green-900 mb-4">Write a Review</h3>
              <div className="mb-3">
                <p className="text-xs text-green-600 mb-1.5">Your Rating *</p>
                <StarRating value={reviewForm.rating} onChange={(n) => setReviewForm((f) => ({ ...f, rating: n }))} />
              </div>
              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Review title (optional)"
                maxLength={200}
                className="w-full mb-3 px-3 py-2 rounded-lg border-2 border-green-100 text-sm text-green-900 placeholder:text-green-300 focus:outline-none focus:border-green-400 transition-colors"
              />
              <textarea
                value={reviewForm.body}
                onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Share your experience with this plant…"
                maxLength={2000}
                rows={3}
                className="w-full mb-3 px-3 py-2 rounded-lg border-2 border-green-100 text-sm text-green-900 placeholder:text-green-300 focus:outline-none focus:border-green-400 transition-colors resize-none"
              />
              {reviewError && <p className="text-xs text-red-500 mb-2">{reviewError}</p>}
              <button
                type="submit"
                id="plant-submit-review"
                disabled={isSubmitting}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit Review
              </button>
            </form>
          )}

          {reviewSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-6">
              ✅ Thank you! Your review has been submitted.
            </div>
          )}

          {/* Reviews list */}
          {reviewsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-green-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-green-500 py-6 text-center">
              No reviews yet. Be the first to share your experience!
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <ReviewCard key={r._id} review={r} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 3D Modal */}
      <PlantViewer3DModal
        isOpen={show3D}
        onClose={() => setShow3D(false)}
        plantName={plant.commonName}
        botanicalName={plant.scientificName}
      />
    </div>
  );
}
