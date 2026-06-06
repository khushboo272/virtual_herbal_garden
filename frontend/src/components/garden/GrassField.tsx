import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWind } from './WindSystem';
import { useMediaQuery } from '../../hooks/useMediaQuery';

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const GRASS_COUNT = 50000;

export function GrassField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const uniforms = useWind();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const geometry = useMemo(() => {
    // A simple blade of grass (triangle pointing up)
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -0.05, 0, 0, // bottom left
       0.05, 0, 0, // bottom right
       0.0,  1, 0  // top center
    ]);
    const uvs = new Float32Array([
      0, 0,
      1, 0,
      0.5, 1
    ]);
    const indices = [0, 1, 2];
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, []);

  const { instanceMatrix, instanceColor } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const matrix = new Float32Array(GRASS_COUNT * 16);
    const color = new Float32Array(GRASS_COUNT * 3);
    const c = new THREE.Color();

    for (let i = 0; i < GRASS_COUNT; i++) {
      // Scatter in a 200x200 area
      const x = (seededRandom(i * 7) - 0.5) * 180;
      const z = (seededRandom(i * 13) - 0.5) * 180;
      
      // Random scale and rotation
      const scale = 0.3 + seededRandom(i * 3) * 0.5;
      const rotY = seededRandom(i * 11) * Math.PI * 2;
      
      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, rotY, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      
      dummy.matrix.toArray(matrix, i * 16);

      // Color variation
      const hue = 0.25 + seededRandom(i) * 0.1; // Greenish
      const sat = 0.6 + seededRandom(i*2) * 0.3;
      const light = 0.2 + seededRandom(i*5) * 0.2;
      c.setHSL(hue, sat, light);
      c.toArray(color, i * 3);
    }

    return { 
      instanceMatrix: new THREE.InstancedBufferAttribute(matrix, 16),
      instanceColor: new THREE.InstancedBufferAttribute(color, 3) 
    };
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      roughness: 0.8,
    });
    
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uWindDirection = uniforms.uWindDirection;
      shader.uniforms.uWindStrength = uniforms.uWindStrength;

      shader.vertexShader = `
        uniform float uTime;
        uniform vec3 uWindDirection;
        uniform float uWindStrength;
        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        
        // Wind calculation
        // UV.y is 0 at bottom, 1 at top. We only bend the top.
        float windPower = uv.y * uWindStrength;
        
        // World position for noise offset
        vec4 worldPos = instanceMatrix * vec4(position, 1.0);
        
        // Calculate sine wave based on time and world position
        float wave = sin(uTime * 2.0 + worldPos.x * 0.5 + worldPos.z * 0.5);
        
        // Apply wind
        vec3 windOffset = uWindDirection * wave * windPower * 0.5;
        
        transformed += windOffset;
        `
      );
    };
    return mat;
  }, [uniforms]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, GRASS_COUNT]}
      receiveShadow={!isMobile}
    >
      <primitive object={instanceMatrix} attach="instanceMatrix" />
      <primitive object={instanceColor} attach="instanceColor" />
    </instancedMesh>
  );
}
