// ─────────────────────────────────────────────────────
// Scene.tsx — Realistic scene composition
// Environment IBL, Sky, natural lighting, PBR ground
// ─────────────────────────────────────────────────────
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Environment } from "@react-three/drei";
import * as THREE from "three";

/* ══════════════════════════════════════════════════════
   Realistic Grass Texture Generator
   Uses layered brush strokes to simulate real grass
   instead of random pixel noise
   ══════════════════════════════════════════════════════ */

function generateGrassTexture(
  type: "color" | "normal" | "roughness",
  size = 1024
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  if (type === "color") {
    // --- Base gradient (dark → medium green) ---
    const grad = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size * 0.7,
    );
    grad.addColorStop(0, "#3d7a2a");
    grad.addColorStop(0.5, "#2f6420");
    grad.addColorStop(1, "#2a5a1c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // --- Large patches of color variance (soil + lush areas) ---
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

    // --- Grass blade strokes (vertical brush marks) ---
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

    // --- Clover / moss patches ---
    for (let i = 0; i < 30; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const r = 8 + Math.random() * 18;
      ctx.fillStyle = `hsla(135, 40%, ${18 + Math.random() * 10}%, 0.3)`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Small dirt specks ---
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = `hsla(30, 25%, ${20 + Math.random() * 12}%, 0.2)`;
      ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }

  } else if (type === "normal") {
    // Neutral base
    ctx.fillStyle = "rgb(128, 128, 255)";
    ctx.fillRect(0, 0, size, size);

    // Simulate blade-shaped perturbations
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
    // Roughness — mostly high (matte grass) with subtle variation
    ctx.fillStyle = "rgb(210, 210, 210)";
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const v = 180 + Math.random() * 60;
      ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
      ctx.fillRect(x, y, 3 + Math.random() * 6, 3 + Math.random() * 6);
    }

    // Some smoother patches (compacted earth)
    for (let i = 0; i < 30; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const r = 10 + Math.random() * 25;
      ctx.fillStyle = `rgba(150, 150, 150, 0.3)`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // Use lower tiling with large texture to reduce visible repetition
  tex.repeat.set(10, 10);
  tex.colorSpace = type === "color" ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/* ══════════════════════════════════════════════════════
   Main Scene Component
   ══════════════════════════════════════════════════════ */

export function Scene() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  // Gentle day cycle — keep intensity natural
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const cycle = (t % 120) / 120;

    if (dirLightRef.current) {
      const base = Math.max(0.5, Math.sin(cycle * Math.PI));
      dirLightRef.current.intensity = base * 1.0;
    }
  });

  return (
    <>
      {/* ─── Environment — forest IBL for realistic ambient ─── */}
      <Environment
        preset="forest"
        background={false}
        environmentIntensity={0.35}
      />

      {/* ─── Sky — physical sun/atmosphere ─── */}
      <Sky
        distance={450000}
        sunPosition={[60, 30, -40]}
        rayleigh={0.5}
        turbidity={4}
        mieCoefficient={0.002}
        mieDirectionalG={0.7}
      />

      {/* ─── Fog — soft blue atmospheric perspective ─── */}
      <fog attach="fog" args={["#b0c8d8", 30, 85]} />

      {/* ─── Lighting ─── */}

      {/* Sun — warm, moderate, soft shadows */}
      <directionalLight
        ref={dirLightRef}
        position={[12, 18, 8]}
        intensity={1.0}
        color="#ffecd2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.06}
        shadow-radius={6}
        shadow-camera-far={55}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
      />

      {/* Cool fill from opposite side (skylight bounce) */}
      <directionalLight
        position={[-8, 6, -12]}
        intensity={0.15}
        color="#a0c0e0"
      />

      {/* Sky/ground hemisphere for natural color bleed */}
      <hemisphereLight args={["#8ec8e8", "#4a6b30", 0.3]} />

      {/* Low ambient so shadows read properly */}
      <ambientLight intensity={0.1} color="#d8d0c0" />

      {/* ─── Ground ─── */}
      <PBRGround />
    </>
  );
}

/* ══════════════════════════════════════════════════════
   PBR Ground — realistic grass with proper texture
   ══════════════════════════════════════════════════════ */

function PBRGround() {
  const { colorMap, normalMap, roughnessMap } = useMemo(() => {
    return {
      colorMap: generateGrassTexture("color"),
      normalMap: generateGrassTexture("normal"),
      roughnessMap: generateGrassTexture("roughness"),
    };
  }, []);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
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
