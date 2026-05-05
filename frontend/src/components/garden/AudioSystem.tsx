// ─────────────────────────────────────────────────────
// AudioSystem.tsx — Positional audio for birds and river
// Uses PositionalAudio from drei with graceful fallback
// ─────────────────────────────────────────────────────
import { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { PositionalAudio } from '@react-three/drei';

/* ── Safe audio wrapper — only renders if file exists ── */

function SafePositionalAudio({
  url,
  distance,
  position,
}: {
  url: string;
  distance: number;
  position: [number, number, number];
}) {
  const [exists, setExists] = useState(false);

  useEffect(() => {
    // Check if audio file exists before trying to load
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (res.ok) setExists(true);
      })
      .catch(() => {
        // Audio file not found — silently skip
      });
  }, [url]);

  if (!exists) return null;

  return (
    <group position={position}>
      <PositionalAudio url={url} distance={distance} loop autoplay />
    </group>
  );
}

/* ── AudioSystem ──────────────────────────────────── */

export function AudioSystem() {
  return (
    <>
      {/* Birds ambient — positioned high above */}
      <SafePositionalAudio
        url="/sounds/birds.mp3"
        distance={30}
        position={[0, 15, 0]}
      />

      {/* River — positioned at river location */}
      <SafePositionalAudio
        url="/sounds/river.mp3"
        distance={10}
        position={[0, 0.5, 25]}
      />
    </>
  );
}
