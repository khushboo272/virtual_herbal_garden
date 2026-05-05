// ──────────────────────────────────────────────────────────
// QuizActivity — Multiple-choice quiz with pass/fail logic
// ──────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Trophy, RotateCcw, ArrowRight } from 'lucide-react';
import type { QuizQuestion } from '../types';

type QuizState = 'idle' | 'question' | 'feedback' | 'results';

interface QuizActivityProps {
  questions: QuizQuestion[];
  onPass: () => void;
  isAlreadyCompleted: boolean;
}

export function QuizActivity({ questions, onPass, isAlreadyCompleted }: QuizActivityProps) {
  const [state, setState] = useState<QuizState>('idle');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const passThreshold = Math.ceil(questions.length * 0.6); // 60%
  const question = questions[currentQ];

  const handleStart = useCallback(() => {
    setState('question');
    setCurrentQ(0);
    setSelectedOpt(null);
    setScore(0);
    setAnswers([]);
  }, []);

  const handleSelectOption = useCallback(
    (optIndex: number) => {
      if (state !== 'question' || selectedOpt !== null) return;
      setSelectedOpt(optIndex);
      const isCorrect = optIndex === question.ans;
      if (isCorrect) setScore((s) => s + 1);
      setAnswers((a) => [...a, isCorrect]);
      setState('feedback');
    },
    [state, selectedOpt, question],
  );

  const handleNext = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelectedOpt(null);
      setState('question');
    } else {
      setState('results');
      // Auto-pass if score meets threshold
      const finalScore = score; // score is already updated
      if (finalScore >= passThreshold) {
        onPass();
      }
    }
  }, [currentQ, questions.length, score, passThreshold, onPass]);

  const handleRetake = useCallback(() => {
    handleStart();
  }, [handleStart]);

  const passed = score >= passThreshold;

  return (
    <div className="vt-quiz">
      <AnimatePresence mode="wait">
        {/* IDLE state — Show Start button */}
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="vt-quiz__idle"
          >
            {isAlreadyCompleted && (
              <div className="vt-quiz__already-done">
                <CheckCircle2 size={18} />
                <span>You&apos;ve already completed this activity!</span>
              </div>
            )}
            <button
              className="vt-btn vt-btn--primary"
              onClick={handleStart}
              aria-label="Start quiz activity"
            >
              {isAlreadyCompleted ? 'Retake Quiz' : 'Start Activity'}
            </button>
          </motion.div>
        )}

        {/* QUESTION / FEEDBACK state */}
        {(state === 'question' || state === 'feedback') && question && (
          <motion.div
            key={`q-${currentQ}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="vt-quiz__question-container"
          >
            {/* Progress */}
            <div className="vt-quiz__progress">
              <span>
                Question {currentQ + 1} of {questions.length}
              </span>
              <div className="vt-quiz__progress-bar">
                <div
                  className="vt-quiz__progress-fill"
                  style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <h4 className="vt-quiz__question">{question.q}</h4>

            {/* Options */}
            <div className="vt-quiz__options">
              {question.opts.map((opt, idx) => {
                let optClass = 'vt-quiz__opt';
                if (state === 'feedback') {
                  if (idx === question.ans) optClass += ' vt-quiz__opt--correct';
                  else if (idx === selectedOpt && idx !== question.ans)
                    optClass += ' vt-quiz__opt--wrong';
                }
                if (selectedOpt === idx) optClass += ' vt-quiz__opt--selected';

                return (
                  <button
                    key={idx}
                    className={optClass}
                    onClick={() => handleSelectOption(idx)}
                    disabled={state === 'feedback'}
                    aria-label={`Option ${idx + 1}: ${opt}`}
                  >
                    <span className="vt-quiz__opt-letter">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                    {state === 'feedback' && idx === question.ans && (
                      <CheckCircle2 size={16} className="vt-quiz__opt-icon--correct" />
                    )}
                    {state === 'feedback' && idx === selectedOpt && idx !== question.ans && (
                      <XCircle size={16} className="vt-quiz__opt-icon--wrong" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {state === 'feedback' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`vt-quiz__feedback ${
                  selectedOpt === question.ans ? 'vt-quiz__feedback--ok' : 'vt-quiz__feedback--bad'
                }`}
              >
                <p>{question.exp}</p>
              </motion.div>
            )}

            {/* Next button */}
            {state === 'feedback' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="vt-quiz__next"
              >
                <button
                  className="vt-btn vt-btn--primary"
                  onClick={handleNext}
                  aria-label={currentQ < questions.length - 1 ? 'Next question' : 'See results'}
                >
                  {currentQ < questions.length - 1 ? (
                    <>
                      Next Question
                      <ArrowRight size={14} />
                    </>
                  ) : (
                    'See Results'
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* RESULTS state */}
        {state === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="vt-quiz__results"
          >
            <div className={`vt-quiz__results-card ${passed ? 'vt-quiz__results--pass' : 'vt-quiz__results--fail'}`}>
              {passed ? (
                <>
                  <Trophy size={40} className="vt-quiz__results-icon--pass" />
                  <h4 className="vt-quiz__results-title">Excellent! 🎉</h4>
                  <p className="vt-quiz__results-text">
                    You scored {score} out of {questions.length} — Checkpoint completed!
                  </p>
                </>
              ) : (
                <>
                  <XCircle size={40} className="vt-quiz__results-icon--fail" />
                  <h4 className="vt-quiz__results-title">Almost there!</h4>
                  <p className="vt-quiz__results-text">
                    You scored {score} out of {questions.length}. You need at least {passThreshold} correct to pass.
                  </p>
                </>
              )}

              {/* Answer summary */}
              <div className="vt-quiz__answer-summary">
                {answers.map((correct, idx) => (
                  <span
                    key={idx}
                    className={`vt-quiz__answer-dot ${correct ? 'vt-quiz__answer-dot--correct' : 'vt-quiz__answer-dot--wrong'}`}
                    aria-label={`Question ${idx + 1}: ${correct ? 'Correct' : 'Incorrect'}`}
                  >
                    {idx + 1}
                  </span>
                ))}
              </div>

              {!passed && (
                <button
                  className="vt-btn vt-btn--primary"
                  onClick={handleRetake}
                  aria-label="Retake quiz"
                >
                  <RotateCcw size={14} />
                  Retake Quiz
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
