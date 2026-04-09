// ─────────────────────────────────────────────────────
// Controls.tsx — First-person WASD + PointerLock
// Pure Three.js — NO @react-three/drei imports
// ─────────────────────────────────────────────────────
import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const SPEED = 8;
const DAMPING = 0.85;

interface ControlsProps {
  enabled: boolean;
  onLock?: () => void;
  onUnlock?: () => void;
}

export function Controls({ enabled, onLock, onUnlock }: ControlsProps) {
  const { camera, gl } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const keys = useRef<Record<string, boolean>>({});
  const isLocked = useRef(false);
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const PI_2 = Math.PI / 2;

  // Set initial camera position
  useEffect(() => {
    camera.position.set(0, 2, 20);
    camera.lookAt(0, 1, 0);
  }, [camera]);

  // Pointer lock change listener
  useEffect(() => {
    const onPointerLockChange = () => {
      if (document.pointerLockElement === gl.domElement) {
        isLocked.current = true;
        onLock?.();
      } else {
        isLocked.current = false;
        onUnlock?.();
      }
    };

    const onPointerLockError = () => {
      console.warn("PointerLock error");
    };

    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("pointerlockerror", onPointerLockError);

    return () => {
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("pointerlockerror", onPointerLockError);
    };
  }, [gl.domElement, onLock, onUnlock]);

  // Click to lock
  useEffect(() => {
    const onClick = () => {
      if (!isLocked.current && enabled) {
        gl.domElement.requestPointerLock();
      }
    };
    gl.domElement.addEventListener("click", onClick);
    return () => gl.domElement.removeEventListener("click", onClick);
  }, [gl.domElement, enabled]);

  // Mouse movement
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return;

      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y -= e.movementX * 0.002;
      euler.current.x -= e.movementY * 0.002;
      euler.current.x = Math.max(-PI_2, Math.min(PI_2, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };

    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, [camera]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, delta) => {
    if (!enabled || !isLocked.current) return;

    const k = keys.current;
    const direction = new THREE.Vector3();

    if (k["KeyW"] || k["ArrowUp"]) direction.z -= 1;
    if (k["KeyS"] || k["ArrowDown"]) direction.z += 1;
    if (k["KeyA"] || k["ArrowLeft"]) direction.x -= 1;
    if (k["KeyD"] || k["ArrowRight"]) direction.x += 1;

    direction.normalize();

    // Transform direction to camera space
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    move.addScaledVector(forward, -direction.z);
    move.addScaledVector(right, direction.x);

    velocity.current.add(move.multiplyScalar(SPEED * delta));
    velocity.current.multiplyScalar(DAMPING);

    camera.position.add(velocity.current);

    // Clamp height and keep within garden bounds
    camera.position.y = 2;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -45, 45);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -45, 45);
  });

  return null; // No drei components — all handled via effects
}
