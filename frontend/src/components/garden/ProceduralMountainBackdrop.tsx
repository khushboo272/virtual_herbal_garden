import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';

function createMountainDisplacement() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  // Draw some basic procedural mountain shapes using sine waves
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 1024, 256);
  
  ctx.fillStyle = '#ffffff';
  for (let x = 0; x < 1024; x++) {
    // Generate height from multiple frequencies
    let h = 0;
    h += Math.sin(x * 0.02) * 50;
    h += Math.sin(x * 0.05) * 20;
    h += Math.sin(x * 0.1) * 5;
    
    // Base height + noise
    const y = 150 + h;
    ctx.fillRect(x, 256 - y, 1, y);
  }

  // Blur for smoother displacement
  ctx.filter = 'blur(4px)';
  ctx.drawImage(canvas, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createMountainColor() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  // Gradient from green at bottom to gray at top
  const grad = ctx.createLinearGradient(0, 256, 0, 0);
  grad.addColorStop(0, '#1a3a12');   // Base green
  grad.addColorStop(0.5, '#2c4c24'); // Mid green
  grad.addColorStop(0.8, '#5a5e55'); // Rock
  grad.addColorStop(1, '#ffffff');   // Snow

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function ProceduralMountainBackdrop() {
  const displacementMap = useMemo(() => createMountainDisplacement(), []);
  const colorMap = useMemo(() => createMountainColor(), []);

  return (
    <group position={[0, -5, 0]}>
      {/* Visual Mountains */}
      <mesh receiveShadow>
        <cylinderGeometry args={[200, 200, 100, 128, 64, true]} />
        <meshStandardMaterial
          map={colorMap}
          displacementMap={displacementMap}
          displacementScale={40}
          side={THREE.BackSide}
          roughness={0.9}
        />
      </mesh>
      
      {/* Invisible physics collider ring */}
      <RigidBody type="fixed" colliders="trimesh">
        <mesh visible={false}>
          <cylinderGeometry args={[190, 190, 100, 32, 1, true]} />
          <meshBasicMaterial side={THREE.BackSide} />
        </mesh>
      </RigidBody>
    </group>
  );
}
