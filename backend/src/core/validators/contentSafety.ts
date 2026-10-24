/**
 * Medicinal Content Safety Validator
 * Blocks unverified, exaggerated, or dangerous medical claims:
 * "cures", "guaranteed", "100% effective", "miracle", "no side effects", etc.
 */

export const BANNED_CLAIM_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bcures?\b/i, label: 'cures / cure' },
  { pattern: /\bguaranteed?\b/i, label: 'guaranteed / guarantee' },
  { pattern: /\b100%\s*(?:effective|safe|natural|cure)\b/i, label: '100% effective / 100% cure' },
  { pattern: /\bmiracle(?:s|\s+cure)?\b/i, label: 'miracle' },
  { pattern: /\bno\s+side\s+effects?\b/i, label: 'no side effects' },
  { pattern: /\bzero\s+side\s+effects?\b/i, label: 'zero side effects' },
  { pattern: /\bpermanent\s+cure\b/i, label: 'permanent cure' },
  { pattern: /\binstant\s+cure\b/i, label: 'instant cure' },
  { pattern: /\bcompletely\s+cures?\b/i, label: 'completely cures' },
];

export interface ContentSafetyResult {
  isValid: boolean;
  violations: string[];
}

/**
 * Checks a single text string against banned medical claim patterns.
 */
export function checkContentSafety(text: string): ContentSafetyResult {
  if (!text || typeof text !== 'string') {
    return { isValid: true, violations: [] };
  }

  const violations: string[] = [];
  for (const { pattern, label } of BANNED_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      violations.push(`Unverified medicinal claim detected: "${label}". Use traditional context or educational terms instead.`);
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Recursively scans an object for string fields to validate content safety.
 */
export function validateObjectContentSafety(obj: unknown, fieldsToCheck?: string[]): ContentSafetyResult {
  const violations: string[] = [];

  function scan(val: unknown, currentKey?: string) {
    if (!val) return;
    if (typeof val === 'string') {
      if (!fieldsToCheck || (currentKey && fieldsToCheck.includes(currentKey))) {
        const res = checkContentSafety(val);
        if (!res.isValid) {
          violations.push(...res.violations);
        }
      }
    } else if (Array.isArray(val)) {
      for (const item of val) {
        scan(item, currentKey);
      }
    } else if (typeof val === 'object') {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        // Skip metadata fields like IDs, URLs, numbers
        if (['_id', 'id', 'createdBy', 'owner', 'uploadedBy', 'slug', 'color'].includes(k)) continue;
        scan(v, k);
      }
    }
  }

  scan(obj);

  // Deduplicate violations
  const uniqueViolations = Array.from(new Set(violations));
  return {
    isValid: uniqueViolations.length === 0,
    violations: uniqueViolations,
  };
}
