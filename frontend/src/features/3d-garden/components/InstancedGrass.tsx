// ──────────────────────────────────────────────────────────
// components/InstancedGrass.tsx — Masked Living Meadow Grass
// Density governed by quality tier; masked out from paths, plaza, pond, and beds.
// ──────────────────────────────────────────────────────────
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GARDEN_CONFIG } from '../gardenConfig';
import { getGroundY, getTerrainSurfaceType } from '../utils/terrainGenerator';
import { createSeededRandom } from '../utils/leafCardGenerator';

interface InstancedGrassProps {
  density: number;
  reducedMotion?: boolean;
}

export function InstancedGrass({ density, reducedMotion = false }: InstancedGrassProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Single blade of grass: 3 vertices (1 triangle)
  const bladeGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -0.04, 0, 0,
       0.04, 0, 0,
       0.0,  0.45, 0.05
    ]);
    const uvs = new Float32Array([
      0, 0,
      1, 0,
      0.5, 1
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geom.setIndex([0, 1, 2]);
    geom.computeVertexNormals();
    return geom;
  }, []);

  const { count, matrices, colors } = useMemo(() => {
    if (density <= 0) {
      return { count: 0, matrices: new Float32Array(0), colors: new Float32Array(0) };
    }

    const rng = createSeededRandom('meadow-grass-seed-42');
    const dummy = new THREE.Object3D();
    const validMatrices: THREE.Matrix4[] = [];
    const validColors: THREE.Color[] = [];

    const baseColorA = new THREE.Color('#2d631e');
    const baseColorB = new THREE.Color('#46832b');
    const baseColorC = new THREE.Color('#589e36');

    let attempts = 0;
    const maxAttempts = density * 2.8;

    while (validMatrices.length < density && attempts < maxAttempts) {
      attempts++;
      const angle = rng() * Math.PI * 2;
      const radius = 9.5 + rng() * 36; // Between plaza and perimeter
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Mask out non-grass surfaces
      const surface = getTerrainSurfaceType(x, z);
      if (surface !== 'GRASS') continue;

      const y = getGroundY(x, z);
      const scaleY = 0.6 + rng() * 0.7;
      const scaleXZ = 0.7 + rng() * 0.5;
      const rotY = rng() * Math.PI * 2;
      const leanX = (rng() - 0.5) * 0.25;

      dummy.position.set(x, y, z);
      dummy.rotation.set(leanX, rotY, 0);
      dummy.scale.set(scaleXZ, scaleY, scaleXZ);
      dummy.updateMatrix();
      validMatrices.push(dummy.matrix.clone());

      const colorMix = rng();
      const col = new THREE.Color();
      if (colorMix < 0.45) {
        col.copy(baseColorA);
      } else if (colorMix < 0.8) {
        col.copy(baseColorB);
      } else {
        col.copy(baseColorC);
      }
      validColors.push(col);
    }

    const mArray = new Float32Array(validMatrices.length * 16);
    const cArray = new Float32Array(validMatrices.length * 3);

    for (let i = 0; i < validMatrices.length; i++) {
      validMatrices[i].toArray(mArray, i * 16);
      cArray[i * 3] = validColors[i].r;
      cArray[i * 3 + 1] = validColors[i].g;
      cArray[i * 3 + 2] = validColors[i].b;
    }

    return { count: validMatrices.length, matrices: mArray, colors: cArray };
  }, [density]);

  useEffect(() => {
    if (meshRef.current?.instanceMatrix && count > 0) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [count, matrices, colors]);

  // Gentle wind sway
  useFrame(({ clock }) => {
    if (meshRef.current && !reducedMotion) {
      const t = clock.getElapsedTime() * GARDEN_CONFIG.procedural.windSwaySpeed;
      meshRef.current.rotation.z = Math.sin(t * 1.2) * 0.012;
      meshRef.current.rotation.x = Math.cos(t * 0.9) * 0.008;
    }
  });

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[bladeGeometry, undefined, count]}
      receiveShadow
    >
      <meshStandardMaterial
        side={THREE.DoubleSide}
        roughness={0.7}
        metalness={0.02}
      />
    </instancedMesh>
  );
}
