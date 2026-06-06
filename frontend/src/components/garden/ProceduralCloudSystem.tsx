import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWind } from './WindSystem';

function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  // Basic Perlin-like noise using overlapping circles for clouds
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 20 + Math.random() * 50;
    
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const alpha = 0.1 + Math.random() * 0.4;
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function ProceduralCloudSystem() {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useWind();
  
  const cloudTex = useMemo(() => createCloudTexture(), []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime();
      const windDir = uniforms.uWindDirection.value;
      const speed = 0.05 * uniforms.uWindStrength.value;
      
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat.map) {
        mat.map.offset.x -= windDir.x * speed * 0.01;
        mat.map.offset.y -= windDir.z * speed * 0.01;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 150, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial 
        map={cloudTex} 
        transparent={true} 
        opacity={0.8}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
