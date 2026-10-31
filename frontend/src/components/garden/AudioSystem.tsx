// ─────────────────────────────────────────────────────
// AudioSystem.tsx — Positional audio for birds and river
// Uses procedural Web Audio synthesis for zero-asset soundscape,
// plus Howler and PositionalAudio when external sound files are present.
// ─────────────────────────────────────────────────────
import { useRef, useEffect, useState } from 'react';
import { PositionalAudio } from '@react-three/drei';
import { Howl } from 'howler';
import { gardenSoundscape } from '../../features/3d-garden/utils/proceduralAudio';

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
    // Check if audio file exists and is actual audio, not Vite SPA fallback HTML
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        if (res.ok && !ct.includes('text/html') && (ct.includes('audio') || ct.includes('octet-stream'))) {
          setExists(true);
        }
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

export function useAmbientAudio(isAudioEnabled = true, isNight = false, volume = 0.7) {
  const birdsRef = useRef<Howl | null>(null);
  const nightRef = useRef<Howl | null>(null);

  // Procedural Web Audio Synthesis (guarantees sound even with zero MP3 assets)
  useEffect(() => {
    if (isAudioEnabled) {
      gardenSoundscape.start(volume, isNight);
    } else {
      gardenSoundscape.stop();
    }
  }, [isAudioEnabled]);

  useEffect(() => {
    gardenSoundscape.setNight(isNight);
  }, [isNight]);

  useEffect(() => {
    gardenSoundscape.setVolume(volume);
  }, [volume]);

  // Optional Howler audio clips (when MP3 files are present in /sounds/)
  useEffect(() => {
    if (!isAudioEnabled) return;
    try {
      birdsRef.current = new Howl({
        src: ['/sounds/birds.mp3'],
        loop: true,
        volume: isNight ? 0 : 0.5 * volume,
        autoplay: true,
      });

      nightRef.current = new Howl({
        src: ['/sounds/night-insects.mp3'],
        loop: true,
        volume: isNight ? 0.5 * volume : 0,
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

  // Handle crossfading
  useEffect(() => {
    if (!isAudioEnabled) return;
    const fadeDuration = 2000;
    
    if (isNight) {
      if (birdsRef.current) birdsRef.current.fade(0.5 * volume, 0, fadeDuration);
      if (nightRef.current) nightRef.current.fade(0, 0.5 * volume, fadeDuration);
    } else {
      if (birdsRef.current) birdsRef.current.fade(0, 0.5 * volume, fadeDuration);
      if (nightRef.current) nightRef.current.fade(0.5 * volume, 0, fadeDuration);
    }
  }, [isNight, isAudioEnabled, volume]);
}

export function AudioSystem({
  isAudioEnabled = true,
  isPlaying,
  isNight = false,
  volume = 0.7,
}: {
  isAudioEnabled?: boolean;
  isPlaying?: boolean;
  isNight?: boolean;
  volume?: number;
}) {
  const active = isPlaying ?? isAudioEnabled;
  useAmbientAudio(active, isNight, volume);

  return (
    <group name="GardenAudioSystem">
      {/* Pond Waterfall — positioned at pond location */}
      <SafePositionalAudio
        url="/sounds/river.mp3"
        distance={10}
        position={[19, 0, 19]}
      />
    </group>
  );
}
