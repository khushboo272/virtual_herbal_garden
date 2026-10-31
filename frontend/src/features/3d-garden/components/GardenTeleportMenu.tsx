// ──────────────────────────────────────────────────────────
// components/GardenTeleportMenu.tsx — Quick Travel & Botanical Zone Teleporter
// 1-click smooth camera travel to any botanical zone or garden landmark
// ──────────────────────────────────────────────────────────
import { useState } from 'react';
import { Compass, ChevronDown, MapPin, Waves, Building } from 'lucide-react';
import { GARDEN_CONFIG } from '../gardenConfig';

interface GardenTeleportMenuProps {
  onTeleport: (position: [number, number, number]) => void;
}

export function GardenTeleportMenu({ onTeleport }: GardenTeleportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const landmarks = [
    { label: 'Central Plaza', pos: [0, 0, 2] as [number, number, number], icon: Building },
    { label: 'Pond & Waterfall', pos: [14, 0, 14] as [number, number, number], icon: Waves },
    ...GARDEN_CONFIG.zones.map((z) => ({
      label: z.label,
      pos: [z.signPosition[0], 0, z.signPosition[2]] as [number, number, number],
      icon: MapPin,
      color: z.themeColor,
    })),
  ];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#f8fafc',
          padding: '6px 12px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <Compass style={{ width: 14, height: 14, color: '#10b981' }} />
        <span>Teleport</span>
        <ChevronDown style={{ width: 12, height: 12, opacity: 0.7 }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 6,
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 12,
            padding: 6,
            width: 220,
            maxHeight: 320,
            overflowY: 'auto',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        >
          {landmarks.map((lm, idx) => {
            const Icon = lm.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  onTeleport(lm.pos);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '7px 10px',
                  border: 'none',
                  borderRadius: 6,
                  background: 'transparent',
                  color: '#e2e8f0',
                  fontSize: 11,
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Icon style={{ width: 13, height: 13, color: lm.color || '#10b981', flexShrink: 0 }} />
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {lm.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

