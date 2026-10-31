// ──────────────────────────────────────────────────────────
// components/GardenTerrain.tsx — Landscaped Terrain with Elevation & Vertex Color Blending
// Displaced heightmap geometry, realistic soil/gravel/grass blending, Rapier physics
// ──────────────────────────────────────────────────────────
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { GARDEN_CONFIG } from '../gardenConfig';
import { getGroundY, getTerrainSurfaceType } from '../utils/terrainGenerator';

interface GardenTerrainProps {
  onPointerMove?: (e: any) => void;
  onClick?: (e: any) => void;
}

function createGroundDetailTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as any);
  }
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Soft base micro-noise
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Granular speckle pattern (soil crumbs, pebble texture)
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.8 + Math.random() * 2.2;
    const brightness = Math.floor(100 + Math.random() * 80);
    ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 24); // Fine tiling across 110m terrain
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function GardenTerrain({ onPointerMove, onClick }: GardenTerrainProps) {
  const { size, resolution } = GARDEN_CONFIG.terrain;

  const detailMap = useMemo(() => createGroundDetailTexture(), []);

  // Construct displaced elevation geometry with vertex colors
  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(size, size, resolution, resolution);
    geom.rotateX(-Math.PI / 2); // Lay flat on XZ plane

    const posAttr = geom.attributes.position;
    const count = posAttr.count;

    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      // Compute exact continuous ground elevation
      const y = getGroundY(x, z);
      posAttr.setY(i, y);

      // Classify terrain surface type for realistic multi-material blending
      const surface = getTerrainSurfaceType(x, z);

      switch (surface) {
        case 'PLAZA':
          // Warm natural flagstone / limestone paver
          color.set('#d8cfc0');
          break;
        case 'PATH':
          // Warm crushed pea gravel / decomposed granite
          color.set('#c4b69d');
          break;
        case 'BED':
          // Rich dark horticultural compost / organic mulch
          color.set('#3a2818');
          break;
        case 'POND':
          // Wet silty sand / river stone bank
          color.set('#6b6557');
          break;
        case 'GRASS':
        default: {
          // Lush living meadow green with slight elevation and slope modulation
          const slopeFactor = Math.min(1.0, Math.max(0.0, y / 2.5));
          const baseGreen = new THREE.Color('#386d26');
          const hillGreen = new THREE.Color('#4c8834');
          color.copy(baseGreen).lerp(hillGreen, slopeFactor);
          break;
        }
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    return geom;
  }, [size, resolution]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      detailMap.dispose();
    };
  }, [geometry, detailMap]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh
        geometry={geometry}
        receiveShadow
        onPointerMove={(e) => {
          if (onPointerMove) {
            e.stopPropagation();
            onPointerMove([e.point.x, e.point.y, e.point.z]);
          }
        }}
        onClick={(e) => {
          if (onClick) {
            e.stopPropagation();
            onClick([e.point.x, e.point.y, e.point.z]);
          }
        }}
      >
        <meshStandardMaterial
          vertexColors
          map={detailMap}
          roughness={0.92}
          metalness={0.02}
          envMapIntensity={0.2}
        />
      </mesh>
    </RigidBody>
  );
}

