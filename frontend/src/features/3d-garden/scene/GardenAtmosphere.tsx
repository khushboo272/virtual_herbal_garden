// ──────────────────────────────────────────────────────────
// scene/GardenAtmosphere.tsx — Diurnal Sky, Sun, Lightformers & Night Fireflies
// Driven by visitor time or time-of-day slider; procedural lighting, zero CDN presets
// ──────────────────────────────────────────────────────────
import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { GARDEN_CONFIG } from '../gardenConfig';
import { getGroundY } from '../utils/terrainGenerator';

interface GardenAtmosphereProps {
  timeOfDayHours?: number; // 0.0 to 24.0 (e.g. 14.5 = 2:30 PM)
  shadowsEnabled?: boolean;
  shadowMapSize?: number;
  shadowDistance?: number;
}

export function GardenAtmosphere({
  timeOfDayHours = 12.0,
  shadowsEnabled = true,
  shadowMapSize = 2048,
  shadowDistance = 75,
}: GardenAtmosphereProps) {
  const { camera, scene, gl } = useThree();
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const firefliesRef = useRef<THREE.InstancedMesh>(null);

  // Convert 0-24 hours into radians: 12:00 = 0 (high noon), 00:00 = PI (midnight)
  const sunAngle = ((timeOfDayHours - 12) / 24) * Math.PI * 2;
  const isNight = timeOfDayHours < 5.5 || timeOfDayHours > 19.5;
  const isDuskDawn = (timeOfDayHours >= 5.5 && timeOfDayHours <= 7.0) || (timeOfDayHours >= 17.5 && timeOfDayHours <= 19.5);

  const sunDistance = GARDEN_CONFIG.atmosphere.sunDistance;
  const sunY = Math.cos(sunAngle) * sunDistance;
  const sunZ = Math.sin(sunAngle) * sunDistance;

  // Diurnal lighting colors and intensities
  const { sunColor, sunIntensity, hemiSkyColor, hemiGroundColor, fogColor, exposure } = useMemo(() => {
    if (isNight) {
      return {
        sunColor: new THREE.Color('#38bdf8'), // Cool moonlight
        sunIntensity: 0.12,
        hemiSkyColor: new THREE.Color('#030712'),
        hemiGroundColor: new THREE.Color('#020617'),
        fogColor: new THREE.Color(GARDEN_CONFIG.atmosphere.fogColorNight),
        exposure: 0.75,
      };
    }

    if (isDuskDawn) {
      return {
        sunColor: new THREE.Color('#f97316'), // Warm golden hour
        sunIntensity: 1.8,
        hemiSkyColor: new THREE.Color('#fb923c'),
        hemiGroundColor: new THREE.Color('#292524'),
        fogColor: new THREE.Color('#fde68a'),
        exposure: 1.1,
      };
    }

    // High noon
    return {
      sunColor: new THREE.Color('#fffbeb'), // Pure daylight
      sunIntensity: 2.2,
      hemiSkyColor: new THREE.Color('#bae6fd'),
      hemiGroundColor: new THREE.Color('#166534'),
      fogColor: new THREE.Color(GARDEN_CONFIG.atmosphere.fogColorDay),
      exposure: 1.25,
    };
  }, [isNight, isDuskDawn]);

  // Adjust ACES tone mapping exposure and background fog
  useFrame(() => {
    gl.toneMappingExposure = exposure;
    if (scene.fog) {
      (scene.fog as THREE.FogExp2).color.copy(fogColor);
    }

    // Directional shadow camera follows the player in world space
    if (dirLightRef.current) {
      dirLightRef.current.position.set(
        camera.position.x + 35,
        Math.max(10, sunY),
        camera.position.z + sunZ * 0.4
      );
      dirLightRef.current.target.position.set(camera.position.x, 0, camera.position.z);
      dirLightRef.current.target.updateMatrixWorld();
    }

    // Fireflies floating motion at night
    if (firefliesRef.current && isNight) {
      const t = performance.now() * 0.001;
      firefliesRef.current.rotation.y = t * 0.05;
    }
  });

  // Night Lanterns & Fireflies (Instanced)
  const firefliesData = useMemo(() => {
    const dummy = new THREE.Object3D();
    const count = 48;
    const matrices = new Float32Array(count * 16);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 6 + (i % 5) * 6;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = getGroundY(x, z) + 0.6 + (i % 3) * 0.4;

      dummy.position.set(x, y, z);
      dummy.scale.set(0.08, 0.08, 0.08);
      dummy.updateMatrix();
      dummy.matrix.toArray(matrices, i * 16);
    }
    return { count, matrices };
  }, []);

  return (
    <>
      {/* Light, non-murky exponential fog */}
      <fogExp2
        attach="fog"
        args={[GARDEN_CONFIG.atmosphere.fogColorDay, isNight ? 0.006 : 0.003]}
      />

      {/* Ambient Fill */}
      <ambientLight intensity={isNight ? 0.08 : 0.22} />

      {/* Sun / Moon Directional Light with Follow-Shadows */}
      <directionalLight
        ref={dirLightRef}
        castShadow={shadowsEnabled}
        intensity={sunIntensity}
        color={sunColor}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-far={250}
        shadow-camera-left={-shadowDistance}
        shadow-camera-right={shadowDistance}
        shadow-camera-top={shadowDistance}
        shadow-camera-bottom={-shadowDistance}
        shadow-bias={-0.0004}
      />

      {/* Natural Hemispherical Sky-to-Ground Light */}
      <hemisphereLight
        ref={hemiLightRef}
        color={hemiSkyColor}
        groundColor={hemiGroundColor}
        intensity={isNight ? 0.2 : 0.55}
      />

      {/* Procedural Sky Dome (distance=2500, fits within camera.far=3000) */}
      <Sky
        distance={GARDEN_CONFIG.atmosphere.skyDistance}
        sunPosition={[35, Math.max(-5, sunY), sunZ * 0.4]}
        turbidity={isDuskDawn ? 10 : 6}
        rayleigh={isDuskDawn ? 2.5 : 0.4}
        inclination={0.5}
        azimuth={0.25}
      />

      {/* Procedural Environment Lighting using Lightformers (NO external CDN needed) */}
      <Environment background={false}>
        <group rotation={[0, 0, Math.PI / 4]}>
          <Lightformer
            form="rect"
            intensity={1.2}
            position={[10, 15, 10]}
            scale={[20, 20, 1]}
            color={sunColor}
          />
          <Lightformer
            form="ring"
            intensity={0.6}
            position={[-10, 8, -10]}
            scale={[15, 15, 1]}
            color={hemiSkyColor}
          />
        </group>
      </Environment>

      {/* Soft Night Lanterns & Fireflies (Active at Night) */}
      {isNight && (
        <group>
          {/* Active Night Point Lights (Max 6 active per hard rule) */}
          {[-8, 8].map((x, idx) =>
            [-8, 8, 16].map((z, jdx) => (
              <pointLight
                key={`lantern-light-${idx}-${jdx}`}
                position={[x, getGroundY(x, z) + 1.2, z]}
                color="#f59e0b"
                intensity={1.5}
                distance={12}
                decay={2}
              />
            ))
          )}

          {/* Floating Fireflies */}
          <instancedMesh
            ref={firefliesRef}
            args={[new THREE.SphereGeometry(1, 4, 4), undefined, firefliesData.count]}
          >
            <meshBasicMaterial color="#a3e635" />
          </instancedMesh>
        </group>
      )}
    </>
  );
}

