// ──────────────────────────────────────────────────────────
// components/FillerPlanting.tsx — Non-Database Ornamental Garden Filler
// Lush non-interactive planting: Hydrangeas, Lavender, Ornamental Grasses & Groundcover
// ──────────────────────────────────────────────────────────
import { useMemo } from 'react';
import * as THREE from 'three';
import { GARDEN_CONFIG } from '../gardenConfig';
import { getGroundY } from '../utils/terrainGenerator';
import { createSeededRandom } from '../utils/leafCardGenerator';

interface FillerPlantingProps {
  count: number;
}

type FillerType = 'HYDRANGEA' | 'LAVENDER' | 'ORNAMENTAL_GRASS' | 'GROUND_COVER';

export function FillerPlanting({ count }: FillerPlantingProps) {
  const fillers = useMemo(() => {
    if (count <= 0) return [];

    const rng = createSeededRandom('filler-flora-seed-77');
    const list: { pos: [number, number, number]; type: FillerType; color: string; scale: number }[] = [];

    // Scatter fillers closely bordering the 10 zone beds and along stone retaining wall
    GARDEN_CONFIG.zones.forEach((zone) => {
      const [zx, , zz] = zone.center;
      const [w, d] = zone.bedSize;
      const perZoneCount = Math.max(2, Math.floor(count / 10));

      for (let i = 0; i < perZoneCount; i++) {
        // Place along border edges of the bed
        const angle = rng() * Math.PI * 2;
        const dist = Math.hypot(w / 2, d / 2) + 0.6 + rng() * 1.5;
        const fx = zx + Math.cos(angle) * dist;
        const fz = zz + Math.sin(angle) * dist;
        const fy = getGroundY(fx, fz);

        const types: FillerType[] = ['HYDRANGEA', 'LAVENDER', 'ORNAMENTAL_GRASS', 'GROUND_COVER'];
        const type = types[Math.floor(rng() * types.length)];

        let color = '#3b82f6';
        if (type === 'HYDRANGEA') {
          color = rng() > 0.5 ? '#60a5fa' : '#c084fc'; // Blue / Violet
        } else if (type === 'LAVENDER') {
          color = '#7c3aed'; // Deep purple
        } else if (type === 'ORNAMENTAL_GRASS') {
          color = '#d97706'; // Golden amber
        } else {
          color = '#15803d'; // Mossy green
        }

        const scale = 0.65 + rng() * 0.45;
        list.push({ pos: [fx, fy, fz], type, color, scale });
      }
    });

    return list;
  }, [count]);

  return (
    <group>
      {fillers.map((f, i) => (
        <group key={`filler-${i}`} position={f.pos} scale={[f.scale, f.scale, f.scale]}>
          {f.type === 'HYDRANGEA' && (
            <group>
              {/* Foliage mound */}
              <mesh position={[0, 0.3, 0]} castShadow>
                <sphereGeometry args={[0.45, 7, 6]} />
                <meshStandardMaterial color="#166534" roughness={0.7} />
              </mesh>
              {/* Flower head domes */}
              {[-0.2, 0.15, 0].map((ox, k) => (
                <mesh key={`fl-${k}`} position={[ox, 0.6 + k * 0.08, (k - 1) * 0.15]} castShadow>
                  <sphereGeometry args={[0.22, 6, 6]} />
                  <meshStandardMaterial color={f.color} roughness={0.6} />
                </mesh>
              ))}
            </group>
          )}

          {f.type === 'LAVENDER' && (
            <group>
              {/* Slender green base */}
              <mesh position={[0, 0.25, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.25, 0.5, 6]} />
                <meshStandardMaterial color="#1e3a1e" roughness={0.8} />
              </mesh>
              {/* Tall purple flower spikes */}
              {[-0.1, 0, 0.1].map((ox, k) => (
                <mesh key={`sp-${k}`} position={[ox, 0.65, (k - 1) * 0.08]} castShadow>
                  <cylinderGeometry args={[0.04, 0.06, 0.55, 5]} />
                  <meshStandardMaterial color={f.color} roughness={0.5} />
                </mesh>
              ))}
            </group>
          )}

          {f.type === 'ORNAMENTAL_GRASS' && (
            <group>
              {/* Clumping feathery grass fountain */}
              <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.35, 0.15, 0.8, 7]} />
                <meshStandardMaterial color={f.color} roughness={0.8} />
              </mesh>
            </group>
          )}

          {f.type === 'GROUND_COVER' && (
            <group>
              {/* Low creeping cushion */}
              <mesh position={[0, 0.1, 0]}>
                <sphereGeometry args={[0.38, 6, 4]} />
                <meshStandardMaterial color={f.color} roughness={0.85} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

