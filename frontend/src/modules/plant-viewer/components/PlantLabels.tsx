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
      {anchors.map((anchor, idx) => {
        const isSelected = selectedPart === anchor.part;
        // Alternate diagonal leader line direction (left vs right) based on position
        const isRightAligned = (anchor.position[0] ?? 0) >= 0;

        return (
          <group key={anchor.part} position={anchor.position}>
            {/* 3D Surface Pin Core */}
            <mesh>
              <sphereGeometry args={[0.012, 16, 16]} />
              <meshBasicMaterial
                color={isSelected ? '#10b981' : '#34d399'}
                transparent
                opacity={0.9}
              />
            </mesh>

            {/* Screen-clamped 2D Pin Dot + Leader Line + Compact Label */}
            <Html
              center={false}
              distanceFactor={8}
              occlude="blending"
              className="select-none pointer-events-auto"
              style={{
                transform: 'translate(-50%, -50%)',
                willChange: 'transform, opacity',
              }}
            >
              <div
                className={`relative flex items-center transition-all duration-200 ${
                  isRightAligned ? 'flex-row' : 'flex-row-reverse'
                }`}
                style={{
                  minWidth: 'max-content',
                }}
              >
                {/* 1. 8-10px Pulsing Pin Dot on Surface */}
                <div
                  data-testid="plant-pin-marker"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPart(anchor.part);
                  }}
                  className="relative flex items-center justify-center cursor-pointer group"
                  title={`Focus ${anchor.label}`}
                >
                  <span
                    className={`absolute w-4 h-4 rounded-full transition-transform ${
                      isSelected
                        ? 'bg-emerald-400/50 animate-ping'
                        : 'bg-emerald-500/20 group-hover:scale-150'
                    }`}
                  />
                  <span
                    className={`w-2.5 h-2.5 rounded-full ring-2 shadow-md transition-all ${
                      isSelected
                        ? 'bg-emerald-500 ring-white shadow-emerald-500/50 scale-125'
                        : 'bg-white dark:bg-gray-900 ring-emerald-500 group-hover:bg-emerald-400 group-hover:scale-110'
                    }`}
                  />
                </div>

                {/* 2. Angled Leader Line */}
                <div
                  data-testid="plant-pin-leader-line"
                  className="pointer-events-none flex items-center"
                >
                  <svg
                    width="28"
                    height="18"
                    viewBox="0 0 28 18"
                    fill="none"
                    className={`transition-opacity duration-200 ${
                      isSelected ? 'opacity-100' : 'opacity-60'
                    } ${isRightAligned ? '' : 'scale-x-[-1]'}`}
                  >
                    <path
                      d="M 2 9 L 14 9 L 26 2"
                      stroke={isSelected ? '#059669' : '#10b981'}
                      strokeWidth="1.5"
                      strokeDasharray={isSelected ? 'none' : '3 2'}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="2"
                      cy="9"
                      r="1.5"
                      fill={isSelected ? '#059669' : '#10b981'}
                    />
                  </svg>
                </div>

                {/* 3. Compact Label Chip (max 120px) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPart(anchor.part);
                  }}
                  className={`group/btn flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-md max-w-[120px] truncate backdrop-blur-md ${
                    isSelected
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-emerald-500/40 scale-105'
                      : 'bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-200 border border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-gray-800 hover:border-emerald-500 hover:scale-105'
                  }`}
                  title={`${anchor.label} (Click to inspect)`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 transition-transform ${
                      isSelected ? 'bg-white animate-pulse' : 'bg-emerald-500 group-hover/btn:scale-125'
                    }`}
                  />
                  <span className="truncate">{anchor.label}</span>
                </button>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
