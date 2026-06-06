import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useWind } from './WindSystem';

export function DayNightSystem() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // 120 second day/night cycle
    // 0 = noon, 0.5 = midnight
    const cycle = (t % 120) / 120;
    const timeOfDay = cycle * Math.PI * 2; // 0 to 2PI

    if (dirLightRef.current) {
      // Sun position
      const sunDistance = 100;
      const sunHeight = Math.cos(timeOfDay) * sunDistance;
      const sunZ = Math.sin(timeOfDay) * sunDistance;
      dirLightRef.current.position.set(50, sunHeight, sunZ);
      
      // Intensity (0 at night, max at noon)
      const isDay = sunHeight > 0;
      const baseIntensity = isDay ? Math.pow(sunHeight / sunDistance, 0.5) * 2.5 : 0;
      dirLightRef.current.intensity = Math.max(0.01, baseIntensity);
      
      // Sunset colors
      const sunsetFactor = isDay ? Math.pow(1 - (sunHeight / sunDistance), 3) : 1;
      const sunColor = new THREE.Color().lerpColors(
        new THREE.Color('#ffebd2'), // Noon
        new THREE.Color('#ff8c00'), // Sunset
        sunsetFactor
      );
      dirLightRef.current.color.copy(sunColor);
    }
    
    if (hemiLightRef.current) {
      const isDay = Math.cos(timeOfDay) > 0;
      const heightPhase = Math.max(0, Math.cos(timeOfDay));
      
      const skyColorDay = new THREE.Color('#87ceeb');
      const skyColorNight = new THREE.Color('#0a1128');
      
      const groundColorDay = new THREE.Color('#2d5a1a');
      const groundColorNight = new THREE.Color('#0f1c10');
      
      hemiLightRef.current.color.lerpColors(skyColorNight, skyColorDay, heightPhase);
      hemiLightRef.current.groundColor.lerpColors(groundColorNight, groundColorDay, heightPhase);
      hemiLightRef.current.intensity = 0.1 + heightPhase * 0.4;
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      
      <directionalLight
        ref={dirLightRef}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0005}
      />
      
      <hemisphereLight ref={hemiLightRef} />
      
      {/* Sky Dome */}
      <Sky
        distance={450000}
        sunPosition={[1, 0.3, 0]}
        inclination={0.49}
        azimuth={0.25}
        turbidity={8}
        rayleigh={0.5}
      />
      
      <Environment preset="forest" background={false} environmentIntensity={0.5} />
    </>
  );
}
