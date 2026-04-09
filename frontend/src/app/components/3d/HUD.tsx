// ─────────────────────────────────────────────────────
// HUD.tsx — Heads-up-display overlays (crosshair, controls hint)
// ─────────────────────────────────────────────────────
import { motion, AnimatePresence } from "motion/react";
import {
  Leaf,
  Volume2,
  VolumeOff,
  Map,
  ArrowLeft,
  MousePointerClick,
  Info,
  Home,
} from "lucide-react";
import { Link } from "react-router-dom";

interface HUDProps {
  isLocked: boolean;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  plantCount: number;
}

export function HUD({ isLocked, showMinimap, onToggleMinimap, plantCount }: HUDProps) {
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
          }}
          title="Toggle Minimap"
        >
          <Map size={18} />
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
      {isLocked && (
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
