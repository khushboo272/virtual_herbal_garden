import { useRef, useMemo } from 'react';
import { useFrame, extend, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { ASSETS } from '../../config/assets';

extend({ Water });

export function River() {
  const ref = useRef<any>(null);
  const gl = useThree((state) => state.gl);
  
  // Load the water normals texture from the R2 bucket
  const waterNormals = useTexture(ASSETS.textures.waterNormals);
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  const geom = useMemo(() => new THREE.PlaneGeometry(100, 10), []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.material.uniforms.time.value += delta * 0.2;
    }
  });

  return (
    <water
      ref={ref}
      args={[
        geom,
        {
          textureWidth: 512,
          textureHeight: 512,
          waterNormals,
          sunDirection: new THREE.Vector3(0.5, 0.8, 0.3).normalize(),
          sunColor: 0xffffff,
          waterColor: 0x001e0f,
          distortionScale: 3.7,
          fog: true,
          format: gl.outputColorSpace,
        },
      ]}
      position={[0, 0.05, 25]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
}
