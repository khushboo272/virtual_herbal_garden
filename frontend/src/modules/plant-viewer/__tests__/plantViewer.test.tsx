import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as THREE from 'three';
import { resolvePlantParts, getPartAnchorPoint } from '../utils/resolveParts';
import { normalizeViewerModel } from '../utils/normalizeViewerModel';
import { PlantInfoPanel } from '../components/PlantInfoPanel';

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
});
