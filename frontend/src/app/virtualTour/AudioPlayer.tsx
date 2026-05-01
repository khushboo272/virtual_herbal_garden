// ──────────────────────────────────────────────────────────
// AudioPlayer — Web Speech API narration player
// ──────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  text: string;
  durationMinutes: number;
  autoReplay?: boolean;
}

export function AudioPlayer({ text, durationMinutes, autoReplay = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Estimated total duration in seconds (≈12 chars/sec at rate 0.9)
  const estimatedDuration = Math.max(text.length / 12, durationMinutes * 60);
  const totalSeconds = Math.round(estimatedDuration);

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTracking = useCallback(() => {
    stopTracking();
    startTimeRef.current = Date.now() - pausedAtRef.current * 1000;
    intervalRef.current = window.setInterval(() => {
      const elapsedSecs = (Date.now() - startTimeRef.current) / 1000;
      const pct = Math.min((elapsedSecs / estimatedDuration) * 100, 100);
      setElapsed(elapsedSecs);
      setProgress(pct);
      if (pct >= 100) {
        stopTracking();
      }
    }, 200);
  }, [estimatedDuration, stopTracking]);

  const getPreferredVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    // Prefer English female voice
    const enFemale = voices.find(
      (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'),
    );
    if (enFemale) return enFemale;
    // Fallback: any English voice
    const enVoice = voices.find((v) => v.lang.startsWith('en'));
    return enVoice || voices[0] || null;
  };

  const speak = useCallback(() => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.9;
    utt.pitch = 1.05;
    const voice = getPreferredVoice();
    if (voice) utt.voice = voice;

    utt.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      stopTracking();
    };

    utt.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      stopTracking();
    };

    utteranceRef.current = utt;
    pausedAtRef.current = 0;
    window.speechSynthesis.speak(utt);
    setIsPlaying(true);
    setIsPaused(false);
    startTracking();
  }, [text, startTracking, stopTracking]);

  const handlePlayPause = useCallback(() => {
    if (!window.speechSynthesis) return;

    if (isPlaying && !isPaused) {
      // Pause
      window.speechSynthesis.pause();
      setIsPaused(true);
      pausedAtRef.current = elapsed;
      stopTracking();
    } else if (isPlaying && isPaused) {
      // Resume
      window.speechSynthesis.resume();
      setIsPaused(false);
      startTracking();
    } else {
      // Start fresh
      speak();
    }
  }, [isPlaying, isPaused, elapsed, speak, startTracking, stopTracking]);

  const handleReplay = useCallback(() => {
    setProgress(0);
    setElapsed(0);
    pausedAtRef.current = 0;
    speak();
  }, [speak]);

  const handleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      // Resume if was playing
      if (isPlaying) {
        speak();
      }
    } else {
      setIsMuted(true);
      window.speechSynthesis.cancel();
      stopTracking();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [isMuted, isPlaying, speak, stopTracking]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handlePlayPause();
      }
    },
    [handlePlayPause],
  );

  // Handle progress bar click to seek (visual only — TTS doesn't support seeking)
  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setProgress(Math.min(Math.max(pct, 0), 100));
    setElapsed((pct / 100) * estimatedDuration);
  };

  // Auto-replay if requested (for Replay button flow)
  useEffect(() => {
    if (autoReplay && text) {
      speak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoReplay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopTracking();
    };
  }, [stopTracking]);

  // Load voices (some browsers load async)
  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', () => {
      window.speechSynthesis.getVoices();
    });
  }, []);

  return (
    <div className="vt-audio" onKeyDown={handleKeyDown} tabIndex={0} role="region" aria-label="Audio narration player">
      <h3 className="vt-modal__section-title">
        <Volume2 size={16} />
        Audio Narration
      </h3>
      <div className="vt-audio__controls">
        {/* Play/Pause Button */}
        <button
          className="vt-audio__play-btn"
          onClick={handlePlayPause}
          aria-label={isPlaying && !isPaused ? 'Pause narration' : 'Play narration'}
        >
          {isPlaying && !isPaused ? <Pause size={18} /> : <Play size={18} />}
        </button>

        {/* Progress Bar */}
        <div className="vt-audio__bar-container">
          <div
            className="vt-audio__bar"
            onClick={handleBarClick}
            role="slider"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Narration progress"
            tabIndex={0}
          >
            <div className="vt-audio__bar-fill" style={{ width: `${progress}%` }} />
            <div className="vt-audio__bar-thumb" style={{ left: `${progress}%` }} />
          </div>
          <div className="vt-audio__time">
            <span>{formatTime(Math.min(elapsed, totalSeconds))}</span>
            <span>{formatTime(totalSeconds)}</span>
          </div>
        </div>

        {/* Replay */}
        <button
          className="vt-audio__icon-btn"
          onClick={handleReplay}
          aria-label="Replay narration from start"
        >
          <RotateCcw size={16} />
        </button>

        {/* Mute */}
        <button
          className="vt-audio__icon-btn"
          onClick={handleMute}
          aria-label={isMuted ? 'Unmute narration' : 'Mute narration'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </div>
  );
}
