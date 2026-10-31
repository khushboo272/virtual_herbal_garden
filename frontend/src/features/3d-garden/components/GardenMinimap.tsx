// ──────────────────────────────────────────────────────────
// components/GardenMinimap.tsx — Interactive Landscape Radar with Click-to-Teleport
// Renders zones, pond, paths, player heading cone, and supports 1-click travel
// ──────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { GARDEN_CONFIG } from '../gardenConfig';

interface GardenMinimapProps {
  playerPos: [number, number, number];
  playerHeadingRad: number;
  onTeleport: (target: [number, number, number]) => void;
  visible?: boolean;
}

export function GardenMinimap({
  playerPos,
  playerHeadingRad,
  onTeleport,
  visible = true,
}: GardenMinimapProps) {
  if (!visible) return null;

  const mapSize = 180; // px
  const worldRadius = GARDEN_CONFIG.camera.worldBounds; // ~48m

  // Maps world (x, z) to minimap SVG (cx, cy)
  const worldToMap = (x: number, z: number) => {
    const normX = (x / (worldRadius * 2)) + 0.5;
    const normZ = (z / (worldRadius * 2)) + 0.5;
    return {
      cx: normX * mapSize,
      cy: normZ * mapSize,
    };
  };

  // Maps click on SVG back to world (x, z)
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const normX = clickX / mapSize - 0.5;
    const normZ = clickY / mapSize - 0.5;

    const worldX = normX * (worldRadius * 2);
    const worldZ = normZ * (worldRadius * 2);

    onTeleport([worldX, 0, worldZ]);
  };

  const playerCoord = worldToMap(playerPos[0], playerPos[2]);
  const [px, , pz] = GARDEN_CONFIG.terrain.pondCenter;
  const pondCoord = worldToMap(px, pz);
  const pondRadiusMap = (GARDEN_CONFIG.terrain.pondRadius / (worldRadius * 2)) * mapSize;

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 50,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: 16,
        padding: 10,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Garden Radar
        </span>
        <span style={{ fontSize: 9, color: '#64748b' }}>Click to Teleport</span>
      </div>

      <svg
        width={mapSize}
        height={mapSize}
        onClick={handleMapClick}
        style={{
          borderRadius: 12,
          background: '#0a101d',
          cursor: 'crosshair',
          display: 'block',
        }}
      >
        {/* Outer boundary ring */}
        <circle
          cx={mapSize / 2}
          cy={mapSize / 2}
          r={mapSize / 2 - 4}
          fill="#0f1c15"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
        />

        {/* Radiating gravel path corridors */}
        {GARDEN_CONFIG.zones.map((zone) => {
          const zCoord = worldToMap(zone.center[0], zone.center[2]);
          return (
            <line
              key={`path-${zone.id}`}
              x1={mapSize / 2}
              y1={mapSize / 2}
              x2={zCoord.cx}
              y2={zCoord.cy}
              stroke="#52525b"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity={0.65}
            />
          );
        })}

        {/* Central Flagstone Plaza */}
        <circle
          cx={mapSize / 2}
          cy={mapSize / 2}
          r={(GARDEN_CONFIG.terrain.plazaRadius / (worldRadius * 2)) * mapSize}
          fill="#71717a"
          opacity={0.7}
        />

        {/* Reflective Water Pond */}
        <circle
          cx={pondCoord.cx}
          cy={pondCoord.cy}
          r={pondRadiusMap}
          fill="#06b6d4"
          opacity={0.75}
        />

        {/* Botanical Zone Beds */}
        {GARDEN_CONFIG.zones.map((zone) => {
          const zCoord = worldToMap(zone.center[0], zone.center[2]);
          const bedW = (zone.bedSize[0] / (worldRadius * 2)) * mapSize;
          const bedD = (zone.bedSize[1] / (worldRadius * 2)) * mapSize;

          return (
            <ellipse
              key={`bed-${zone.id}`}
              cx={zCoord.cx}
              cy={zCoord.cy}
              rx={bedW / 2}
              ry={bedD / 2}
              fill={zone.themeColor}
              opacity={0.8}
            />
          );
        })}

        {/* Player Position & Directional Heading Cone */}
        <g transform={`translate(${playerCoord.cx}, ${playerCoord.cy}) rotate(${(playerHeadingRad * 180) / Math.PI})`}>
          {/* Vision field cone */}
          <polygon
            points="0,0 -8,-18 8,-18"
            fill="rgba(16, 185, 129, 0.4)"
          />
          {/* Center player blip */}
          <circle cx="0" cy="0" r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

