// ──────────────────────────────────────────────────────────
// components/ProceduralPlant.tsx — Deterministic Procedural Botanical Generator
// InstancedMesh leaf cards, 7 botanical habits, canvas textures, wind sway
// ──────────────────────────────────────────────────────────
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GARDEN_CONFIG } from '../gardenConfig';
import type { IShowcasePlant } from '../types';
import { createSeededRandom, getProceduralLeafTexture } from '../utils/leafCardGenerator';

interface ProceduralPlantProps {
  plant: IShowcasePlant;
  position: [number, number, number];
  rotationY?: number;
}

export function ProceduralPlant({ plant, position, rotationY = 0 }: ProceduralPlantProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leavesRef = useRef<THREE.InstancedMesh>(null);
  const flowersRef = useRef<THREE.InstancedMesh>(null);

  const visual = plant.visual;
  const habit = visual?.habit || 'HERB';
  const leafShape = visual?.leafShape || 'OVATE';
  const foliageColor = visual?.foliageColor || GARDEN_CONFIG.procedural.defaultColors.foliage;
  const flowerColor = visual?.flowerColor || GARDEN_CONFIG.procedural.defaultColors.flower;
  const heightM = Math.max(0.2, visual?.heightM || 0.6);
  const spreadM = Math.max(0.2, visual?.spreadM || 0.5);

  const instanceCount = GARDEN_CONFIG.procedural.instancesPerHabit[habit] || 16;

  // Leaf alpha texture from canvas
  const leafTexture = useMemo(() => {
    return getProceduralLeafTexture(leafShape, foliageColor);
  }, [leafShape, foliageColor]);

  // Seeded PRNG for stable, species-unique morphology
  const rng = useMemo(() => createSeededRandom(plant.id), [plant.id]);

  // Leaf matrices and colors
  const { leafMatrices, flowerMatrices, trunkGeometry, trellisElements } = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const flMatrices: THREE.Matrix4[] = [];

    const dummy = new THREE.Object3D();
    const tempRng = createSeededRandom(plant.id);

    const cardW = (spreadM / 3.5) * (0.8 + tempRng() * 0.4);
    const cardH = (heightM / 2.8) * (0.8 + tempRng() * 0.4);

    let trunk: THREE.BufferGeometry | null = null;
    let trellis: { pos: [number, number, number]; size: [number, number, number]; rot?: [number, number, number] }[] = [];

    switch (habit) {
      case 'TREE': {
        // Tapered trunk
        const trunkH = heightM * 0.6;
        trunk = new THREE.CylinderGeometry(spreadM * 0.08, spreadM * 0.15, trunkH, 8);
        trunk.translate(0, trunkH / 2, 0);

        // Canopy clumps (layered spheres of leaf cards)
        for (let i = 0; i < instanceCount; i++) {
          const theta = tempRng() * Math.PI * 2;
          const phi = tempRng() * Math.PI * 0.6;
          const r = (spreadM * 0.45) * (0.6 + tempRng() * 0.5);

          const x = r * Math.sin(phi) * Math.cos(theta);
          const y = trunkH + r * Math.cos(phi) * 0.7;
          const z = r * Math.sin(phi) * Math.sin(theta);

          dummy.position.set(x, y, z);
          dummy.rotation.set(tempRng() * 0.6 - 0.3, theta, tempRng() * 0.6 - 0.3);
          dummy.scale.set(cardW * 1.5, cardH * 1.5, 1);
          dummy.updateMatrix();
          matrices.push(dummy.matrix.clone());
        }
        break;
      }

      case 'SHRUB': {
        // Multi-stem base + layered dome
        trunk = new THREE.CylinderGeometry(0.04, 0.08, heightM * 0.3, 6);
        trunk.translate(0, heightM * 0.15, 0);

        for (let i = 0; i < instanceCount; i++) {
          const layer = Math.floor(i / 6);
          const frac = (i % 6) / 6;
          const angle = frac * Math.PI * 2 + tempRng() * 0.5;
          const radius = (spreadM * 0.4) * (1 - layer * 0.25);
          const y = heightM * 0.2 + layer * (heightM * 0.3);

          dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
          dummy.rotation.set(0.4, angle, 0);
          dummy.scale.set(cardW * 1.2, cardH * 1.2, 1);
          dummy.updateMatrix();
          matrices.push(dummy.matrix.clone());

          // Add occasional flower at mound edge
          if (tempRng() > 0.6) {
            dummy.scale.set(cardW * 0.5, cardW * 0.5, 1);
            dummy.position.y += cardH * 0.3;
            dummy.updateMatrix();
            flMatrices.push(dummy.matrix.clone());
          }
        }
        break;
      }

      case 'GRASS': {
        // Clump of upright blades
        for (let i = 0; i < instanceCount; i++) {
          const angle = (i / instanceCount) * Math.PI * 2;
          const dist = (spreadM * 0.3) * tempRng();
          const lean = 0.15 + tempRng() * 0.25;

          dummy.position.set(Math.cos(angle) * dist, 0.05, Math.sin(angle) * dist);
          dummy.rotation.set(lean, angle, 0);
          dummy.scale.set(cardW * 0.6, heightM * (0.8 + tempRng() * 0.4), 1);
          dummy.updateMatrix();
          matrices.push(dummy.matrix.clone());
        }
        break;
      }

      case 'CLIMBER': {
        // Small wooden trellis
        const trellisH = heightM * 1.1;
        trellis = [
          { pos: [-spreadM * 0.3, trellisH / 2, 0], size: [0.04, trellisH, 0.04] },
          { pos: [spreadM * 0.3, trellisH / 2, 0], size: [0.04, trellisH, 0.04] },
          { pos: [0, trellisH * 0.3, 0], size: [spreadM * 0.68, 0.03, 0.03] },
          { pos: [0, trellisH * 0.6, 0], size: [spreadM * 0.68, 0.03, 0.03] },
          { pos: [0, trellisH * 0.9, 0], size: [spreadM * 0.68, 0.03, 0.03] },
        ];

        // Vine leaves clinging to trellis
        for (let i = 0; i < instanceCount; i++) {
          const y = (i / instanceCount) * trellisH * 0.9 + 0.1;
          const x = (tempRng() - 0.5) * spreadM * 0.6;
          const z = (tempRng() - 0.5) * 0.1;

          dummy.position.set(x, y, z);
          dummy.rotation.set(tempRng() * 0.4, tempRng() * Math.PI * 2, tempRng() * 0.4);
          dummy.scale.set(cardW, cardH, 1);
          dummy.updateMatrix();
          matrices.push(dummy.matrix.clone());
        }
        break;
      }

      case 'SUCCULENT': {
        // Spiral rosette
        for (let i = 0; i < instanceCount; i++) {
          const goldenRatio = 2.39996; // 137.5 degrees
          const angle = i * goldenRatio;
          const r = (spreadM * 0.45) * Math.sqrt(i / instanceCount);
          const y = (i / instanceCount) * heightM * 0.3;

          dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
          dummy.rotation.set(0.6 - (i / instanceCount) * 0.4, angle, 0);
          dummy.scale.set(cardW * 1.1, cardH * 1.1, 1);
          dummy.updateMatrix();
          matrices.push(dummy.matrix.clone());
        }
        break;
      }

      case 'ROOT': {
        // Collar base + leafy tuft
        trunk = new THREE.ConeGeometry(spreadM * 0.15, heightM * 0.35, 6);
        trunk.rotateX(Math.PI); // inverted cone sitting in soil
        trunk.translate(0, heightM * 0.1, 0);

        for (let i = 0; i < instanceCount; i++) {
          const angle = (i / instanceCount) * Math.PI * 2 + tempRng() * 0.4;
          const r = spreadM * 0.25;
          const y = heightM * 0.25;

          dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
          dummy.rotation.set(0.5, angle, 0);
          dummy.scale.set(cardW, cardH * 1.3, 1);
          dummy.updateMatrix();
          matrices.push(dummy.matrix.clone());
        }
        break;
      }

      case 'HERB':
      default: {
        // Rosette / clump with delicate leaves
        for (let i = 0; i < instanceCount; i++) {
          const angle = (i / instanceCount) * Math.PI * 2 + tempRng() * 0.3;
          const tier = i % 3;
          const r = (spreadM * 0.38) * (0.4 + tier * 0.3);
          const y = 0.05 + tier * (heightM * 0.25);

          dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
          dummy.rotation.set(0.35 - tier * 0.1, angle, tempRng() * 0.2);
          dummy.scale.set(cardW, cardH, 1);
          dummy.updateMatrix();
          matrices.push(dummy.matrix.clone());

          // Optional flower spike
          if (i === 0 && tempRng() > 0.4) {
            dummy.position.set(0, heightM * 0.9, 0);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(cardW * 0.7, cardW * 0.7, 1);
            dummy.updateMatrix();
            flMatrices.push(dummy.matrix.clone());
          }
        }
        break;
      }
    }

    return {
      leafMatrices: matrices,
      flowerMatrices: flMatrices,
      trunkGeometry: trunk,
      trellisElements: trellis,
    };
  }, [plant.id, habit, heightM, spreadM, instanceCount]);

  // Apply matrices to InstancedMesh
  useMemo(() => {
    if (leavesRef.current?.instanceMatrix) {
      for (let i = 0; i < leafMatrices.length; i++) {
        leavesRef.current.setMatrixAt(i, leafMatrices[i]);
      }
      leavesRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [leafMatrices]);

  useMemo(() => {
    if (flowersRef.current?.instanceMatrix) {
      for (let i = 0; i < flowerMatrices.length; i++) {
        flowersRef.current.setMatrixAt(i, flowerMatrices[i]);
      }
      flowersRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [flowerMatrices]);

  // Wind-sway animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime() * GARDEN_CONFIG.procedural.windSwaySpeed;
      const swayStr = GARDEN_CONFIG.procedural.windSwayStrength;
      groupRef.current.rotation.z = Math.sin(t + position[0] * 0.5) * swayStr;
      groupRef.current.rotation.x = Math.cos(t * 0.8 + position[2] * 0.5) * (swayStr * 0.7);
    }
  });

  // Base leaf quad geometry (2 triangles)
  const quadGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0); // anchor at base of card
    return geo;
  }, []);

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      {/* Optional trunk */}
      {trunkGeometry && (
        <mesh geometry={trunkGeometry} castShadow receiveShadow>
          <meshStandardMaterial
            color={GARDEN_CONFIG.procedural.defaultColors.trunk}
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
      )}

      {/* Optional trellis */}
      {trellisElements.map((el, idx) => (
        <mesh key={`trellis-${idx}`} position={el.pos} castShadow receiveShadow>
          <boxGeometry args={el.size} />
          <meshStandardMaterial
            color={GARDEN_CONFIG.procedural.defaultColors.trellis}
            roughness={0.85}
          />
        </mesh>
      ))}

      {/* Instanced Leaf Cards */}
      {leafMatrices.length > 0 && (
        <instancedMesh
          ref={leavesRef}
          args={[quadGeometry, undefined, leafMatrices.length]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            map={leafTexture}
            transparent
            alphaTest={0.15}
            side={THREE.DoubleSide}
            roughness={0.65}
            metalness={0.05}
          />
        </instancedMesh>
      )}

      {/* Instanced Flower Cards */}
      {flowerMatrices.length > 0 && (
        <instancedMesh
          ref={flowersRef}
          args={[quadGeometry, undefined, flowerMatrices.length]}
          castShadow
        >
          <meshStandardMaterial
            color={flowerColor}
            side={THREE.DoubleSide}
            roughness={0.5}
            metalness={0.0}
          />
        </instancedMesh>
      )}
    </group>
  );
}

