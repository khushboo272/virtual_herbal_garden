// ──────────────────────────────────────────────────────────
// utils/leafCardGenerator.ts — Procedural Leaf Alpha Texture Generator
// Canvas-generated cutout textures for botanical leaf shapes
// ──────────────────────────────────────────────────────────
import * as THREE from 'three';
import type { LeafShape } from '../types';
import { GARDEN_CONFIG } from '../gardenConfig';

const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Seeded PRNG (Linear Congruential Generator / Mulberry32)
 */
export function createSeededRandom(seedStr: string): () => number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  let s = Math.abs(hash) + 1;

  return function next() {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates or retrieves a cached CanvasTexture with alpha cutout for leafShape.
 */
export function getProceduralLeafTexture(
  shape: LeafShape = 'OVATE',
  colorHex: string = '#2d7a3a'
): THREE.CanvasTexture {
  const cacheKey = `${shape}_${colorHex}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  // Check if we are running in a headless or browser environment
  if (typeof document === 'undefined') {
    // Vitest/SSR fallback: mock texture
    const dummy = new THREE.CanvasTexture({} as any);
    textureCache.set(cacheKey, dummy);
    return dummy;
  }

  const res = GARDEN_CONFIG.procedural.leafAlphaTextureResolution;
  const canvas = document.createElement('canvas');
  canvas.width = res;
  canvas.height = res;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const dummy = new THREE.CanvasTexture(canvas);
    return dummy;
  }

  ctx.clearRect(0, 0, res, res);
  const cx = res / 2;
  const cy = res / 2;

  ctx.fillStyle = colorHex;
  ctx.strokeStyle = new THREE.Color(colorHex).multiplyScalar(0.7).getStyle();
  ctx.lineWidth = Math.max(1, res * 0.02);

  ctx.beginPath();

  switch (shape) {
    case 'LANCEOLATE': {
      // Long, narrow, pointed at both ends
      ctx.moveTo(cx, res * 0.05);
      ctx.bezierCurveTo(cx + res * 0.22, res * 0.35, cx + res * 0.2, res * 0.7, cx, res * 0.95);
      ctx.bezierCurveTo(cx - res * 0.2, res * 0.7, cx - res * 0.22, res * 0.35, cx, res * 0.05);
      break;
    }
    case 'HEART': {
      // Cordate / heart shape
      ctx.moveTo(cx, res * 0.88);
      ctx.bezierCurveTo(cx + res * 0.45, res * 0.55, cx + res * 0.4, res * 0.12, cx, res * 0.35);
      ctx.bezierCurveTo(cx - res * 0.4, res * 0.12, cx - res * 0.45, res * 0.55, cx, res * 0.88);
      break;
    }
    case 'PINNATE': {
      // Multi-leaflet compound leaf silhouette
      ctx.moveTo(cx, res * 0.08);
      for (let i = 0; i < 4; i++) {
        const y = res * (0.2 + i * 0.18);
        ctx.lineTo(cx + res * 0.32, y - res * 0.04);
        ctx.lineTo(cx + res * 0.08, y + res * 0.05);
      }
      ctx.lineTo(cx, res * 0.92);
      for (let i = 3; i >= 0; i--) {
        const y = res * (0.2 + i * 0.18);
        ctx.lineTo(cx - res * 0.08, y + res * 0.05);
        ctx.lineTo(cx - res * 0.32, y - res * 0.04);
      }
      break;
    }
    case 'SPIKY': {
      // Sharp succulent blade / needle
      ctx.moveTo(cx, res * 0.05);
      ctx.lineTo(cx + res * 0.15, res * 0.92);
      ctx.lineTo(cx - res * 0.15, res * 0.92);
      break;
    }
    case 'ROUND': {
      // Circular / peltate
      ctx.arc(cx, cy, res * 0.42, 0, Math.PI * 2);
      break;
    }
    case 'OVATE':
    default: {
      // Classic egg-shaped botanical leaf
      ctx.moveTo(cx, res * 0.08);
      ctx.bezierCurveTo(cx + res * 0.35, res * 0.3, cx + res * 0.3, res * 0.72, cx, res * 0.92);
      ctx.bezierCurveTo(cx - res * 0.3, res * 0.72, cx - res * 0.35, res * 0.3, cx, res * 0.08);
      break;
    }
  }

  ctx.closePath();
  ctx.fill();

  // Leaf central vein
  ctx.beginPath();
  ctx.moveTo(cx, res * 0.12);
  ctx.lineTo(cx, res * 0.9);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Dispose all cached canvas textures on cleanup
 */
export function clearLeafTextureCache(): void {
  for (const tex of textureCache.values()) {
    tex.dispose();
  }
  textureCache.clear();
}

