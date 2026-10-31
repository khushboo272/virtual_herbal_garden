// ──────────────────────────────────────────────────────────
// components/GardenPond.tsx — Landscaped Pond, Rock Waterfall & Wetland Flora
// Custom procedural water shader, Gerstner ripples, soft foam, lily pads & reeds
// ──────────────────────────────────────────────────────────
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { GARDEN_CONFIG } from '../gardenConfig';
import { getGroundY } from '../utils/terrainGenerator';

interface GardenPondProps {
  reducedMotion?: boolean;
}

export function GardenPond({ reducedMotion = false }: GardenPondProps) {
  const waterMeshRef = useRef<THREE.Mesh>(null);
  const splashParticlesRef = useRef<THREE.Points>(null);

  const [px, , pz] = GARDEN_CONFIG.terrain.pondCenter;
  const radius = GARDEN_CONFIG.terrain.pondRadius;
  const waterLevel = GARDEN_CONFIG.water.waterLevel;

  // Custom procedural water shader material
  const waterMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorShallow: { value: new THREE.Color(GARDEN_CONFIG.water.waterShallowColor) },
        uColorDeep: { value: new THREE.Color(GARDEN_CONFIG.water.waterColor) },
        uFoamColor: { value: new THREE.Color(GARDEN_CONFIG.water.foamColor) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        uniform float uTime;

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Gentle ripples on surface
          float w1 = sin(pos.x * 2.2 + uTime * 1.5) * 0.025;
          float w2 = cos(pos.y * 2.8 + uTime * 1.2) * 0.025;
          pos.z += w1 + w2;

          vNormal = normalize(vec3(w1 * 2.0, w2 * 2.0, 1.0));
          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        uniform vec3 uColorShallow;
        uniform vec3 uColorDeep;
        uniform vec3 uFoamColor;
        uniform float uTime;

        void main() {
          // Distance from pond center (0.0 at center, 1.0 at shore)
          float dist = length(vUv - vec2(0.5)) * 2.0;

          // Deep to shallow gradient
          vec3 waterCol = mix(uColorDeep, uColorShallow, smoothstep(0.2, 0.9, dist));

          // Fresnel reflectance
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 3.0);
          vec3 skyReflect = vec3(0.65, 0.85, 0.95);
          waterCol = mix(waterCol, skyReflect, fresnel * 0.45);

          // Soft shore foam edge
          float foam = smoothstep(0.88, 0.98, dist) * (0.5 + 0.5 * sin(uTime * 3.0 + dist * 20.0));
          waterCol = mix(waterCol, uFoamColor, foam * 0.6);

          float alpha = mix(0.92, 0.65, smoothstep(0.7, 1.0, dist));
          gl_FragColor = vec4(waterCol, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  // Stone rim around the pond perimeter
  const stoneRim = useMemo(() => {
    const list: JSX.Element[] = [];
    const count = 38;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius * (0.95 + (Math.sin(angle * 5) * 0.05));
      const sx = px + Math.cos(angle) * r;
      const sz = pz + Math.sin(angle) * r;
      const sy = getGroundY(sx, sz);

      list.push(
        <mesh
          key={`rim-stone-${i}`}
          position={[sx, sy + 0.1, sz]}
          rotation={[Math.sin(i) * 0.3, angle, Math.cos(i) * 0.3]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[0.45 + (i % 3) * 0.12, 7, 6]} />
          <meshStandardMaterial color="#64748b" roughness={0.88} />
        </mesh>
      );
    }
    return list;
  }, [px, pz, radius]);

  // Instanced Water Lily Pads with floating lotus blooms
  const lilyPads = useMemo(() => {
    const list: JSX.Element[] = [];
    const offsets = [
      [-2.4, -1.8], [-1.8, -2.5], [-2.8, -2.1],
      [2.2, 1.5], [1.7, 2.4], [2.8, 1.9],
      [-1.5, 2.6], [-2.1, 2.2],
    ];

    offsets.forEach(([ox, oz], i) => {
      list.push(
        <group key={`lily-${i}`} position={[px + ox, waterLevel + 0.015, pz + oz]}>
          {/* Circular green pad */}
          <mesh rotation={[-Math.PI / 2, 0, (i * 1.2)]}>
            <circleGeometry args={[0.38, 16]} />
            <meshStandardMaterial color="#15803d" roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
          {/* Lotus flower */}
          {i % 2 === 0 && (
            <mesh position={[0, 0.08, 0]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshStandardMaterial color="#f472b6" roughness={0.4} />
            </mesh>
          )}
        </group>
      );
    });
    return list;
  }, [px, pz, waterLevel]);

  // Waterfall rock ledge and cascading sheet
  const [wfx, wfy, wfz] = GARDEN_CONFIG.water.waterfallPosition;

  useFrame(({ clock }) => {
    if (waterMaterial) {
      waterMaterial.uniforms.uTime.value = clock.getElapsedTime() * GARDEN_CONFIG.water.distortionSpeed;
    }
  });

  return (
    <group>
      {/* Horizontal Water Surface Disk */}
      <mesh
        ref={waterMeshRef}
        position={[px, waterLevel, pz]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={waterMaterial}
      >
        <circleGeometry args={[radius, 48]} />
      </mesh>

      {/* Decorative Stone Rim */}
      {stoneRim}

      {/* Floating Lily Pads */}
      {lilyPads}

      {/* Waterfall Rock Outcrop */}
      <group position={[wfx, wfy, wfz]}>
        {/* Tiered cascading boulders */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 1.6, 2.4]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
        <mesh position={[-0.8, -0.9, -0.6]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 1.4, 2.0]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>

        {/* Cascading Water Curtain */}
        <mesh position={[-0.7, -1.1, -0.9]} rotation={[0.4, -0.7, 0]}>
          <planeGeometry args={[1.6, 2.6]} />
          <meshStandardMaterial
            color="#e0f7fa"
            transparent
            opacity={0.7}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Collider preventing walking into deep water */}
      <RigidBody type="fixed" colliders="trimesh">
        <mesh position={[px, waterLevel - 0.5, pz]} visible={false}>
          <cylinderGeometry args={[radius * 0.88, radius * 0.88, 2.0, 24]} />
          <meshBasicMaterial side={THREE.DoubleSide} />
        </mesh>
      </RigidBody>
    </group>
  );
}

