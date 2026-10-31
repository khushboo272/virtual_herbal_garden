// ──────────────────────────────────────────────────────────
// components/DebugOverlay.tsx — Garden Performance & Pipeline Monitor
// Enabled via ?debug=1 in URL: FPS, draw calls, triangles, counts
// ──────────────────────────────────────────────────────────
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFrame, useThree } from '@react-three/fiber';
import type { SceneMetrics } from '../types';

interface DebugOverlayProps {
  metrics: SceneMetrics;
}

/**
 * Three.js inside-Canvas metrics collector
 */
export function SceneMetricsCollector({
  onMetricsUpdate,
  realCount,
  placeholderCount,
  qualityTier,
}: {
  onMetricsUpdate: (metrics: Partial<SceneMetrics>) => void;
  realCount: number;
  placeholderCount: number;
  qualityTier: 'low' | 'medium' | 'high';
}) {
  const { gl } = useThree();
  const frames = useRef(0);
  const prevTime = useRef(performance.now());

  useFrame(() => {
    frames.current++;
    const now = performance.now();
    if (now >= prevTime.current + 500) {
      const fps = Math.round((frames.current * 1000) / (now - prevTime.current));
      frames.current = 0;
      prevTime.current = now;

      onMetricsUpdate({
        fps,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        qualityTier,
        realModelCount: realCount,
        placeholderCount: placeholderCount,
        totalPlants: realCount + placeholderCount,
      });
    }
  });

  return null;
}

/**
 * UI HTML Component
 */
export function DebugOverlay({ metrics }: DebugOverlayProps) {
  const [searchParams] = useSearchParams();
  const isDebug = searchParams.get('debug') === '1' || searchParams.has('debug');

  if (!isDebug) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: 10,
        padding: '12px 18px',
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 1.6,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 'bold', color: '#10b981', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
        3D Garden Engine Monitor
      </div>
      <div>FPS: <strong style={{ color: metrics.fps < 30 ? '#ef4444' : '#10b981' }}>{metrics.fps}</strong></div>
      <div>Draw Calls: <strong>{metrics.drawCalls}</strong></div>
      <div>Triangles: <strong>{metrics.triangles.toLocaleString()}</strong></div>
      <div>Quality Tier: <strong style={{ textTransform: 'uppercase' }}>{metrics.qualityTier}</strong></div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '6px 0' }} />
      <div>Real GLB Models: <strong style={{ color: '#38bdf8' }}>{metrics.realModelCount}</strong></div>
      <div>Procedural Plants: <strong style={{ color: '#fbbf24' }}>{metrics.placeholderCount}</strong></div>
      <div>Total Database Plants: <strong>{metrics.totalPlants}</strong></div>
    </div>
  );
}

