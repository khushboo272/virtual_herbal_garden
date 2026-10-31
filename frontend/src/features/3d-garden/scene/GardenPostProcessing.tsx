// ──────────────────────────────────────────────────────────
// scene/GardenPostProcessing.tsx — High-Fidelity Clean Post-Processing
// No ChromaticAberration, no global blur, SMAA, subtle bloom, optional N8AO
// ──────────────────────────────────────────────────────────
import { EffectComposer, Bloom, SMAA, N8AO, DepthOfField, Vignette } from '@react-three/postprocessing';
import { GARDEN_CONFIG, type QualityTierConfig } from '../gardenConfig';

interface GardenPostProcessingProps {
  quality: QualityTierConfig;
  isPhotoMode?: boolean;
  enabled?: boolean;
}

export function GardenPostProcessing({
  quality,
  isPhotoMode = false,
  enabled = true,
}: GardenPostProcessingProps) {
  // Respect feature flag / disabling
  if (!enabled) return null;

  // On LOW tier, disable postprocessing entirely for maximum performance
  if (quality.name === 'LOW') {
    return null;
  }

  const { bloomThreshold, bloomIntensity, n8aoRadius, n8aoIntensity, vignetteDarkness, vignetteOffset } =
    GARDEN_CONFIG.postProcessing;

  return (
    <EffectComposer multisampling={0}>
      {/* Ambient Occlusion (Only on HIGH & ULTRA) */}
      {quality.n8ao && (
        <N8AO aoRadius={n8aoRadius} intensity={n8aoIntensity} />
      )}

      {/* Subtle bloom for lanterns and water glint (threshold >= 0.9, intensity <= 0.35) */}
      {quality.bloom && (
        <Bloom
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={0.8}
          intensity={bloomIntensity}
        />
      )}

      {/* Depth of field ONLY in Photo Mode */}
      {isPhotoMode && (
        <DepthOfField
          focusDistance={0.03}
          focalLength={GARDEN_CONFIG.postProcessing.photoModeFocalLength}
          bokehScale={GARDEN_CONFIG.postProcessing.photoModeBokehScale}
        />
      )}

      {/* Subtle, non-intrusive vignette (darkness <= 0.2 per hard rule) */}
      <Vignette eskil={false} offset={vignetteOffset} darkness={vignetteDarkness} />

      {/* Anti-aliasing pass */}
      {quality.smaa && <SMAA />}
    </EffectComposer>
  );
}

