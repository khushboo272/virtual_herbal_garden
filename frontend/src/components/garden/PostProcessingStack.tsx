import { EffectComposer, Bloom, SMAA, N8AO, DepthOfField, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

interface PostProcessingStackProps {
  quality?: 'high' | 'low';
}

export function PostProcessingStack({ quality = 'high' }: PostProcessingStackProps) {
  if (quality === 'low') {
    return (
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.9} intensity={0.2} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={2} intensity={1} />
      <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.9} intensity={0.4} />
      <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
      <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.002, 0.002] as any} />
      <SMAA />
    </EffectComposer>
  );
}
