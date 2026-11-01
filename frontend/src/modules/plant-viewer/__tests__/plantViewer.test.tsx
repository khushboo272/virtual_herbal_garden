import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as THREE from 'three';
import { resolvePlantParts, getPartAnchorPoint } from '../utils/resolveParts';
import { normalizeViewerModel } from '../utils/normalizeViewerModel';
import { PlantInfoPanel } from '../components/PlantInfoPanel';
import { ModelErrorBoundary } from '../components/ModelErrorBoundary';
import { calculateBboxFraming } from '../utils/cameraFraming';
import { PlantViewerToolbar } from '../components/PlantViewerToolbar';
import { PlantLabels } from '../components/PlantLabels';
import { PlantViewerModal } from '../components/PlantViewerModal';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'USER', name: 'Tester' },
    hasMinRole: () => false,
  }),
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="mock-r3f-canvas" />,
  useThree: () => ({ camera: { position: { set: vi.fn() }, lookAt: vi.fn() }, gl: { domElement: {} } }),
  useFrame: vi.fn(),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  ContactShadows: () => null,
  useProgress: () => ({ progress: 100, active: false }),
  Html: ({ children }: any) => <div>{children}</div>,
  useGLTF: () => ({ scene: new THREE.Group() }),
}));

afterEach(() => {
  cleanup();
});

describe('Plant 3D Viewer Module — TDD Suite', () => {
  describe('Part-to-Mesh Resolution (resolvePlantParts)', () => {
    it('resolves named meshes in a 3D scene according to naming conventions', () => {
      const root = new THREE.Group();
      const stemMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.1));
      stemMesh.name = 'part_stem_main';
      stemMesh.position.set(0, 0.5, 0);

      const leafMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5));
      leafMesh.name = 'foliage_leaves_cluster';
      leafMesh.position.set(0, 1.2, 0);

      const rootMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4));
      rootMesh.name = 'botanical_roots';
      rootMesh.position.set(0, -0.2, 0);

      root.add(stemMesh, leafMesh, rootMesh);

      // Plant only uses leaves and roots, NOT stem
      const partsUsed = ['leaves', 'roots'];
      const resolved = resolvePlantParts(root, partsUsed);

      expect(resolved).toHaveLength(2);
      expect(resolved.map((p) => p.part)).toEqual(['leaves', 'roots']);

      const leafPart = resolved.find((p) => p.part === 'leaves');
      expect(leafPart?.hasRealMesh).toBe(true);
      expect(leafPart?.meshName).toBe('foliage_leaves_cluster');

      const stemPart = resolved.find((p) => p.part === 'stem');
      expect(stemPart).toBeUndefined(); // stem was not in partsUsed!
    });

    it('falls back to procedural anchor points when no named mesh matches', () => {
      const emptyScene = new THREE.Group();
      const genericMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1));
      genericMesh.name = 'Mesh_001';
      emptyScene.add(genericMesh);

      const partsUsed = ['leaves', 'bark', 'seeds'];
      const resolved = resolvePlantParts(emptyScene, partsUsed);

      expect(resolved).toHaveLength(3);
      const leaves = resolved.find((p) => p.part === 'leaves');
      expect(leaves?.hasRealMesh).toBe(false);
      // In a box spanning -1 to +1 (height 2), 80% mark from base (-1 + 1.6) is 0.6
      expect(leaves?.position[1]).toBeCloseTo(0.6, 1);
    });

    it('distributes multiple anatomical fallback anchors radially and vertically to prevent overlap', () => {
      const scene = new THREE.Group();
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5));
      mesh.name = 'unnamed_generic_mesh';
      scene.add(mesh);

      // Tulsi parts: leaves, flowers, seeds
      const partsUsed = ['leaves', 'flowers', 'seeds'];
      const resolved = resolvePlantParts(scene, partsUsed);

      expect(resolved).toHaveLength(3);

      // Verify no two anchors are co-located (minimum Euclidean distance in 3D >= 0.05m)
      for (let i = 0; i < resolved.length; i++) {
        for (let j = i + 1; j < resolved.length; j++) {
          const p1 = new THREE.Vector3(...resolved[i].position);
          const p2 = new THREE.Vector3(...resolved[j].position);
          const dist = p1.distanceTo(p2);
          expect(dist).toBeGreaterThanOrEqual(0.08); // Must have at least 8cm 3D separation
        }
      }

      // Verify angular and radial distribution exists (x or z offsets differ significantly)
      const xs = resolved.map((p) => p.position[0]);
      const zs = resolved.map((p) => p.position[2]);
      const xRange = Math.max(...xs) - Math.min(...xs);
      const zRange = Math.max(...zs) - Math.min(...zs);
      expect(xRange + zRange).toBeGreaterThan(0.1);
    });
  });

  describe('3D Model Normalization (normalizeViewerModel)', () => {
    it('centers the model at local origin y=0 and scales to fit target height', () => {
      const scene = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2));
      box.position.set(5, 10, 5); // Uncentered
      scene.add(box);

      const targetHeightM = 1.5;
      const result = normalizeViewerModel(scene, targetHeightM);

      expect(result.scale).toBeCloseTo(1.5 / 4, 2);
      expect(result.boundingBox.height).toBeCloseTo(1.5, 1);
      
      // Check that the transformed bounding box has its base exactly at world y=0
      const finalBox = new THREE.Box3().setFromObject(scene);
      expect(finalBox.min.y).toBeCloseTo(0, 2);
      expect(finalBox.max.y).toBeCloseTo(1.5, 2);
    });
  });

  describe('Data Mapping & Information Panel (PlantInfoPanel)', () => {
    const mockPlant: any = {
      _id: 'plant_123',
      commonName: 'Japanese Maple',
      scientificName: 'Acer palmatum',
      slug: 'japanese-maple',
      family: 'Sapindaceae',
      description: 'Deciduous ornamental tree with medicinal bark and leaves.',
      partsUsed: ['leaves', 'bark'], // ONLY leaves and bark!
      toxicityLevel: 'NONE',
      medicinalUses: [
        'Astringent decoction from bark for skin cooling',
        'Leaf infusion for eye washes',
      ],
      regionNative: ['East Asia'],
      growingConditions: {
        sunlight: 'Full Sun',
        water: 'Moderate',
      },
      images: [
        { url: 'https://example.com/maple.jpg', alt: 'Maple', isPrimary: true },
      ],
      model3dUrl: null,
      modelUrl: null,
    };

    it('maps scientificName to Botanical Name correctly and avoids duplicate naming', () => {
      render(
        <MemoryRouter>
          <PlantInfoPanel
            plant={mockPlant}
            selectedPart={null}
            onSelectPart={() => {}}
            activeTab="3d"
            onTabChange={() => {}}
          />
        </MemoryRouter>
      );

      // Common Name
      expect(screen.getByText('Japanese Maple')).toBeInTheDocument();
      // Botanical Name must be Acer palmatum, NOT Japanese Maple!
      expect(screen.getByText('Acer palmatum')).toBeInTheDocument();
      // Toxicity badge
      expect(screen.getByText('Non-Toxic')).toBeInTheDocument();
    });

    it('renders parts used strictly from plant data and avoids hard-coded templates', () => {
      render(
        <MemoryRouter>
          <PlantInfoPanel
            plant={mockPlant}
            selectedPart={null}
            onSelectPart={() => {}}
            activeTab="3d"
            onTabChange={() => {}}
          />
        </MemoryRouter>
      );

      // Should display real parts: leaves, bark
      expect(screen.getByRole('button', { name: /leaves/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bark/i })).toBeInTheDocument();

      // Must NOT show fake hard-coded parts like seeds or roots
      expect(screen.queryByRole('button', { name: /seeds/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /roots/i })).not.toBeInTheDocument();
    });

    it('displays part-specific traditional uses when a part is selected', () => {
      render(
        <MemoryRouter>
          <PlantInfoPanel
            plant={mockPlant}
            selectedPart="leaves"
            onSelectPart={() => {}}
            activeTab="3d"
            onTabChange={() => {}}
          />
        </MemoryRouter>
      );

      expect(screen.getByText(/leaves — traditional applications/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Leaf infusion for eye washes/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Canvas Rendering (PlantViewerCanvas)', () => {
    it('initializes and renders PlantViewerCanvas without throwing useMemo ReferenceError', async () => {
      const { PlantViewerCanvas } = await import('../components/PlantViewerCanvas');
      const mockControls: any = {
        zoom: 50,
        rotation: 0,
        autoRotate: false,
        autoRotateSpeed: 1,
        showLabels: true,
        isolatedPart: null,
        wireframe: false,
        showGroundGrid: true,
        showScaleReference: false,
        lightingPreset: 'garden',
        backgroundPreset: 'gradient',
      };

      const mockPlant: any = {
        _id: 'plant_canvas_test',
        slug: 'japanese-maple',
        commonName: 'Japanese Maple',
        scientificName: 'Acer palmatum',
        partsUsed: ['leaves'],
      };

      expect(() => {
        render(
          <PlantViewerCanvas
            plant={mockPlant}
            controlsState={mockControls}
            onControlsChange={() => {}}
            selectedPart={null}
            onSelectPart={() => {}}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Model Error Boundary (ModelErrorBoundary)', () => {
    it('catches GLTF loading/parsing errors and renders procedural fallback without crashing', () => {
      // Suppress console.error in React during boundary test
      const originalError = console.error;
      console.error = vi.fn();

      const BombComponent = () => {
        throw new Error('THREE.GLTFLoader: JSON content not found.');
      };

      const onError = vi.fn();

      render(
        <ModelErrorBoundary
          fallback={<div data-testid="procedural-fallback">Procedural Fallback Model</div>}
          onError={onError}
        >
          <BombComponent />
        </ModelErrorBoundary>
      );

      expect(screen.getByTestId('procedural-fallback')).toBeInTheDocument();
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('THREE.GLTFLoader: JSON content not found.') })
      );

      console.error = originalError;
    });
  });

  describe('Camera Framing & Bounding Box Fitting (calculateBboxFraming)', () => {
    it('computes camera distance and target so the plant occupies 60-70% of canvas height', () => {
      // Create a bounding box representing Tulsi (height: 0.5m, spread: 0.4m, centered at origin base y=0)
      const box = new THREE.Box3(
        new THREE.Vector3(-0.2, 0, -0.2),
        new THREE.Vector3(0.2, 0.5, 0.2)
      );

      const framing = calculateBboxFraming(box, 45, 0.65);

      expect(framing.plantHeightM).toBeCloseTo(0.5, 2);
      expect(framing.plantSpreadM).toBeCloseTo(0.4, 2);
      // Target must be centered in Y at plant midpoint
      expect(framing.target[0]).toBeCloseTo(0, 2);
      expect(framing.target[1]).toBeCloseTo(0.25, 2);
      expect(framing.target[2]).toBeCloseTo(0, 2);

      // Camera distance should frame 0.5m height to fill ~65% of 45-deg FOV (around 0.93m, not 2.6m)
      expect(framing.distance).toBeGreaterThan(0.7);
      expect(framing.distance).toBeLessThan(1.2);
      expect(framing.cameraPosition[2]).toBeCloseTo(framing.distance, 1);
    });
  });

  describe('Canvas-First Floating Toolbar (PlantViewerToolbar)', () => {
    it('renders compact 40px icon toolbar and triggers callbacks', () => {
      const mockState: any = {
        zoom: 50,
        autoRotate: false,
        showLabels: true,
        labelMode: 'all',
        wireframe: false,
        showGroundGrid: true,
        showScaleReference: false,
        lightingPreset: 'garden',
        backgroundPreset: 'gradient',
      };

      const onReset = vi.fn();
      const onTakeScreenshot = vi.fn();
      const onChange = vi.fn();

      render(
        <PlantViewerToolbar
          state={mockState}
          onChange={onChange}
          onRotateStep={vi.fn()}
          onApplyPreset={vi.fn()}
          onResetView={onReset}
          onTakeScreenshot={onTakeScreenshot}
          isFullscreen={false}
          onToggleFullscreen={vi.fn()}
        />
      );

      // Verify thin floating toolbar buttons
      expect(screen.getByTitle(/Reset View/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Auto-rotate/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Screenshot/i)).toBeInTheDocument();

      fireEvent.click(screen.getByTitle(/Reset View/i));
      expect(onReset).toHaveBeenCalled();
    });
  });

  describe('Anatomical Pin Dot Markers & Leader Lines (PlantLabels)', () => {
    it('renders compact pin dot markers with leader lines and clamped styling', () => {
      const mockAnchors: any[] = [
        {
          part: 'leaves',
          label: 'Leaves',
          position: [0, 0.4, 0.15],
          hasRealMesh: false,
        },
        {
          part: 'seeds',
          label: 'Seeds',
          position: [0.15, 0.35, -0.15],
          hasRealMesh: false,
        },
      ];

      const onSelect = vi.fn();
      render(
        <PlantLabels
          anchors={mockAnchors}
          selectedPart={null}
          onSelectPart={onSelect}
          visible={true}
        />
      );

      // Verify compact pin elements with pin-dot class or data-testid
      const pins = screen.getAllByTestId('plant-pin-marker');
      expect(pins).toHaveLength(2);

      // Verify leader line elements are rendered
      const leaderLines = screen.getAllByTestId('plant-pin-leader-line');
      expect(leaderLines).toHaveLength(2);

      // Verify label buttons exist and trigger selection
      const leafBtn = screen.getByRole('button', { name: /Leaves/i });
      expect(leafBtn).toBeInTheDocument();
      fireEvent.click(leafBtn);
      expect(onSelect).toHaveBeenCalledWith('leaves');
    });
  });

  describe('Canvas-First Immersive Layout & Collapsible Drawer (PlantViewerModal)', () => {
    it('renders full-bleed canvas and allows collapsing the info drawer to maximize 3D view', () => {
      const mockPlant: any = {
        _id: 'plant_123',
        slug: 'tulsi',
        commonName: 'Holy Basil (Tulsi)',
        scientificName: 'Ocimum tenuiflorum',
        family: 'Lamiaceae',
        partsUsed: ['leaves', 'seeds'],
        medicinalUses: ['Respiratory health'],
        toxicityLevel: 'NONE',
        images: [],
      };

      render(
        <MemoryRouter>
          <PlantViewerModal
            isOpen={true}
            onClose={vi.fn()}
            plant={mockPlant}
          />
        </MemoryRouter>
      );

      // Verify canvas container is full-bleed
      const canvasContainer = screen.getByTestId('plant-viewer-canvas-container');
      expect(canvasContainer).toBeInTheDocument();
      expect(canvasContainer.className).toContain('inset-0');

      // Verify floating toolbar is present
      expect(screen.getByLabelText(/3D Viewer Controls/i)).toBeInTheDocument();

      // Verify collapsible info drawer toggle button
      const closeBtn = screen.getByTestId('drawer-close-btn');
      expect(closeBtn).toBeInTheDocument();

      // Drawer is initially open
      const drawer = screen.getByTestId('plant-info-drawer');
      expect(drawer.className).not.toContain('translate-x-full');

      // Toggle drawer closed to maximize canvas
      fireEvent.click(closeBtn);
      expect(drawer.className).toContain('translate-x-full');

      // Toggle drawer back open
      const openBtn = screen.getByTestId('drawer-open-btn');
      expect(openBtn).toBeInTheDocument();
      fireEvent.click(openBtn);
      expect(drawer.className).not.toContain('translate-x-full');
    });
  });
});
