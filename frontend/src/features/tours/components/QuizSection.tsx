import { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { QuizQuestion, QuizSubmissionResult } from '../types/tour.types';

interface QuizSectionProps {
  questions: QuizQuestion[];
  passScore?: number;
  isAuthenticated: boolean;
  onSubmit: (answers: number[]) => Promise<QuizSubmissionResult>;
  isCompleted?: boolean;
}

export function QuizSection({
  questions,
  passScore = 0.6,
  isAuthenticated,
  onSubmit,
  isCompleted,
}: QuizSectionProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const total = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount === total;

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (quizResult?.passed) return; // Locked once passed unless retried
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!allAnswered || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const answersArray = questions.map((_, i) => selectedAnswers[i]);

    try {
      const res = await onSubmit(answersArray);
      setQuizResult(res);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit quiz answers');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setQuizResult(null);
    setSubmitError(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-6 sm:p-8 mt-8">
      {/* Quiz Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-gray-100 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            Knowledge Checkpoint
          </div>
          <h3 className="text-xl font-bold text-gray-900">Checkpoint Quiz</h3>
          <p className="text-xs text-gray-500">
            Score {Math.round(passScore * 100)}% or higher to complete this checkpoint ({Math.ceil(total * passScore)} of {total} correct required).
          </p>
        </div>

        {isCompleted && !quizResult && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-100 text-green-800 text-xs font-semibold self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4" />
            Checkpoint Passed
          </div>
        )}
      </div>

      {/* Guest Notice */}
      {!isAuthenticated && (
        <div className="mb-6 bg-blue-50 border border-blue-200/80 rounded-2xl p-4 text-blue-900 text-sm flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Log in to save progress:</span> You are currently exploring as a guest. You can review all lesson materials, but must sign in to submit server-scored quizzes and preserve your certified completion records.
            <div className="mt-2">
              <Link
                to="/oauth/callback"
                className="font-semibold text-blue-700 hover:text-blue-900 underline inline-flex items-center gap-1"
              >
                Sign in or create account <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-8">
        {questions.map((q, qIdx) => {
          const selected = selectedAnswers[qIdx];
          const resultItem = quizResult?.results[qIdx];

          return (
            <div key={qIdx} className="space-y-3">
              <div className="text-sm sm:text-base font-semibold text-gray-900 flex gap-2">
                <span className="text-emerald-700 font-bold">{qIdx + 1}.</span>
                <span>{q.prompt}</span>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {q.options.map((opt, optIdx) => {
                  const isOptSelected = selected === optIdx;
                  let optionStateClasses = 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30';

                  if (quizResult) {
                    if (isOptSelected) {
                      optionStateClasses = resultItem?.correct
                        ? 'border-green-500 bg-green-50 text-green-950 font-medium'
                        : 'border-red-400 bg-red-50 text-red-950';
                    } else {
                      optionStateClasses = 'border-gray-100 opacity-60';
                    }
                  } else if (isOptSelected) {
                    optionStateClasses = 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-medium ring-1 ring-emerald-600';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={Boolean(quizResult?.passed) || !isAuthenticated}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`text-left p-3.5 rounded-xl border text-sm transition-all cursor-pointer flex items-center justify-between gap-3 ${optionStateClasses}`}
                    >
                      <span>{opt}</span>
                      {quizResult && isOptSelected && (
                        <span>
                          {resultItem?.correct ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation display after submit */}
              {resultItem && resultItem.explanation && (
                <div
                  className={`p-3 rounded-xl text-xs leading-relaxed ${
                    resultItem.correct ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  <span className="font-semibold">{resultItem.correct ? 'Correct! ' : 'Explanation: '}</span>
                  {resultItem.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submission & Score Summary Banner */}
      {quizResult && (
        <div
          className={`mt-8 p-5 rounded-2xl border text-center ${
            quizResult.passed
              ? 'bg-green-50 border-green-200 text-green-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="text-lg font-bold mb-1">
            {quizResult.passed ? '🎉 Checkpoint Passed!' : 'Needs Review'}
          </div>
          <p className="text-sm mb-4">
            You scored {quizResult.score} of {quizResult.total} (
            {Math.round((quizResult.score / quizResult.total) * 100)}%).{' '}
            {quizResult.passed
              ? 'You have unlocked the next checkpoint.'
              : `A minimum score of ${Math.round(passScore * 100)}% is needed to complete this checkpoint.`}
          </p>

          {!quizResult.passed && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Retry Quiz
            </button>
          )}
        </div>
      )}

      {submitError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {submitError}
        </div>
      )}

      {/* Submit Button */}
      {isAuthenticated && !quizResult?.passed && (
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            disabled={!allAnswered || isSubmitting}
            onClick={handleSubmit}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-xs cursor-pointer ${
              allAnswered && !isSubmitting
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Evaluating...' : 'Submit Answers'}
          </button>
        </div>
      )}
    </div>
  );
}
