import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export const BANNED_SAFETY_PHRASES = [
  'cures',
  'cure',
  'guaranteed',
  '100% effective',
  'miracle',
  'miracle cure',
  'no side effects',
  'completely safe',
  'instant relief',
  'clinically proven to cure',
];

export function checkContentSafety(texts: (string | undefined | null)[]): string[] {
  const detected: string[] = [];
  const combined = texts.filter(Boolean).join(' ').toLowerCase();

  for (const phrase of BANNED_SAFETY_PHRASES) {
    // Regex for word boundary where possible
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(combined)) {
      detected.push(phrase);
    }
  }

  return detected;
}

interface MedicinalSafetyWarningProps {
  detectedPhrases: string[];
  isSubmitting?: boolean;
}

export function MedicinalSafetyWarning({
  detectedPhrases,
  isSubmitting,
}: MedicinalSafetyWarningProps) {
  if (detectedPhrases.length === 0) return null;

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-rose-900 text-sm">
            Medicinal Content Safety Restriction
          </h4>
          <p className="text-xs text-rose-700 leading-relaxed">
            Botanical entries must not make unverified curative or absolute claims.
            The following restricted terms were detected:{' '}
            <span className="font-semibold text-rose-950">
              {detectedPhrases.map((p) => `"${p}"`).join(', ')}
            </span>
            .
          </p>
          <p className="text-xs text-rose-600 font-medium">
            {isSubmitting
              ? 'Submission is blocked until these claims are rephrased with traditional/educational context.'
              : 'Please rephrase or remove these terms before submitting for review.'}
          </p>
        </div>
      </div>
    </div>
  );
}
