import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Play, Pause, Square, Gauge } from 'lucide-react';

interface AudioNarrationPlayerProps {
  audioUrl?: string;
  textToSpeak: string;
  title: string;
}

export function AudioNarrationPlayer({ audioUrl, textToSpeak, title }: AudioNarrationPlayerProps) {
  // If dedicated audioUrl exists, render native HTML5 audio player
  if (audioUrl) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Audio Narration</div>
            <div className="text-sm font-medium text-gray-900">{title}</div>
          </div>
        </div>
        <audio controls className="w-full sm:w-64 h-10 rounded-lg">
          <source src={audioUrl} />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  // Fallback to Web SpeechSynthesis API
  const [isSupported, setIsSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, []);

  // Stop narration when unmounting or text changes
  useEffect(() => {
    return () => {
      stop();
    };
  }, [textToSpeak, stop]);

  if (!isSupported) {
    return null; // Gracefully hide if Web Speech API is not supported
  }

  const cleanText = textToSpeak.replace(/[#*`_\[\]()]/g, ' ');

  const handlePlay = () => {
    if (!window.speechSynthesis) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speed;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith('en')) || null;
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (window.speechSynthesis && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleSpeedToggle = () => {
    const nextSpeed = speed === 1.0 ? 1.25 : speed === 1.25 ? 1.5 : 1.0;
    setSpeed(nextSpeed);
    if (isPlaying) {
      stop();
      // Restart at new speed
      setTimeout(() => {
        const u = new SpeechSynthesisUtterance(cleanText);
        u.rate = nextSpeed;
        u.onend = () => { setIsPlaying(false); setIsPaused(false); };
        window.speechSynthesis.speak(u);
        setIsPlaying(true);
      }, 50);
    }
  };

  return (
    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
          <Volume2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Audio Guide</div>
          <div className="text-sm font-medium text-gray-900">
            {isPlaying ? 'Narrating checkpoint...' : isPaused ? 'Narration paused' : 'Listen to this lesson'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Play / Pause button */}
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {isPaused ? 'Resume' : 'Listen'}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 fill-white" />
            Pause
          </button>
        )}

        {/* Stop button */}
        {(isPlaying || isPaused) && (
          <button
            onClick={stop}
            title="Stop narration"
            className="p-2 rounded-xl text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-gray-700" />
          </button>
        )}

        {/* Speed toggle */}
        <button
          onClick={handleSpeedToggle}
          title="Playback speed"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
        >
          <Gauge className="w-3 h-3" />
          {speed}x
        </button>
      </div>
    </div>
  );
}
