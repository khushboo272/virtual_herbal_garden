// ─────────────────────────────────────────────────────
// AudioSystem.tsx — Positional audio for birds and river
// Uses Howler for ambient and PositionalAudio from drei for spatial
// ─────────────────────────────────────────────────────
import { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { PositionalAudio } from '@react-three/drei';
import { Howl } from 'howler';

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

export function useAmbientAudio(isAudioEnabled = true, isNight = false) {
  const birdsRef = useRef<Howl | null>(null);
  const nightRef = useRef<Howl | null>(null);

  // Initialize howls
  useEffect(() => {
    if (!isAudioEnabled) return;
    try {
      birdsRef.current = new Howl({
        src: ['/sounds/birds.mp3'],
        loop: true,
        volume: isNight ? 0 : 0.5,
        autoplay: true,
      });

      nightRef.current = new Howl({
        src: ['/sounds/night-insects.mp3'],
        loop: true,
        volume: isNight ? 0.5 : 0,
        autoplay: true,
      });

      return () => {
        if (birdsRef.current && typeof birdsRef.current.unload === 'function') {
          birdsRef.current.unload();
        }
        if (nightRef.current && typeof nightRef.current.unload === 'function') {
          nightRef.current.unload();
        }
      };
    } catch (e) {
      console.error("USE EFFECT ERROR:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioEnabled]);

  // Handle fading
  useEffect(() => {
    if (!isAudioEnabled) return;
    const fadeDuration = 2000;
    
    if (isNight) {
      // Fade out birds, fade in night
      if (birdsRef.current) birdsRef.current.fade(0.5, 0, fadeDuration);
      if (nightRef.current) nightRef.current.fade(0, 0.5, fadeDuration);
    } else {
      // Fade out night, fade in birds
      if (birdsRef.current) birdsRef.current.fade(0, 0.5, fadeDuration);
      if (nightRef.current) nightRef.current.fade(0.5, 0, fadeDuration);
    }
  }, [isNight, isAudioEnabled]);
}

export function AudioSystem({ isAudioEnabled = true, isNight = false }: { isAudioEnabled?: boolean, isNight?: boolean }) {
  useAmbientAudio(isAudioEnabled, isNight);

  return (
    <>
      {/* River — positioned at river location */}
      <SafePositionalAudio
        url="/sounds/river.mp3"
        distance={10}
        position={[0, 0.5, 25]}
      />
    </>
  );
}
