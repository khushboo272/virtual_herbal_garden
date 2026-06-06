import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HUD } from './HUD';
import { BrowserRouter } from 'react-router-dom';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('HUD', () => {
  it('renders time indicator', () => {
    const { getByText, getByTestId } = render(
      <BrowserRouter>
        <HUD
          isLocked={false}
          showMinimap={true}
          onToggleMinimap={vi.fn()}
          plantCount={5}
          audioEnabled={true}
          onToggleAudio={vi.fn()}
          cameraMode="fps"
          onToggleCameraMode={vi.fn()}
        />
      </BrowserRouter>
    );

    // The time indicator should be rendered
    expect(getByTestId('time-indicator')).toBeInTheDocument();

    // The fullscreen toggle should be rendered
    expect(getByTestId('fullscreen-toggle')).toBeInTheDocument();
  });
});
