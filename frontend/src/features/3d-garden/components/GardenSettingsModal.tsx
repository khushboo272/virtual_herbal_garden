// ──────────────────────────────────────────────────────────
// components/GardenSettingsModal.tsx — Garden Experience & Graphics Control Panel
// Quality tiers, diurnal clock slider, audio volume, labels & accessibility
// ──────────────────────────────────────────────────────────
import { X, Sun, Moon, Volume2, Sparkles, Tag, Eye, Monitor } from 'lucide-react';
import {
  GARDEN_QUALITY_TIERS,
  type QualityTierName,
} from '../gardenConfig';

interface GardenSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: QualityTierName;
  onSelectTier: (tier: QualityTierName) => void;
  timeOfDay: number;
  onChangeTimeOfDay: (time: number) => void;
  audioVolume: number;
  onChangeAudioVolume: (volume: number) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
}

export function GardenSettingsModal({
  isOpen,
  onClose,
  currentTier,
  onSelectTier,
  timeOfDay,
  onChangeTimeOfDay,
  audioVolume,
  onChangeAudioVolume,
  showLabels,
  onToggleLabels,
  reducedMotion,
  onToggleReducedMotion,
}: GardenSettingsModalProps) {
  if (!isOpen) return null;

  const tiers: QualityTierName[] = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(10, 16, 29, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 520,
          color: '#f8fafc',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Monitor style={{ width: 18, height: 18, color: '#10b981' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Garden Settings & Quality</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quality Tier Selector */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
              Graphics & Performance Tier
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {tiers.map((t) => {
                const isSelected = currentTier === t;
                return (
                  <button
                    key={t}
                    onClick={() => onSelectTier(t)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 8,
                      border: isSelected ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? '#10b981' : '#cbd5e1',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
              {GARDEN_QUALITY_TIERS[currentTier].description}
            </p>
          </div>

          {/* Time of Day Control */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                {timeOfDay >= 6 && timeOfDay <= 18 ? <Sun style={{ width: 14, height: 14, color: '#f59e0b' }} /> : <Moon style={{ width: 14, height: 14, color: '#38bdf8' }} />}
                Time of Day: <span style={{ color: '#f8fafc' }}>{formatTime(timeOfDay)}</span>
              </label>
              <button
                onClick={() => {
                  const now = new Date();
                  onChangeTimeOfDay(now.getHours() + now.getMinutes() / 60);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#38bdf8',
                  fontSize: 10,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Sync Local Time
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.25"
              value={timeOfDay}
              onChange={(e) => onChangeTimeOfDay(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
            />
            {/* Quick time presets */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#64748b' }}>
              <span onClick={() => onChangeTimeOfDay(6.0)} style={{ cursor: 'pointer' }}>Dawn (6 AM)</span>
              <span onClick={() => onChangeTimeOfDay(12.0)} style={{ cursor: 'pointer' }}>Noon (12 PM)</span>
              <span onClick={() => onChangeTimeOfDay(18.0)} style={{ cursor: 'pointer' }}>Sunset (6 PM)</span>
              <span onClick={() => onChangeTimeOfDay(22.0)} style={{ cursor: 'pointer' }}>Night (10 PM)</span>
            </div>
          </div>

          {/* Audio Volume */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Volume2 style={{ width: 14, height: 14, color: '#10b981' }} />
                Nature & Ambient Audio
              </label>
              <span style={{ fontSize: 12, color: '#f8fafc', fontWeight: 600 }}>{Math.round(audioVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioVolume}
              onChange={(e) => onChangeAudioVolume(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
            />
          </div>

          {/* Toggles: Plant Labels & Reduced Motion */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 4, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              onClick={onToggleLabels}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                background: showLabels ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: showLabels ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                color: showLabels ? '#10b981' : '#94a3b8',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag style={{ width: 14, height: 14 }} /> Plant Labels
              </span>
              <span>{showLabels ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onToggleReducedMotion}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                background: reducedMotion ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: reducedMotion ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                color: reducedMotion ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles style={{ width: 14, height: 14 }} /> Reduced Motion
              </span>
              <span>{reducedMotion ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

