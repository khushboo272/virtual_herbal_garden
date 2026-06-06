import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PostProcessingStack } from './PostProcessingStack';

// Mock components from @react-three/postprocessing
vi.mock('@react-three/postprocessing', () => {
  return {
    EffectComposer: ({ children }: any) => <div data-testid="effect-composer">{children}</div>,
    Bloom: () => <div data-testid="bloom" />,
    SMAA: () => <div data-testid="smaa" />,
    N8AO: () => <div data-testid="n8ao" />,
    DepthOfField: () => <div data-testid="dof" />,
    Vignette: () => <div data-testid="vignette" />,
    ChromaticAberration: () => <div data-testid="ca" />
  };
});

describe('PostProcessingStack', () => {
  it('renders all post-processing effects in high quality', () => {
    const { getByTestId } = render(<PostProcessingStack quality="high" />);
    
    expect(getByTestId('effect-composer')).toBeInTheDocument();
    expect(getByTestId('bloom')).toBeInTheDocument();
    expect(getByTestId('smaa')).toBeInTheDocument();
    expect(getByTestId('n8ao')).toBeInTheDocument();
    expect(getByTestId('dof')).toBeInTheDocument();
    expect(getByTestId('vignette')).toBeInTheDocument();
    expect(getByTestId('ca')).toBeInTheDocument();
  });

  it('renders fewer effects in low quality', () => {
    const { getByTestId, queryByTestId } = render(<PostProcessingStack quality="low" />);
    
    expect(getByTestId('effect-composer')).toBeInTheDocument();
    expect(getByTestId('bloom')).toBeInTheDocument();
    expect(getByTestId('vignette')).toBeInTheDocument();
    
    expect(queryByTestId('smaa')).not.toBeInTheDocument();
    expect(queryByTestId('n8ao')).not.toBeInTheDocument();
    expect(queryByTestId('dof')).not.toBeInTheDocument();
    expect(queryByTestId('ca')).not.toBeInTheDocument();
  });
});
