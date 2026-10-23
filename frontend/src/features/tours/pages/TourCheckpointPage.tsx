import { useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useTour } from '../hooks/useTour';
import { useTourProgress } from '../hooks/useTourProgress';
import { AudioNarrationPlayer } from '../components/AudioNarrationPlayer';
import { QuizSection } from '../components/QuizSection';
import { TourEducationalBanner } from '../components/TourStates';

export function TourCheckpointPage() {
  const { slug, key } = useParams<{ slug: string; key: string }>();
  const navigate = useNavigate();

  const isPreview = window.location.search.includes('preview=1');
  const { tour, isLoading: isTourLoading } = useTour(slug || '', isPreview);

  const checkpoints = useMemo(() => {
    return (tour?.checkpoints || []).slice().sort((a, b) => a.order - b.order);
  }, [tour?.checkpoints]);

  const {
    isCompleted,
    isUnlocked,
    markComplete,
    submitQuiz,
    isAuthenticated,
  } = useTourProgress(slug || '', checkpoints, tour?.sequential ?? true);

  const checkpointIndex = checkpoints.findIndex((c) => c.key === key);
  const checkpoint = checkpoints[checkpointIndex];

  useDocumentTitle(
    checkpoint && tour ? `${checkpoint.title} | ${tour.title}` : 'Tour Lesson | Virtual Herbal Garden'
  );

  // Deep-link protection: redirect locked checkpoints to the next unlocked one.
  // Use a ref to track whether we've already redirected for this key so the
  // effect fires at most once per checkpoint, avoiding a flicker loop caused by
  // isUnlocked/isCompleted being recreated on every progress state update.
  const redirectedForKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!checkpoint || checkpoints.length === 0) return;
    // Already redirected for this checkpoint key — skip.
    if (redirectedForKeyRef.current === checkpoint.key) return;

    if (!isUnlocked(checkpoint.order)) {
      redirectedForKeyRef.current = checkpoint.key;
      // Find the first unlocked incomplete checkpoint
      const nextAvailable = checkpoints.find((c) => !isCompleted(c.key)) || checkpoints[0];
      navigate(`/virtual-tour/${slug}/${nextAvailable.key}?locked=1`, { replace: true });
    }
  }, [checkpoint, checkpoints, isUnlocked, isCompleted, slug, navigate]);

  if (isTourLoading || !tour || !checkpoint) {
    return (
      <div className="min-h-screen bg-green-50/30 py-12 px-4 sm:px-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded-md mb-6" />
        <div className="h-10 bg-gray-200 rounded-2xl w-3/4 mb-4" />
        <div className="h-64 bg-gray-200 rounded-3xl mb-8" />
      </div>
    );
  }

  const prevCheckpoint = checkpointIndex > 0 ? checkpoints[checkpointIndex - 1] : null;
  const nextCheckpoint = checkpointIndex < checkpoints.length - 1 ? checkpoints[checkpointIndex + 1] : null;
  const isCurrentCompleted = isCompleted(checkpoint.key);

  const handleManualComplete = async () => {
    await markComplete(checkpoint.key);
  };

  const handleQuizSubmit = async (answers: number[]) => {
    const res = await submitQuiz(checkpoint.key, answers);
    return res;
  };

  const hasQuiz = Boolean(checkpoint.quiz && checkpoint.quiz.questions && checkpoint.quiz.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/40 via-white to-green-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to={`/virtual-tour/${tour.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-800 hover:text-green-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {tour.title}
          </Link>

          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Checkpoint {checkpointIndex + 1} of {checkpoints.length}
          </span>
        </div>

        {/* Educational Disclaimer */}
        <TourEducationalBanner />

        {/* Lesson Header Card */}
        <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 text-xs font-semibold text-emerald-800 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100/70 border border-emerald-200">
              Checkpoint {checkpoint.order}
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              {checkpoint.durationMinutes || 3} min read
            </span>
            {isCurrentCompleted && (
              <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            {checkpoint.title}
          </h1>

          {checkpoint.summary && (
            <p className="text-base sm:text-lg text-emerald-900/80 font-medium leading-relaxed border-l-4 border-emerald-500 pl-4 py-1 mb-6 bg-emerald-50/30 rounded-r-xl">
              {checkpoint.summary}
            </p>
          )}

          {/* Audio / Speech Narration Player */}
          <AudioNarrationPlayer
            audioUrl={checkpoint.audioUrl}
            textToSpeak={checkpoint.body || checkpoint.summary}
            title={checkpoint.title}
          />

          {/* Markdown Body */}
          <div className="prose prose-green max-w-none text-gray-700 text-sm sm:text-base leading-relaxed mb-8">
            <ReactMarkdown>{checkpoint.body}</ReactMarkdown>
          </div>

          {/* Key Takeaways Callout */}
          {checkpoint.keyTakeaways && checkpoint.keyTakeaways.length > 0 && (
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 mb-8">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Key Takeaways
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                {checkpoint.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Featured Plants & Remedies Rows */}
          {((checkpoint.plantSlugs && checkpoint.plantSlugs.length > 0) ||
            (checkpoint.remedySlugs && checkpoint.remedySlugs.length > 0)) && (
            <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-4">
              {checkpoint.plantSlugs?.map((pSlug) => (
                <Link
                  key={pSlug}
                  to={`/plant/${pSlug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200"
                >
                  🌿 Explore Plant: {pSlug.replace(/-/g, ' ')}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              ))}

              {checkpoint.remedySlugs?.map((rSlug) => (
                <Link
                  key={rSlug}
                  to={`/remedies/${rSlug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors border border-amber-200"
                >
                  🍵 View Remedy: {rSlug.replace(/-/g, ' ')}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Checkpoint Quiz OR Manual Completion Button */}
        {hasQuiz ? (
          <QuizSection
            questions={checkpoint.quiz!.questions}
            passScore={checkpoint.quiz!.passScore}
            isAuthenticated={isAuthenticated}
            onSubmit={handleQuizSubmit}
            isCompleted={isCurrentCompleted}
          />
        ) : (
          <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-6 sm:p-8 flex items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-base font-bold text-gray-900">Finish Reading Lesson</h3>
              <p className="text-xs text-gray-500">
                Mark this checkpoint complete to unlock subsequent tour checkpoints.
              </p>
            </div>
            {!isCurrentCompleted ? (
              <button
                onClick={handleManualComplete}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Complete
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </div>
            )}
          </div>
        )}

        {/* Previous / Next Checkpoint Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 mt-8 pb-12">
          {prevCheckpoint ? (
            <Link
              to={`/virtual-tour/${tour.slug}/${prevCheckpoint.key}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous Checkpoint
            </Link>
          ) : (
            <div />
          )}

          {nextCheckpoint ? (
            isUnlocked(nextCheckpoint.order) ? (
              <Link
                to={`/virtual-tour/${tour.slug}/${nextCheckpoint.key}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs"
              >
                Next Checkpoint
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed">
                Complete this step to advance
              </span>
            )
          ) : (
            <Link
              to={`/virtual-tour/${tour.slug}/complete`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-green-700 hover:bg-green-800 transition-colors shadow-xs"
            >
              View Tour Summary
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
