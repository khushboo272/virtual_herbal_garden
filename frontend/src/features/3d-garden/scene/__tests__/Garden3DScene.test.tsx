// ──────────────────────────────────────────────────────────
// scene/__tests__/Garden3DScene.test.tsx — Smoke tests for Garden Scene & Page
// ──────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VirtualGarden3DPage } from '../../pages/VirtualGarden3DPage';
import * as showcaseHook from '../../hooks/useShowcasePlants';
import type { IShowcasePlant } from '../../types';

// Mock canvas 2D context for procedural textures in JSDOM
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: () => ({ data: new Uint8ClampedArray(100) }),
    putImageData: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    bezierCurveTo: vi.fn(),
  })) as any;
}

vi.mock('../../../../components/garden/RealisticGround', () => ({
  RealisticGround: () => <div data-testid="realistic-ground" />,
}));

// Mock Canvas & 3D heavy components for headless JSDOM testing
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => <div data-testid="r3f-canvas">{children}</div>,
  useFrame: vi.fn(),
  extend: vi.fn(),
  useThree: () => ({
    camera: {
      position: {
        x: 0,
        y: 2,
        z: 12,
        set: vi.fn(),
        distanceTo: () => 5,
      },
      lookAt: vi.fn(),
      quaternion: {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
        set: vi.fn(),
      },
    },
    gl: {
      domElement: typeof document !== 'undefined' ? document.createElement('canvas') : ({} as any),
      info: { render: { calls: 12, triangles: 1400 } },
    },
  }),
}));

vi.mock('@react-three/drei', () => ({
  Billboard: ({ children }: any) => <div data-testid="drei-billboard">{children}</div>,
  Text: ({ children }: any) => <span data-testid="drei-text">{children}</span>,
  useGLTF: Object.assign(
    () => ({
      scene: {
        clone: () => ({
          traverse: vi.fn(),
          position: { set: vi.fn() },
          scale: { set: vi.fn() },
          rotation: { set: vi.fn() },
        }),
      },
    }),
    { preload: vi.fn() }
  ),
  Detailed: ({ children }: any) => <div>{children}</div>,
  useProgress: () => ({ active: false, progress: 100, loaded: 1, total: 1 }),
  useTexture: () => ({ wrapS: 0, wrapT: 0, repeat: { set: vi.fn() } }),
  Environment: ({ children }: any) => <div data-testid="drei-env">{children}</div>,
  Lightformer: () => null,
  Sky: () => <div data-testid="drei-sky" />,
  Cloud: () => <div data-testid="drei-cloud" />,
  Stars: () => <div data-testid="drei-stars" />,
  PositionalAudio: () => null,
  PointerLockControls: () => null,
  OrbitControls: () => null,
}));

vi.mock('@react-three/postprocessing', () => ({
  EffectComposer: ({ children }: any) => <div data-testid="effect-composer">{children}</div>,
  Bloom: () => <div data-testid="bloom" />,
  SMAA: () => <div data-testid="smaa" />,
  N8AO: () => <div data-testid="n8ao" />,
  DepthOfField: () => <div data-testid="dof" />,
  Vignette: () => <div data-testid="vignette" />,
  ChromaticAberration: () => <div data-testid="ca" />,
}));

vi.mock('@react-three/rapier', () => ({
  Physics: ({ children }: any) => <div data-testid="rapier-physics">{children}</div>,
  RigidBody: ({ children }: any) => <div data-testid="rapier-rigidbody">{children}</div>,
}));

vi.mock('../../hooks/useShowcasePlants');

const samplePlant: IShowcasePlant = {
  id: 'plant-neem-1',
  slug: 'neem',
  commonName: 'Neem Tree',
  scientificName: 'Azadirachta indica',
  plantType: 'Tree',
  healthCategories: ['skin-care'],
  visual: {
    habit: 'TREE',
    heightM: 4.5,
    spreadM: 3.0,
    foliageColor: '#1b4d3e',
    flowerColor: '#ffffff',
    leafShape: 'PINNATE',
  },
  modelUrl: null,
  lodUrl: null,
  modelVersion: 1,
  modelStatus: 'NONE',
  modelTransform: { scale: 1, rotationY: 0, offsetY: 0, targetHeightM: 4.5 },
};

describe('VirtualGarden3DPage and Garden3DScene Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders friendly empty state when 0 plants exist in catalog', () => {
    vi.mocked(showcaseHook.useShowcasePlants).mockReturnValue({
      plants: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <VirtualGarden3DPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Garden Nursery is Quiet')).toBeInTheDocument();
    expect(
      screen.getByText(/No published medicinal plants are available in the catalog yet/)
    ).toBeInTheDocument();
    expect(screen.getByText('Refresh Catalog')).toBeInTheDocument();
  });

  it('mounts 3D scene and plant instances when N plants are published', () => {
    vi.mocked(showcaseHook.useShowcasePlants).mockReturnValue({
      plants: [samplePlant],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <VirtualGarden3DPage />
      </MemoryRouter>
    );

    // Canvas mounted
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();

    // Empty state should NOT be visible
    expect(screen.queryByText('Garden Nursery is Quiet')).toBeNull();

    // Plant labels rendered in scene
    const textElements = screen.getAllByTestId('drei-text');
    const hasNeem = textElements.some((el) => el.textContent?.includes('Neem Tree'));
    expect(hasNeem).toBe(true);
  });
});
