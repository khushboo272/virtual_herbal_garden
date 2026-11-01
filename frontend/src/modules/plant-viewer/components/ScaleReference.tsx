import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface ScaleReferenceProps {
  plantHeightM: number;
  offset?: [number, number, number];
}

/**
 * 1.7m human silhouette and vertical measurement ruler
 * providing real-world scale context for botanical specimens.
 */
export const ScaleReference: React.FC<ScaleReferenceProps> = ({
  plantHeightM,
  offset = [-0.9, 0, 0],
}) => {
  // Generate human silhouette curve (stylized minimalist botanical observer, 1.7m height)
  const humanShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Head (radius 0.12, center at y = 1.58)
    const headRadius = 0.11;
    const headCenterY = 1.59;
    shape.absarc(0, headCenterY, headRadius, 0, Math.PI * 2, false);

    // Torso and legs
    const body = new THREE.Path();
    body.moveTo(-0.16, 1.45); // Left shoulder
    body.lineTo(0.16, 1.45);  // Right shoulder
    body.lineTo(0.12, 0.95);  // Waist
    body.lineTo(0.14, 0.85);  // Hips
    body.lineTo(0.12, 0.0);   // Right foot
    body.lineTo(0.02, 0.0);   // Inseam right
    body.lineTo(0.0, 0.75);   // Crotch
    body.lineTo(-0.02, 0.0);  // Inseam left
    body.lineTo(-0.12, 0.0);  // Left foot
    body.lineTo(-0.14, 0.85); // Hips
    body.lineTo(-0.12, 0.95); // Waist
    body.closePath();

    return [shape, body];
  }, []);

  // Ruler tick marks at 0.5m, 1.0m, 1.5m, 2.0m
  const rulerTicks = useMemo(() => {
    const ticks: { y: number; label: string }[] = [];
    const maxM = Math.max(2.0, Math.ceil(plantHeightM * 1.2));
    for (let h = 0.5; h <= maxM; h += 0.5) {
      ticks.push({ y: h, label: `${h.toFixed(1)}m` });
    }
    return ticks;
  }, [plantHeightM]);

  return (
    <group position={offset}>
      {/* 1.7m Human silhouette */}
      <group position={[-0.2, 0, 0]}>
        {humanShape.map((p, idx) => (
          <line key={idx}>
            <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints(p.getPoints(24))} />
            <lineBasicMaterial attach="material" color="#10b981" transparent opacity={0.65} linewidth={2} />
          </line>
        ))}
        <Html position={[0, 1.75, 0]} center distanceFactor={8} pointerEvents="none">
          <div className="bg-emerald-950/80 text-emerald-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap backdrop-blur-xs select-none">
            Human (1.7m)
          </div>
        </Html>
      </group>

      {/* Measurement ruler vertical bar */}
      <line>
        <bufferGeometry
          attach="geometry"
          {...new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, Math.max(1.7, plantHeightM), 0),
          ])}
        />
        <lineBasicMaterial attach="material" color="#6ee7b7" transparent opacity={0.4} />
      </line>

      {/* Ticks */}
      {rulerTicks.map((tick) => (
        <group key={tick.y} position={[0, tick.y, 0]}>
          <line>
            <bufferGeometry
              attach="geometry"
              {...new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-0.04, 0, 0),
                new THREE.Vector3(0.04, 0, 0),
              ])}
            />
            <lineBasicMaterial attach="material" color="#6ee7b7" transparent opacity={0.6} />
          </line>
          <Html position={[0.08, 0, 0]} center distanceFactor={8} pointerEvents="none">
            <span className="text-[9px] font-mono text-emerald-400 select-none opacity-75">
              {tick.label}
            </span>
          </Html>
        </group>
      ))}
    </group>
  );
};

