import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BIRD_COUNT = 30;

class Boid {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;

  constructor() {
    this.position = new THREE.Vector3(
      (Math.random() - 0.5) * 100,
      15 + Math.random() * 20,
      (Math.random() - 0.5) * 100
    );
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
    this.acceleration = new THREE.Vector3();
  }
}

export function Birds() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const boids = useMemo(() => Array.from({ length: BIRD_COUNT }, () => new Boid()), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const geometry = useMemo(() => {
    // Simple bird shape using a cone for the body and two planes for wings
    const geom = new THREE.BufferGeometry();
    
    // Body (cone)
    const bodyVertices = new Float32Array([
      0, 0, 1,    // beak
      -0.2, 0, -0.5, // tail left
      0.2, 0, -0.5,  // tail right
      0, 0.2, -0.2   // top hump
    ]);
    const bodyIndices = [
      0, 1, 3,
      0, 3, 2,
      0, 2, 1,
      1, 2, 3
    ];
    geom.setAttribute('position', new THREE.BufferAttribute(bodyVertices, 3));
    geom.setIndex(bodyIndices);
    geom.computeVertexNormals();
    return geom;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    const time = clock.getElapsedTime();
    const dt = 0.016; // Fixed timestep approx
    
    // Flocking parameters
    const maxSpeed = 0.2;
    const maxForce = 0.01;
    const perceptionRadius = 15;
    
    for (let i = 0; i < BIRD_COUNT; i++) {
      const boid = boids[i];
      let separation = new THREE.Vector3();
      let alignment = new THREE.Vector3();
      let cohesion = new THREE.Vector3();
      let total = 0;
      
      for (let j = 0; j < BIRD_COUNT; j++) {
        if (i !== j) {
          const other = boids[j];
          const d = boid.position.distanceTo(other.position);
          
          if (d < perceptionRadius) {
            // Separation
            let diff = new THREE.Vector3().subVectors(boid.position, other.position);
            diff.divideScalar(d * d);
            separation.add(diff);
            
            // Alignment
            alignment.add(other.velocity);
            
            // Cohesion
            cohesion.add(other.position);
            
            total++;
          }
        }
      }
      
      if (total > 0) {
        separation.divideScalar(total);
        alignment.divideScalar(total);
        alignment.setLength(maxSpeed);
        alignment.sub(boid.velocity);
        alignment.clampLength(0, maxForce);
        
        cohesion.divideScalar(total);
        cohesion.sub(boid.position);
        cohesion.setLength(maxSpeed);
        cohesion.sub(boid.velocity);
        cohesion.clampLength(0, maxForce);
        
        boid.acceleration.add(separation.multiplyScalar(1.5));
        boid.acceleration.add(alignment.multiplyScalar(1.0));
        boid.acceleration.add(cohesion.multiplyScalar(1.0));
      }
      
      // Boundary
      const centerForce = new THREE.Vector3(0, 25, 0).sub(boid.position);
      if (centerForce.length() > 60) {
        centerForce.setLength(maxForce * 2);
        boid.acceleration.add(centerForce);
      }
      
      // Keep off ground
      if (boid.position.y < 10) {
        boid.acceleration.y += 0.02;
      }
      
      // Update physics
      boid.position.add(boid.velocity);
      boid.velocity.add(boid.acceleration);
      boid.velocity.clampLength(0, maxSpeed);
      boid.acceleration.set(0, 0, 0);
      
      // Update instanced mesh
      dummy.position.copy(boid.position);
      
      // Look at velocity direction
      const lookAtTarget = new THREE.Vector3().addVectors(boid.position, boid.velocity);
      dummy.lookAt(lookAtTarget);
      
      // Add wing flap motion on Z scale as a hack for a flock (since it's instanced without bone animations)
      // We vary the Y scale to simulate wings flapping
      const flapSpeed = 20 + Math.random() * 5;
      const flap = Math.sin(time * flapSpeed + i);
      dummy.scale.set(1 + flap * 0.2, 1, 1);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, BIRD_COUNT]} castShadow>
      <meshStandardMaterial color="#111111" roughness={0.8} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
