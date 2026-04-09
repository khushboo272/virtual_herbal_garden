// ─────────────────────────────────────────────────────
// Scene.tsx — Top-level 3D scene composition
// Lights, sky gradient, fog, ground plane
// Uses only raw Three.js — no drei imports to avoid
// pulling in troika-three-text (woff2 crash)
// ─────────────────────────────────────────────────────
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function Scene() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  // Slow day/night cycle
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const cycle = ((t % 120) / 120);

    if (dirLightRef.current) {
      const intensity = Math.max(0.3, Math.sin(cycle * Math.PI));
      dirLightRef.current.intensity = intensity * 1.5;
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} color="#b8d4e8" />
      <directionalLight
        ref={dirLightRef}
        position={[10, 15, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight args={["#87CEEB", "#3d5c1e", 0.6]} />

      {/* Fog */}
      <fog attach="fog" args={["#c8e6c9", 30, 80]} />

      {/* Sky sphere — gradient from blue to light horizon */}
      <SkyDome />

      {/* Ground plane */}
      <Ground />
    </>
  );
}

/** Simple sky dome rendered as a huge inverted sphere with a gradient shader */
function SkyDome() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color("#1e88e5") },
        bottomColor: { value: new THREE.Color("#bbdefb") },
        offset: { value: 20 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh material={material}>
      <sphereGeometry args={[150, 32, 15]} />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <planeGeometry args={[200, 200, 64, 64]} />
      <meshStandardMaterial
        color="#4a7c2e"
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}
