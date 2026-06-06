import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAmbientAudio } from './AudioSystem';
import { Howl } from 'howler';

// Mock howler
const { mockFade, mockUnload, mockConstructor } = vi.hoisted(() => ({
  mockFade: vi.fn(),
  mockUnload: vi.fn(),
  mockConstructor: vi.fn(),
}));

vi.mock('howler', () => {
  return {
    Howler: {},
    Howl: class Howl {
      play = vi.fn();
      pause = vi.fn();
      volume = vi.fn();
      unload = mockUnload;
      fade = mockFade;
      pos = vi.fn();
      constructor() {
        mockConstructor();
      }
    }
  };
});

describe('useAmbientAudio (Howler Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes Howl instances for ambient audio on mount when enabled', () => {
    renderHook(() => useAmbientAudio(true));
    expect(mockConstructor).toHaveBeenCalled();
  });

  it('does not initialize Howl when audio is disabled', () => {
    renderHook(() => useAmbientAudio(false, false));
    expect(mockConstructor).not.toHaveBeenCalled();
  });

  it('crossfades to night audio when isNight is true', () => {
    const { rerender } = renderHook(({ isNight }) => useAmbientAudio(true, isNight), {
      initialProps: { isNight: false }
    });
    
    // We expect both birds and night audio to be initialized
    expect(mockConstructor).toHaveBeenCalled();

    rerender({ isNight: true });

    // The fade function should be called
    expect(mockFade).toHaveBeenCalled();
  });
});
