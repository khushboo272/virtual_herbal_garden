// ──────────────────────────────────────────────────────────
// components/GardenControls.tsx — Enhanced Walk, Sprint, Orbit & Ground-Following
// WASD + Shift to sprint, smooth terrain elevation tracking, collision boundaries
// ──────────────────────────────────────────────────────────
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { GARDEN_CONFIG } from '../gardenConfig';
import { getGroundY } from '../utils/terrainGenerator';
import { touchJoystickState } from '../../../app/components/3d/touchState';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

interface GardenControlsProps {
  enabled: boolean;
  mode?: 'fps' | 'orbit';
  onLock?: () => void;
  onUnlock?: () => void;
  teleportTarget?: [number, number, number] | null;
  onTeleportComplete?: () => void;
  onPlayerMove?: (position: [number, number, number], headingRad: number) => void;
}

export function GardenControls({
  enabled,
  mode = 'fps',
  onLock,
  onUnlock,
  teleportTarget,
  onTeleportComplete,
  onPlayerMove,
}: GardenControlsProps) {
  const { camera, gl } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const keys = useRef<Record<string, boolean>>({});
  const isLocked = useRef(false);
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const orbitRef = useRef<any>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const PI_2 = Math.PI / 2;

  // Smooth Teleportation tween
  useEffect(() => {
    if (teleportTarget) {
      const [tx, ty, tz] = teleportTarget;
      const targetGroundY = getGroundY(tx, tz) + GARDEN_CONFIG.camera.eyeHeight;

      gsap.to(camera.position, {
        x: tx,
        y: targetGroundY,
        z: tz,
        duration: 1.2,
        ease: 'power2.inOut',
        onComplete: () => {
          onTeleportComplete?.();
        },
      });
    }
  }, [teleportTarget, camera, onTeleportComplete]);

  // Pointer lock handling for mouse look in FPS mode
  useEffect(() => {
    if (mode !== 'fps' || isMobile) return;

    const onPointerLockChange = () => {
      if (document.pointerLockElement === gl.domElement) {
        isLocked.current = true;
        onLock?.();
      } else {
        isLocked.current = false;
        onUnlock?.();
      }
    };

    const onClick = () => {
      if (enabled && !isLocked.current) {
        gl.domElement.requestPointerLock?.();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current || !enabled) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y -= movementX * 0.0022;
      euler.current.x -= movementY * 0.0022;
      euler.current.x = Math.max(-PI_2 + 0.05, Math.min(PI_2 - 0.05, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);
    gl.domElement.addEventListener('click', onClick);
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      gl.domElement.removeEventListener('click', onClick);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [gl.domElement, enabled, mode, isMobile, camera, onLock, onUnlock]);

  // Keyboard input listeners
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Frame update loop
  useFrame((_, delta) => {
    if (mode !== 'fps' || !enabled || (!isLocked.current && !isMobile)) return;

    const k = keys.current;
    const isRunning = Boolean(k['ShiftLeft'] || k['ShiftRight']);
    const speed = isRunning ? GARDEN_CONFIG.camera.runSpeed : GARDEN_CONFIG.camera.walkSpeed;

    const direction = new THREE.Vector3();
    if (k['KeyW'] || k['ArrowUp']) direction.z -= 1;
    if (k['KeyS'] || k['ArrowDown']) direction.z += 1;
    if (k['KeyA'] || k['ArrowLeft']) direction.x -= 1;
    if (k['KeyD'] || k['ArrowRight']) direction.x += 1;

    // Mobile touch joystick support
    if (isMobile) {
      direction.x += touchJoystickState.x;
      direction.z += touchJoystickState.y;
    }

    if (direction.lengthSq() > 0.001) {
      direction.normalize();
    }

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    move.addScaledVector(forward, -direction.z);
    move.addScaledVector(right, direction.x);

    velocity.current.add(move.multiplyScalar(speed * delta));
    velocity.current.multiplyScalar(0.82); // Damping friction

    // Candidate new position
    const nextX = camera.position.x + velocity.current.x;
    const nextZ = camera.position.z + velocity.current.z;

    // Boundary check (cannot walk off terrain perimeter)
    const worldRadius = Math.hypot(nextX, nextZ);
    if (worldRadius <= GARDEN_CONFIG.camera.worldBounds - 1.0) {
      // Pond collision check (cannot walk into deep pond)
      const [px, , pz] = GARDEN_CONFIG.terrain.pondCenter;
      const pondDist = Math.hypot(nextX - px, nextZ - pz);
      if (pondDist >= GARDEN_CONFIG.terrain.pondRadius * 0.85) {
        camera.position.x = nextX;
        camera.position.z = nextZ;
      }
    }

    // Exact ground elevation tracking with eye height
    const groundY = getGroundY(camera.position.x, camera.position.z);
    const targetEyeY = groundY + GARDEN_CONFIG.camera.eyeHeight;
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetEyeY, 0.25);

    onPlayerMove?.([camera.position.x, camera.position.y, camera.position.z], euler.current.y);
  });

  return mode === 'orbit' ? (
    <OrbitControls
      ref={orbitRef}
      makeDefault
      minDistance={2}
      maxDistance={70}
      maxPolarAngle={Math.PI / 2 - 0.08}
      target={GARDEN_CONFIG.camera.orbitTarget}
      enabled={enabled}
    />
  ) : null;
}
