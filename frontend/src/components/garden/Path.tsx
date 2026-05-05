// ─────────────────────────────────────────────────────
// Path.tsx — Garden dirt path using CatmullRom curve
// ─────────────────────────────────────────────────────
import { useMemo } from 'react';
import * as THREE from 'three';

export function GardenPath() {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-15, 0.03, 20),
      new THREE.Vector3(-5, 0.03, 10),
      new THREE.Vector3(0, 0.03, 5),
      new THREE.Vector3(5, 0.03, 0),
      new THREE.Vector3(10, 0.03, -5),
      new THREE.Vector3(5, 0.03, -12),
      new THREE.Vector3(-5, 0.03, -15),
    ]);

    const shape = new THREE.Shape();
    shape.moveTo(-0.6, 0);
    shape.lineTo(0.6, 0);

    return new THREE.ExtrudeGeometry(shape, {
      steps: 60,
      bevelEnabled: false,
      extrudePath: curve,
    });
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#8d7460" roughness={0.95} metalness={0} />
    </mesh>
  );
}
