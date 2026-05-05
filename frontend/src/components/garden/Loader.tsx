// ─────────────────────────────────────────────────────
// Loader.tsx — Loading progress overlay using useProgress
// Frosted glass overlay with animated progress bar
// ─────────────────────────────────────────────────────
import { useProgress } from '@react-three/drei';

export function Loader() {
  const { active, progress } = useProgress();

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(26, 26, 46, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: 'white',
      }}
    >
      {/* Garden emoji */}
      <div style={{ fontSize: '48px', marginBottom: '24px', animation: 'pulse 1.5s infinite' }}>
        🌿
      </div>

      {/* Title */}
      <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 600, color: '#e0e0e0' }}>
        Loading Garden...
      </h2>

      {/* Progress bar container */}
      <div
        style={{
          width: '280px',
          height: '6px',
          borderRadius: '3px',
          background: 'rgba(255, 255, 255, 0.15)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            borderRadius: '3px',
            background: 'linear-gradient(90deg, #1a7a5e, #2dd4a8)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Percentage */}
      <p style={{ margin: '12px 0 0', fontSize: '14px', color: '#aaaaaa' }}>
        {Math.round(progress)}%
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
