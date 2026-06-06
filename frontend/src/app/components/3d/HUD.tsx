// ─────────────────────────────────────────────────────
// HUD.tsx — Heads-up-display overlays (crosshair, controls, audio)
// ─────────────────────────────────────────────────────
import { motion, AnimatePresence } from "motion/react";
import {
  Leaf,
  Volume2,
  VolumeOff,
  Map,
  MousePointerClick,
  Home,
  Maximize,
  Minimize,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from 'react';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MobileJoystick } from './MobileJoystick';

interface HUDProps {
  isLocked: boolean;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  plantCount: number;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  cameraMode: 'fps' | 'orbit';
  onToggleCameraMode: () => void;
  onViewFullGarden?: () => void;
}

export function HUD({
  isLocked,
  showMinimap,
  onToggleMinimap,
  plantCount,
  audioEnabled,
  onToggleAudio,
  cameraMode,
  onToggleCameraMode,
  onViewFullGarden,
}: HUDProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const docEl = document.documentElement as any;
    const doc = document as any;

    if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch((err: Error) => console.error(err));
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  return (
    <>
      {/* Crosshair — visible only when pointer-locked */}
      {isLocked && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 45,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              border: "2px solid rgba(255,255,255,0.6)",
              borderRadius: "50%",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.8)",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        </div>
      )}

      {/* Top-left header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring" }}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            textDecoration: "none",
          }}
        >
          <Home size={18} />
        </Link>
        <div
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(16px)",
            borderRadius: 16,
            padding: "12px 20px",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 8,
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <Leaf size={20} />
            Virtual Herbal Garden
          </h1>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 11,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {plantCount} medicinal plants to explore
          </p>
        </div>
      </motion.div>

      {/* Top-right buttons */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 40,
          display: "flex",
          gap: 8,
        }}
      >
        {/* Time Indicator */}
        <div
          data-testid="time-indicator"
          style={{
            height: 40,
            padding: '0 16px',
            borderRadius: 12,
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            fontWeight: "bold",
            fontSize: 14,
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
          }}
        >
          <GameClock />
        </div>

        {/* Audio toggle */}
        <button
          onClick={onToggleAudio}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: audioEnabled ? "rgba(76,175,80,0.4)" : "rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          title={audioEnabled ? "Mute Ambient Sounds" : "Enable Ambient Sounds"}
        >
          {audioEnabled ? <Volume2 size={18} /> : <VolumeOff size={18} />}
        </button>

        {/* Minimap toggle */}
        <button
          onClick={onToggleMinimap}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: showMinimap ? "rgba(76,175,80,0.4)" : "rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          title="Toggle Minimap"
        >
          <Map size={18} />
        </button>

        {/* Fullscreen toggle */}
        <button
          data-testid="fullscreen-toggle"
          onClick={toggleFullscreen}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: isFullscreen ? "rgba(76,175,80,0.4)" : "rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>

        {/* Camera mode toggle */}
        <button
          onClick={onViewFullGarden}
          className="flex flex-col items-center justify-center p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
          title="View Full Garden"
        >
          <Map className="w-5 h-5 mb-1 text-green-400" />
          <span className="text-[10px] font-bold tracking-wider">MAP</span>
        </button>

        <button
          onClick={onToggleCameraMode}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: cameraMode === 'orbit' ? "rgba(76,175,80,0.4)" : "rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          title={cameraMode === 'orbit' ? "Switch to FPS Mode" : "Switch to Orbit Mode"}
        >
          <span style={{ fontWeight: 'bold', fontSize: 12 }}>
            {cameraMode === 'orbit' ? 'ORB' : 'FPS'}
          </span>
        </button>
      </motion.div>

      {/* Click-to-start prompt */}
      <AnimatePresence>
        {!isLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 50,
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(20px)",
                borderRadius: 24,
                padding: "32px 48px",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 16px 64px rgba(0,0,0,0.4)",
              }}
            >
              <MousePointerClick
                size={40}
                style={{ color: "#81c784", marginBottom: 12 }}
              />
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "white",
                  margin: "0 0 8px",
                }}
              >
                Click to Enter the Garden
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>
                Use <kbd style={kbdStyle}>W</kbd> <kbd style={kbdStyle}>A</kbd>{" "}
                <kbd style={kbdStyle}>S</kbd> <kbd style={kbdStyle}>D</kbd> to move
                &nbsp;·&nbsp; Mouse to look &nbsp;·&nbsp;{" "}
                <kbd style={kbdStyle}>ESC</kbd> to unlock
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls hint when locked */}
      {isLocked && !isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 40,
            display: "flex",
            gap: 8,
            alignItems: "center",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: 12,
            padding: "8px 16px",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <kbd style={kbdStyle}>WASD</kbd> Move&nbsp;&nbsp;·&nbsp;&nbsp;
          <kbd style={kbdStyle}>Mouse</kbd> Look&nbsp;&nbsp;·&nbsp;&nbsp;
          <kbd style={kbdStyle}>ESC</kbd> Unlock&nbsp;&nbsp;·&nbsp;&nbsp;
          Click plants to inspect
        </motion.div>
      )}

      {/* Mobile Joystick */}
      {isMobile && <MobileJoystick />}
    </>
  );
}

const kbdStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 6px",
  borderRadius: 4,
  background: "rgba(255,255,255,0.15)",
  border: "1px solid rgba(255,255,255,0.2)",
  fontSize: 11,
  fontFamily: "monospace",
  color: "rgba(255,255,255,0.8)",
};

// Internal component for the clock to avoid re-rendering the whole HUD

function GameClock() {
  const [timeStr, setTimeStr] = useState("12:00 PM");

  useEffect(() => {
    const startTime = performance.now();
    let frameId: number;

    const tick = () => {
      const elapsedSec = (performance.now() - startTime) / 1000;
      // 120 seconds cycle. 0 = noon (12:00)
      const cycle = (elapsedSec % 120) / 120;
      // 0 -> 12:00 PM
      // 0.25 -> 6:00 PM
      // 0.5 -> 12:00 AM
      // 0.75 -> 6:00 AM
      let hoursFloat = (cycle * 24 + 12) % 24;
      
      const h = Math.floor(hoursFloat);
      const m = Math.floor((hoursFloat - h) * 60);
      
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayM = m.toString().padStart(2, '0');
      
      setTimeStr(`${displayH}:${displayM} ${ampm}`);
      frameId = requestAnimationFrame(tick);
    };
    
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return <span>{timeStr}</span>;
}
