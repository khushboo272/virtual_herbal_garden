// ─────────────────────────────────────────────────────
// AmbientAudio.tsx — Procedural positional audio system
// Birds chirps, water ambiance, wind — all synthesized
// via Web Audio API. No MP3 files required.
// ─────────────────────────────────────────────────────
import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";

interface AmbientAudioProps {
  enabled: boolean;
}

export function AmbientAudio({ enabled }: AmbientAudioProps) {
  const { camera } = useThree();
  const ctxRef = useRef<AudioContext | null>(null);
  const waterNodeRef = useRef<{ gain: GainNode; source: AudioBufferSourceNode } | null>(null);
  const windNodeRef = useRef<{ gain: GainNode; source: AudioBufferSourceNode } | null>(null);
  const birdIntervalRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  // River position (matches River.tsx)
  const RIVER_Z = 25;

  /* ── Create audio context lazily ── */
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  /* ── Generate a white noise buffer ── */
  const createNoiseBuffer = useCallback(
    (duration: number, sampleRate = 44100) => {
      const ctx = getCtx();
      const length = duration * sampleRate;
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      return buffer;
    },
    [getCtx],
  );

  /* ── Start water ambiance (filtered noise) ── */
  const startWater = useCallback(() => {
    const ctx = getCtx();
    const buffer = createNoiseBuffer(4);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Band-pass filter for watery sound
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 600;
    filter.Q.value = 0.5;

    // Secondary low-pass for smoothness
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1200;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    waterNodeRef.current = { gain, source };
  }, [getCtx, createNoiseBuffer]);

  /* ── Start wind ambiance (very low filtered noise) ── */
  const startWind = useCallback(() => {
    const ctx = getCtx();
    const buffer = createNoiseBuffer(6);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 300;
    lp.Q.value = 0.3;

    const gain = ctx.createGain();
    gain.gain.value = 0.04;

    source.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    windNodeRef.current = { gain, source };
  }, [getCtx, createNoiseBuffer]);

  /* ── Bird chirp (synthesised) ── */
  const playChirp = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === "suspended") return;

    const now = ctx.currentTime;

    // Random chirp parameters
    const baseFreq = 2000 + Math.random() * 2500;
    const chirpCount = 1 + Math.floor(Math.random() * 3);

    for (let c = 0; c < chirpCount; c++) {
      const start = now + c * (0.08 + Math.random() * 0.06);
      const duration = 0.04 + Math.random() * 0.06;

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, start);
      osc.frequency.exponentialRampToValueAtTime(
        baseFreq * (1.2 + Math.random() * 0.8),
        start + duration * 0.5,
      );
      osc.frequency.exponentialRampToValueAtTime(
        baseFreq * 0.8,
        start + duration,
      );

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.04, start + duration * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.01);
    }
  }, [getCtx]);

  /* ── Start all audio ── */
  const startAll = useCallback(() => {
    if (isPlayingRef.current) return;
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();

    startWater();
    startWind();

    // Schedule random bird chirps
    const scheduleBirds = () => {
      playChirp();
      const nextDelay = 2000 + Math.random() * 5000;
      birdIntervalRef.current = window.setTimeout(scheduleBirds, nextDelay);
    };
    birdIntervalRef.current = window.setTimeout(scheduleBirds, 1000);

    isPlayingRef.current = true;
  }, [getCtx, startWater, startWind, playChirp]);

  /* ── Stop all audio ── */
  const stopAll = useCallback(() => {
    if (waterNodeRef.current) {
      try { waterNodeRef.current.source.stop(); } catch { /* ignore */ }
      waterNodeRef.current = null;
    }
    if (windNodeRef.current) {
      try { windNodeRef.current.source.stop(); } catch { /* ignore */ }
      windNodeRef.current = null;
    }
    if (birdIntervalRef.current != null) {
      clearTimeout(birdIntervalRef.current);
      birdIntervalRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  /* ── Toggle based on enabled prop ── */
  useEffect(() => {
    if (enabled) {
      startAll();
    } else {
      stopAll();
    }
    return () => stopAll();
  }, [enabled, startAll, stopAll]);

  /* ── Distance-based water volume ── */
  useFrame(() => {
    if (!waterNodeRef.current || !isPlayingRef.current) return;

    const distToRiver = Math.abs(camera.position.z - RIVER_Z);
    // Volume falls off with distance: 0.15 at river, ~0 at 40+ units
    const vol = Math.max(0, 0.15 * (1 - distToRiver / 40));
    waterNodeRef.current.gain.gain.value = vol;
  });

  return null;
}
