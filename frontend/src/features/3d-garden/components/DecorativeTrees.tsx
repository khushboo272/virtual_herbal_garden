// ──────────────────────────────────────────────────────────
// components/DecorativeTrees.tsx — Lush Landscaped Tree Species
// Replaces dodecahedron blobs with 4 realistic botanical tree species:
// Willow, Flowering Cherry, Pine/Cedar, Spreading Oak.
// ──────────────────────────────────────────────────────────
import { useMemo } from 'react';
import * as THREE from 'three';
import { getGroundY, getTerrainSurfaceType } from '../utils/terrainGenerator';
import { createSeededRandom, getProceduralLeafTexture } from '../utils/leafCardGenerator';

interface DecorativeTreesProps {
  count: number;
}

type TreeSpecies = 'WILLOW' | 'CHERRY' | 'PINE' | 'OAK';

interface PlacedTreeData {
  x: number;
  y: number;
  z: number;
  species: TreeSpecies;
  scale: number;
  rotationY: number;
}

export function DecorativeTrees({ count }: DecorativeTreesProps) {
  const trees = useMemo(() => {
    if (count <= 0) return [];

    const rng = createSeededRandom('decorative-trees-seed-99');
    const list: PlacedTreeData[] = [];
    const speciesList: TreeSpecies[] = ['OAK', 'CHERRY', 'PINE', 'WILLOW'];

    let attempts = 0;
    while (list.length < count && attempts < count * 4) {
      attempts++;
      const angle = rng() * Math.PI * 2;
      const radius = 22 + rng() * 24; // Along outer garden berms and grove edges
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Don't place trees in plaza, paths, or pond
      const surface = getTerrainSurfaceType(x, z);
      if (surface !== 'GRASS') continue;

      const y = getGroundY(x, z);
      const species = speciesList[Math.floor(rng() * speciesList.length)];
      const scale = 0.85 + rng() * 0.45;
      const rotationY = rng() * Math.PI * 2;

      list.push({ x, y, z, species, scale, rotationY });
    }
    return list;
  }, [count]);

  return (
    <group>
      {trees.map((tree, idx) => (
        <TreeInstance key={`dec-tree-${idx}`} data={tree} seed={`tree-${idx}`} />
      ))}
    </group>
  );
}

function TreeInstance({ data, seed }: { data: PlacedTreeData; seed: string }) {
  const { x, y, z, species, scale, rotationY } = data;

  const { trunkGeo, trunkColor, canopyElements } = useMemo(() => {
    const rng = createSeededRandom(seed);
    const canopy: { pos: [number, number, number]; size: [number, number, number]; col: string }[] = [];

    let trunk: THREE.BufferGeometry;
    let tColor = '#451a03';

    switch (species) {
      case 'CHERRY': {
        // Slender branched flowering tree
        tColor = '#3e2723';
        trunk = new THREE.CylinderGeometry(0.12, 0.26, 3.8, 8);
        trunk.translate(0, 1.9, 0);

        // Pink/white flowering blossom canopies
        for (let i = 0; i < 7; i++) {
          const ang = (i / 7) * Math.PI * 2 + rng() * 0.4;
          const r = 1.2 + rng() * 0.8;
          const cy = 2.8 + rng() * 1.2;
          canopy.push({
            pos: [Math.cos(ang) * r, cy, Math.sin(ang) * r],
            size: [1.8 + rng() * 0.6, 1.4 + rng() * 0.4, 1.8 + rng() * 0.6],
            col: rng() > 0.4 ? '#fbcfe8' : '#f472b6',
          });
        }
        break;
      }
      case 'PINE': {
        // Tiered coniferous cedar/pine
        tColor = '#292524';
        trunk = new THREE.CylinderGeometry(0.1, 0.35, 5.5, 8);
        trunk.translate(0, 2.75, 0);

        // Horizontal tiered needle cones
        for (let tier = 0; tier < 4; tier++) {
          const tierY = 2.2 + tier * 1.1;
          const tierW = 3.6 * (1 - tier * 0.22);
          canopy.push({
            pos: [0, tierY, 0],
            size: [tierW, 0.85, tierW],
            col: tier % 2 === 0 ? '#14532d' : '#166534',
          });
        }
        break;
      }
      case 'WILLOW': {
        // Graceful weeping tree
        tColor = '#44403c';
        trunk = new THREE.CylinderGeometry(0.18, 0.4, 4.2, 8);
        trunk.translate(0, 2.1, 0);

        // Drooping canopy domes
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2 + rng() * 0.3;
          const r = 1.6 + rng() * 0.6;
          canopy.push({
            pos: [Math.cos(ang) * r, 3.2, Math.sin(ang) * r],
            size: [1.6, 2.4, 1.6],
            col: '#65a30d',
          });
        }
        break;
      }
      case 'OAK':
      default: {
        // Sturdy broad spreading oak
        tColor = '#3b2f2f';
        trunk = new THREE.CylinderGeometry(0.24, 0.55, 4.8, 8);
        trunk.translate(0, 2.4, 0);

        // Dense overlapping canopy lobes
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + rng() * 0.5;
          const r = 1.5 + rng() * 1.2;
          const cy = 3.5 + rng() * 1.5;
          canopy.push({
            pos: [Math.cos(ang) * r, cy, Math.sin(ang) * r],
            size: [2.6, 2.2, 2.6],
            col: rng() > 0.5 ? '#15803d' : '#166534',
          });
        }
        break;
      }
    }

    return { trunkGeo: trunk, trunkColor: tColor, canopyElements: canopy };
  }, [species, seed]);

  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      {/* Tapered Trunk with branch hints */}
      <mesh geometry={trunkGeo} castShadow receiveShadow>
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>

      {/* Layered Foliage Clusters with Vertex Shading */}
      {canopyElements.map((el, idx) => (
        <mesh key={`canopy-${idx}`} position={el.pos} castShadow receiveShadow>
          <sphereGeometry args={[el.size[0] / 2, 8, 7]} />
          <meshStandardMaterial
            color={el.col}
            roughness={0.75}
            metalness={0.02}
          />
        </mesh>
      ))}
    </group>
  );
}

