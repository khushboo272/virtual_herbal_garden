import React from 'react';
import { Html } from '@react-three/drei';
import type { PartMeshAnchor } from '../types';

interface PlantLabelsProps {
  anchors: PartMeshAnchor[];
  selectedPart: string | null;
  onSelectPart: (part: string) => void;
  visible?: boolean;
}

export const PlantLabels: React.FC<PlantLabelsProps> = ({
  anchors,
  selectedPart,
  onSelectPart,
  visible = true,
}) => {
  if (!visible || anchors.length === 0) return null;

  return (
    <group>
      {anchors.map((anchor) => {
        const isSelected = selectedPart === anchor.part;

        return (
          <group key={anchor.part} position={anchor.position}>
            {/* Pulsing anchor dot */}
            <mesh>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshBasicMaterial
                color={isSelected ? '#10b981' : '#34d399'}
                transparent
                opacity={0.85}
              />
            </mesh>

            <Html
              center
              distanceFactor={6}
              occlude="blending"
              className="select-none pointer-events-auto"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPart(anchor.part);
                }}
                className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer shadow-lg whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 scale-110 shadow-emerald-500/30'
                    : 'bg-white/95 dark:bg-gray-800/95 text-gray-800 dark:text-gray-200 border border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-gray-700 hover:border-emerald-500 hover:scale-105'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full transition-transform ${
                    isSelected ? 'bg-white animate-pulse' : 'bg-emerald-500 group-hover:scale-125'
                  }`}
                />
                <span>{anchor.label}</span>
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

