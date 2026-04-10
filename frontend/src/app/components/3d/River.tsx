// ─────────────────────────────────────────────────────
// River.tsx — Realistic water shader with fresnel,
// dual-layer normals, specular highlights, caustics
// ─────────────────────────────────────────────────────
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ── Procedural Water Normal Map ──────────────────── */

function generateWaterNormalMap(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Base neutral normal
  ctx.fillStyle = "rgb(127, 127, 255)";
  ctx.fillRect(0, 0, size, size);

  // Ripple patterns — concentric disturbances
  for (let i = 0; i < 40; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const maxR = 20 + Math.random() * 40;
    for (let r = 0; r < maxR; r += 2) {
      const angle = (r / maxR) * Math.PI * 4;
      const nx = 127 + Math.sin(angle) * 30;
      const ny = 127 + Math.cos(angle) * 30;
      ctx.strokeStyle = `rgba(${nx}, ${ny}, 235, 0.15)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Fine ripple noise
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const nx = 118 + Math.random() * 18;
    const ny = 118 + Math.random() * 18;
    ctx.fillStyle = `rgba(${nx}, ${ny}, 245, 0.2)`;
    ctx.fillRect(x, y, 1, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.needsUpdate = true;
  return tex;
}

/* ── Water Vertex Shader ──────────────────────────── */

const waterVertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Multi-frequency waves for realism
    float wave1 = sin(pos.x * 1.5 + uTime * 1.2) * 0.06;
    float wave2 = cos(pos.y * 2.0 + uTime * 0.8) * 0.04;
    float wave3 = sin(pos.x * 3.0 + pos.y * 2.5 + uTime * 1.8) * 0.025;
    float wave4 = cos(pos.x * 0.5 + uTime * 0.5) * 0.08;

    float totalWave = wave1 + wave2 + wave3 + wave4;
    pos.z += totalWave;
    vWave = totalWave;

    // Compute displaced normal
    float dx = cos(pos.x * 1.5 + uTime * 1.2) * 1.5 * 0.06
             + cos(pos.x * 3.0 + pos.y * 2.5 + uTime * 1.8) * 3.0 * 0.025
             + cos(pos.x * 0.5 + uTime * 0.5) * 0.5 * 0.08;
    float dy = -sin(pos.y * 2.0 + uTime * 0.8) * 2.0 * 0.04
             + cos(pos.x * 3.0 + pos.y * 2.5 + uTime * 1.8) * 2.5 * 0.025;
    vNormal = normalize(vec3(-dx, -dy, 1.0));

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

/* ── Water Fragment Shader ────────────────────────── */

const waterFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uFoamColor;
  uniform vec3 uSunDirection;
  uniform vec3 uCameraPos;
  uniform sampler2D uNormalMap;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWave;

  void main() {
    // Animated UV for normal map sampling
    vec2 uv1 = vUv * 3.0 + vec2(uTime * 0.03, uTime * 0.02);
    vec2 uv2 = vUv * 5.0 + vec2(-uTime * 0.02, uTime * 0.04);

    // Dual-layer normal perturbation
    vec3 n1 = texture2D(uNormalMap, uv1).rgb * 2.0 - 1.0;
    vec3 n2 = texture2D(uNormalMap, uv2).rgb * 2.0 - 1.0;
    vec3 perturbedNormal = normalize(vNormal + (n1 + n2) * 0.15);

    // View direction
    vec3 viewDir = normalize(uCameraPos - vWorldPosition);

    // Fresnel — more transparent when looking straight down
    float fresnel = pow(1.0 - max(dot(viewDir, perturbedNormal), 0.0), 3.0);
    fresnel = clamp(fresnel, 0.15, 0.85);

    // Depth-based coloring (edge vs center)
    float edgeFade = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
    vec3 waterColor = mix(uShallowColor, uDeepColor, edgeFade * 0.7 + fresnel * 0.3);

    // Specular sun reflection
    vec3 halfDir = normalize(uSunDirection + viewDir);
    float spec = pow(max(dot(perturbedNormal, halfDir), 0.0), 128.0);
    vec3 specular = vec3(1.0, 0.95, 0.85) * spec * 1.5;

    // Caustic patterns
    float caustic = sin(vWorldPosition.x * 4.0 + uTime * 2.0)
                  * cos(vWorldPosition.z * 3.0 + uTime * 1.5);
    caustic = pow(abs(caustic), 3.0) * 0.15;

    // Subtle foam at edges
    float foam = (1.0 - edgeFade) * 0.3;
    waterColor = mix(waterColor, uFoamColor, foam);

    // Combine
    vec3 finalColor = waterColor + specular + vec3(caustic * 0.5);

    // Opacity — transparent at edges, opaque in center
    float alpha = 0.55 + edgeFade * 0.3 + fresnel * 0.1;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

/* ── River Component ──────────────────────────────── */

export function River() {
  const meshRef = useRef<THREE.Mesh>(null);

  const normalMap = useMemo(() => generateWaterNormalMap(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color("#0d4f6b") },
      uShallowColor: { value: new THREE.Color("#2ba6cb") },
      uFoamColor: { value: new THREE.Color("#d4eaf7") },
      uSunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
      uCameraPos: { value: new THREE.Vector3() },
      uNormalMap: { value: normalMap },
    }),
    [normalMap],
  );

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        vertexShader: waterVertexShader,
        fragmentShader: waterFragmentShader,
      }),
    [uniforms],
  );

  useFrame(({ clock, camera }) => {
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uCameraPos.value.copy(camera.position);
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 25]}
      material={shaderMaterial}
    >
      <planeGeometry args={[100, 6, 128, 32]} />
    </mesh>
  );
}
