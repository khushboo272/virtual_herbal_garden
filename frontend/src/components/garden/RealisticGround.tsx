// ─────────────────────────────────────────────────────
// RealisticGround.tsx — PBR textured ground plane
// Uses procedural textures (replaceable with real files)
// ─────────────────────────────────────────────────────
import { useMemo } from 'react';
import * as THREE from 'three';

/* ── Procedural PBR Texture Generator ─────────────── */

function generateTexture(type: 'color' | 'normal' | 'roughness', size = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  if (type === 'color') {
    // Base gradient (dark → medium green)
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.7);
    grad.addColorStop(0, '#3d7a2a');
    grad.addColorStop(0.5, '#2f6420');
    grad.addColorStop(1, '#2a5a1c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Large patches of color variance
    for (let i = 0; i < 50; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const r = 40 + Math.random() * 100;
      const isLush = Math.random() > 0.3;
      ctx.fillStyle = isLush
        ? `hsla(${100 + Math.random() * 25}, ${45 + Math.random() * 20}%, ${22 + Math.random() * 10}%, 0.25)`
        : `hsla(${35 + Math.random() * 15}, ${20 + Math.random() * 15}%, ${22 + Math.random() * 10}%, 0.15)`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grass blade strokes
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const bladeLen = 4 + Math.random() * 12;
      const bladeW = 0.5 + Math.random() * 1.5;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
      const h = 90 + Math.random() * 40;
      const s = 35 + Math.random() * 35;
      const l = 15 + Math.random() * 25;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
      ctx.fillRect(-bladeW / 2, 0, bladeW, bladeLen);
      ctx.restore();
    }

    // Clover / moss patches
    for (let i = 0; i < 30; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const r = 8 + Math.random() * 18;
      ctx.fillStyle = `hsla(135, 40%, ${18 + Math.random() * 10}%, 0.3)`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'normal') {
    // Neutral base
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, size, size);

    // Blade-shaped perturbations
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = 3 + Math.random() * 8;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      const nx = 118 + Math.random() * 20;
      const ny = 118 + Math.random() * 20;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = `rgba(${nx}, ${ny}, 240, 0.3)`;
      ctx.fillRect(-0.5, 0, 1, len);
      ctx.restore();
    }

    // Broader terrain undulation bumps
    for (let i = 0; i < 60; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const r = 15 + Math.random() * 40;
      const nx = 115 + Math.random() * 26;
      const ny = 115 + Math.random() * 26;
      ctx.fillStyle = `rgba(${nx}, ${ny}, 235, 0.12)`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Roughness — mostly high (matte grass)
    ctx.fillStyle = 'rgb(210, 210, 210)';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const v = 180 + Math.random() * 60;
      ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
      ctx.fillRect(x, y, 3 + Math.random() * 6, 3 + Math.random() * 6);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(40, 40);
  tex.colorSpace = type === 'color' ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/* ── RealisticGround Component ────────────────────── */

interface RealisticGroundProps {
  onPointerMove?: (e: any) => void;
  onClick?: (e: any) => void;
}

export function RealisticGround({ onPointerMove, onClick }: RealisticGroundProps) {
  const { colorMap, normalMap, roughnessMap } = useMemo(() => ({
    colorMap: generateTexture('color'),
    normalMap: generateTexture('normal'),
    roughnessMap: generateTexture('roughness'),
  }), []);

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.01, 0]} 
      receiveShadow
      onPointerMove={onPointerMove}
      onClick={onClick}
    >
      <planeGeometry args={[200, 200, 64, 64]} />
      <meshStandardMaterial
        map={colorMap}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.35, 0.35)}
        roughnessMap={roughnessMap}
        roughness={0.9}
        metalness={0}
        envMapIntensity={0.2}
      />
    </mesh>
  );
}
