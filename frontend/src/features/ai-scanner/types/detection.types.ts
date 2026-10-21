// ── Detection Types for the ai-scanner feature ──

export type DetectionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';

export interface DetectionAlternative {
  commonName: string;
  scientificName: string;
  confidence: number;
}

export interface DetectionTopMatch {
  commonName: string;
  scientificName: string;
  family: string;
  confidence: number;
}

export interface DetectionResult {
  id: string;
  status: DetectionStatus;
  isPlant: boolean | null;
  topMatch: DetectionTopMatch | null;
  description: string | null;
  medicinalUses: string[];
  keyBenefits: string[];
  partsUsed: string[];
  precautions: string[];
  alternatives: DetectionAlternative[];
  imageQualityNote: string | null;
  plantSlug: string | null;
  plantId: string | null;
  imageUrl: string;
  processingTimeMs: number | null;
  createdAt: string;
}
