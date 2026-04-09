// ─────────────────────────────────────────────────────
// River.tsx — Animated water plane
// ─────────────────────────────────────────────────────
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function River() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color("#2196f3") },
      uColor2: { value: new THREE.Color("#1565c0") },
      uOpacity: { value: 0.75 },
    }),
    [],
  );

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        side: THREE.DoubleSide,
        vertexShader: /* glsl */ `
          uniform float uTime;
          varying vec2 vUv;
          varying float vWave;

          void main() {
            vUv = uv;
            vec3 pos = position;
            float wave = sin(pos.x * 2.0 + uTime * 1.5) * 0.08
                       + cos(pos.y * 3.0 + uTime * 1.2) * 0.05;
            pos.z += wave;
            vWave = wave;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform float uOpacity;
          uniform float uTime;
          varying vec2 vUv;
          varying float vWave;

          void main() {
            float t = sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5;
            vec3 color = mix(uColor1, uColor2, t + vWave * 2.0);
            // Fresnel-like edge brightening
            float edge = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
            color += vec3(0.15) * (1.0 - edge);
            gl_FragColor = vec4(color, uOpacity * edge * 0.9 + 0.1);
          }
        `,
      }),
    [uniforms],
  );

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 25]}
      material={shaderMaterial}
    >
      <planeGeometry args={[100, 6, 64, 16]} />
    </mesh>
  );
}
