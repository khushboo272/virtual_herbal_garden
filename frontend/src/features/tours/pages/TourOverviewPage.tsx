import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  BookOpen,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Info,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useTour } from '../hooks/useTour';
import { useTourProgress } from '../hooks/useTourProgress';
import { PlantImage } from '../../library';
import { TourEducationalBanner } from '../components/TourStates';

export function TourOverviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Support preview mode for draft tours
  const isPreview = window.location.search.includes('preview=1');
  const { tour, isLoading, error } = useTour(slug || '', isPreview);

  const checkpoints = useMemo(() => {
    return (tour?.checkpoints || []).slice().sort((a, b) => a.order - b.order);
  }, [tour?.checkpoints]);

  const {
    percent,
    isCompleted,
    isUnlocked,
    restart,
  } = useTourProgress(slug || '', checkpoints, tour?.sequential ?? true);

  useDocumentTitle(tour?.title ? `${tour.title} | Guided Tour` : 'Guided Virtual Tour');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-50/30 py-12 px-4 sm:px-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded-md mb-6" />
        <div className="h-64 bg-gray-200 rounded-3xl mb-8" />
        <div className="h-32 bg-gray-200 rounded-2xl mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-green-50/30 py-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-xs">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tour Not Found</h2>
          <p className="text-gray-600 text-sm mb-6">
            {error || 'The requested tour does not exist or may have been unpublished.'}
          </p>
          <Link
            to="/virtual-tour"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 text-white font-medium text-sm hover:bg-green-800 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Tours
          </Link>
        </div>
      </div>
    );
  }

  // Find next checkpoint to continue
  const nextCheckpoint = checkpoints.find((c) => !isCompleted(c.key)) || checkpoints[0];
  const allCompleted = checkpoints.length > 0 && checkpoints.every((c) => isCompleted(c.key));

  // Extract all plants and remedies covered across checkpoints
  const plantsCovered = Array.from(new Set(checkpoints.flatMap((c) => c.plantSlugs || [])));
  const remediesCovered = Array.from(new Set(checkpoints.flatMap((c) => c.remedySlugs || [])));

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/40 via-white to-green-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb Back Link */}
        <div className="mb-6">
          <Link
            to="/virtual-tour"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-800 hover:text-green-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Guided Tours
          </Link>
        </div>

        {/* Draft Preview Banner */}
        {!tour.isPublished && (
          <div className="bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl mb-6 shadow-sm flex items-center justify-between">
            <span>⚠️ DRAFT PREVIEW MODE — This tour is unpublished and only visible to administrators.</span>
            <span className="bg-amber-600 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Unpublished</span>
          </div>
        )}

        {/* Educational Disclaimer Banner */}
        <TourEducationalBanner />

        {/* Tour Header Card */}
        <div className="bg-white rounded-3xl border border-green-100 shadow-sm overflow-hidden mb-8">
          <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full bg-green-900 overflow-hidden">
            <PlantImage
              src={tour.coverImage || tour.coverImageUrl || ''}
              alt={tour.title}
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                  {tour.level}
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-200">
                  <Clock className="w-3.5 h-3.5" />
                  {tour.estimatedMinutes || tour.estimatedDuration || 10} minutes
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-200">
                  <BookOpen className="w-3.5 h-3.5" />
                  {checkpoints.length} checkpoints
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {tour.title}
              </h1>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-gray-700 text-base leading-relaxed mb-6">
              {tour.summary || tour.description}
            </p>

            {/* Progress Card & Actions */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 mb-1.5">
                  <span>Your Learning Progress</span>
                  <span className="text-emerald-700 font-bold">{percent}%</span>
                </div>
                <div className="h-2.5 w-full bg-emerald-200/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="text-xs text-emerald-800 mt-2">
                  {checkpoints.filter((c) => isCompleted(c.key)).length} of {checkpoints.length} checkpoints completed
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {allCompleted ? (
                  <button
                    onClick={restart}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restart Tour
                  </button>
                ) : (
                  <>
                    {percent > 0 && (
                      <button
                        onClick={restart}
                        title="Restart from beginning"
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/virtual-tour/${tour.slug}/${nextCheckpoint.key}`)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      {percent > 0 ? 'Continue Tour' : 'Start Tour'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Checkpoint Timeline */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Tour Checkpoints & Timeline
          </h2>

          <div className="space-y-4">
            {checkpoints.map((cp, idx) => {
              const completed = isCompleted(cp.key);
              const unlocked = isUnlocked(cp.order);
              const isCurrent = !completed && unlocked;

              return (
                <div
                  key={cp.key}
                  className={`bg-white rounded-2xl border transition-all p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    completed
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isCurrent
                      ? 'border-amber-300 ring-2 ring-amber-100 shadow-sm'
                      : 'border-gray-100 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Number / Status Badge */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        completed
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {completed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : !unlocked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        cp.order
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Checkpoint {idx + 1} • {cp.durationMinutes || 3} min
                        </span>
                        {completed && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Completed
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Current Step
                          </span>
                        )}
                        {!unlocked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Locked
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">
                        {cp.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {cp.summary || 'Detailed lesson on historical medicinal applications and biological properties.'}
                      </p>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="shrink-0 self-end sm:self-center">
                    {unlocked ? (
                      <Link
                        to={`/virtual-tour/${tour.slug}/${cp.key}`}
                        className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                          completed
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : isCurrent
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {completed ? 'Review' : 'Open Lesson'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-400 bg-gray-50 rounded-xl cursor-not-allowed">
                        <Lock className="w-3.5 h-3.5" />
                        Complete previous
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* "What You Will Cover" Section */}
        {(plantsCovered.length > 0 || remediesCovered.length > 0) && (
          <div className="bg-white rounded-3xl border border-green-100 p-6 sm:p-8 mb-12 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-600" />
              What You Will Cover
            </h2>

            {plantsCovered.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Featured Botanical Species:</div>
                <div className="flex flex-wrap gap-2">
                  {plantsCovered.map((slug) => (
                    <Link
                      key={slug}
                      to={`/plant/${slug}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200/60"
                    >
                      🌿 {slug.replace(/-/g, ' ')}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {remediesCovered.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Connected Traditional Remedies:</div>
                <div className="flex flex-wrap gap-2">
                  {remediesCovered.map((slug) => (
                    <Link
                      key={slug}
                      to={`/remedies/${slug}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors border border-amber-200/60"
                    >
                      🍵 {slug.replace(/-/g, ' ')}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
