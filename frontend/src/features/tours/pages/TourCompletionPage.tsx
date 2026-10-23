import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Star,
  RotateCcw,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useTour } from '../hooks/useTour';
import { useTourProgress } from '../hooks/useTourProgress';
import { listTours } from '../api/toursApi';
import { TourCard } from '../components/TourCard';
import type { Tour } from '../types/tour.types';

export function TourCompletionPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { tour, isLoading } = useTour(slug || '');
  const { rate, restart, isAuthenticated, progress } = useTourProgress(slug || '', tour?.checkpoints);

  useDocumentTitle(tour?.title ? `Completed: ${tour.title} | Virtual Herbal Garden` : 'Tour Complete');

  const [ratingVal, setRatingVal] = useState<number>(progress.rating || 0);
  const [commentText, setCommentText] = useState<string>(progress.ratingComment || '');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSaved, setRatingSaved] = useState(Boolean(progress.rating));

  const [recommendedTours, setRecommendedTours] = useState<Tour[]>([]);

  // Fetch recommended tours in the same health category
  useEffect(() => {
    if (!tour) return;
    listTours({ health: tour.healthCategory, limit: 4 })
      .then((res) => {
        // Exclude current tour
        setRecommendedTours(res.tours.filter((t) => t.slug !== tour.slug).slice(0, 3));
      })
      .catch(() => {});
  }, [tour]);

  const handleRatingSubmit = async () => {
    if (ratingVal < 1 || isSubmittingRating) return;
    setIsSubmittingRating(true);
    try {
      await rate(ratingVal, commentText);
      setRatingSaved(true);
    } catch {
      // handled in hook
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleRestart = async () => {
    await restart();
    navigate(`/virtual-tour/${slug}`);
  };

  if (isLoading || !tour) {
    return (
      <div className="min-h-screen bg-green-50/30 py-12 px-4 max-w-4xl mx-auto animate-pulse">
        <div className="h-64 bg-gray-200 rounded-3xl mb-8" />
      </div>
    );
  }

  const checkpoints = tour.checkpoints || [];
  const plantsCovered = Array.from(new Set(checkpoints.flatMap((c) => c.plantSlugs || [])));
  const remediesCovered = Array.from(new Set(checkpoints.flatMap((c) => c.remedySlugs || [])));

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-green-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Celebration Trophy Card */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-md p-8 sm:p-12 text-center mb-10 relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-6 shadow-xs">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Tour Completed
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Congratulations!
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
            You have successfully completed all checkpoints in{' '}
            <span className="font-bold text-emerald-950">"{tour.title}"</span>. Your botanical knowledge has expanded!
          </p>

          {/* Highlights summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 mb-8">
            <div className="p-2">
              <div className="text-2xl font-extrabold text-emerald-900">{checkpoints.length}</div>
              <div className="text-xs text-emerald-700 font-medium">Checkpoints Passed</div>
            </div>
            <div className="p-2">
              <div className="text-2xl font-extrabold text-emerald-900">{plantsCovered.length}</div>
              <div className="text-xs text-emerald-700 font-medium">Herbs Explored</div>
            </div>
            <div className="p-2 col-span-2 sm:col-span-1">
              <div className="text-2xl font-extrabold text-emerald-900">{tour.estimatedMinutes || 15}m</div>
              <div className="text-xs text-emerald-700 font-medium">Time Invested</div>
            </div>
          </div>

          {/* Rating Section */}
          {isAuthenticated ? (
            <div className="max-w-md mx-auto p-6 bg-gray-50/70 rounded-2xl border border-gray-100 mb-8">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Rate this guided tour</h3>
              <p className="text-xs text-gray-500 mb-4">
                Help other herbal enthusiasts choose the best learning pathways.
              </p>

              {/* Star rating buttons */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={ratingSaved}
                    onClick={() => setRatingVal(star)}
                    className="p-1 rounded-lg text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= ratingVal ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {!ratingSaved && ratingVal > 0 && (
                <div className="space-y-3">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Optional: share feedback on this lesson..."
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    disabled={isSubmittingRating}
                    onClick={handleRatingSubmit}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
                  >
                    {isSubmittingRating ? 'Saving...' : 'Submit Rating'}
                  </button>
                </div>
              )}

              {ratingSaved && (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  Rating submitted ({ratingVal} Stars)
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500 mb-8">
              <Link to="/oauth/callback" className="font-semibold text-emerald-700 hover:underline">
                Sign in
              </Link>{' '}
              to save persistent tour achievements and submit reviews.
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/virtual-tour"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs"
            >
              <Compass className="w-4 h-4" />
              Explore All Tours
            </Link>

            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Restart Tour
            </button>
          </div>
        </div>

        {/* What You Mastered (Plants & Remedies) */}
        {(plantsCovered.length > 0 || remediesCovered.length > 0) && (
          <div className="bg-white rounded-3xl border border-green-100 p-6 sm:p-8 mb-12 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What You Covered in This Tour</h2>

            {plantsCovered.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Herbs Mastered:</div>
                <div className="flex flex-wrap gap-2">
                  {plantsCovered.map((p) => (
                    <Link
                      key={p}
                      to={`/plant/${p}`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                      🌿 {p.replace(/-/g, ' ')}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {remediesCovered.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Traditional Preparations:</div>
                <div className="flex flex-wrap gap-2">
                  {remediesCovered.map((r) => (
                    <Link
                      key={r}
                      to={`/remedies/${r}`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors border border-amber-200"
                    >
                      🍵 {r.replace(/-/g, ' ')}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommended Next Tours */}
        {recommendedTours.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Next Pathways</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedTours.map((t) => (
                <TourCard key={t.id || t.slug} tour={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
