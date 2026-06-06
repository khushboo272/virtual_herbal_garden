import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import type { Plant as FullPlant } from "../../../lib/types";
import { touchJoystickState } from "./touchState";
import { useMediaQuery } from "../../../hooks/useMediaQuery";

const SPEED = 8;
const DAMPING = 0.85;

interface ControlsProps {
  enabled: boolean;
  selectedPlant?: FullPlant | null;
  mode?: "fps" | "orbit";
  isFullGardenView?: boolean;
  onLock?: () => void;
  onUnlock?: () => void;
}

export function Controls({ enabled, selectedPlant, mode = "fps", isFullGardenView, onLock, onUnlock }: ControlsProps) {
  const { camera, gl } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const keys = useRef<Record<string, boolean>>({});
  const isLocked = useRef(false);
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const orbitRef = useRef<any>(null);
  const PI_2 = Math.PI / 2;
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Tween to plant when selected
  useEffect(() => {
    if (selectedPlant && selectedPlant.placement3d) {
      // Release pointer lock when UI opens
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock();
      }

      const { x, y, z } = selectedPlant.placement3d.position;
      const targetPos = new THREE.Vector3(x, y + 1.5, z + 5);
      const lookAtPos = new THREE.Vector3(x, y + 0.5, z);

      // Disable orbit controls temporarily while animating
      if (orbitRef.current) {
        orbitRef.current.enabled = false;
      }

      // Animate the camera position
      gsap.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.5,
        ease: "power2.inOut",
      });

      // Animate camera rotation or orbit target
      if (mode === 'orbit' && orbitRef.current) {
        gsap.to(orbitRef.current.target, {
          x: lookAtPos.x,
          y: lookAtPos.y,
          z: lookAtPos.z,
          duration: 1.5,
          ease: "power2.inOut",
        });
      } else {
        const dummy = new THREE.Object3D();
        dummy.position.copy(camera.position); 
        dummy.lookAt(lookAtPos);
        const targetQuaternion = dummy.quaternion.clone();

        gsap.to(camera.quaternion, {
          x: targetQuaternion.x,
          y: targetQuaternion.y,
          z: targetQuaternion.z,
          w: targetQuaternion.w,
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => {
            camera.quaternion.normalize();
            euler.current.setFromQuaternion(camera.quaternion);
          }
        });
      }
    } else {
      // Re-enable orbit controls
      if (mode === 'orbit' && orbitRef.current) {
        orbitRef.current.enabled = true;
      }
    }
  }, [selectedPlant, camera, gl.domElement, mode]);

  // Tween to full garden view
  useEffect(() => {
    if (isFullGardenView) {
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock();
      }

      if (orbitRef.current) {
        orbitRef.current.enabled = false;
      }

      // Tween camera high up
      gsap.to(camera.position, {
        x: 0,
        y: 40,
        z: 20,
        duration: 2.0,
        ease: "power2.inOut",
      });

      // Look at center
      if (mode === 'orbit' && orbitRef.current) {
        gsap.to(orbitRef.current.target, {
          x: 0,
          y: 0,
          z: 0,
          duration: 2.0,
          ease: "power2.inOut",
          onComplete: () => {
            orbitRef.current.enabled = true;
          }
        });
      } else {
        const dummy = new THREE.Object3D();
        dummy.position.set(0, 40, 20); 
        dummy.lookAt(0, 0, 0);
        const targetQuaternion = dummy.quaternion.clone();

        gsap.to(camera.quaternion, {
          x: targetQuaternion.x,
          y: targetQuaternion.y,
          z: targetQuaternion.z,
          w: targetQuaternion.w,
          duration: 2.0,
          ease: "power2.inOut",
          onUpdate: () => {
            camera.quaternion.normalize();
            euler.current.setFromQuaternion(camera.quaternion);
          }
        });
      }
    }
  }, [isFullGardenView, camera, gl.domElement, mode]);

  // Set initial camera position
  useEffect(() => {
    camera.position.set(0, 2, 20);
    camera.lookAt(0, 1, 0);
    euler.current.setFromQuaternion(camera.quaternion);
  }, [camera]);

  // Pointer lock change listener (Only for FPS)
  useEffect(() => {
    if (mode !== 'fps') return;
    
    const onPointerLockChange = () => {
      if (document.pointerLockElement === gl.domElement) {
        isLocked.current = true;
        onLock?.();
      } else {
        isLocked.current = false;
        onUnlock?.();
      }
    };

    document.addEventListener("pointerlockchange", onPointerLockChange);
    return () => document.removeEventListener("pointerlockchange", onPointerLockChange);
  }, [gl.domElement, onLock, onUnlock, mode]);

  // Click to lock (Only for FPS)
  useEffect(() => {
    if (mode !== 'fps') return;

    const onClick = () => {
      if (!isLocked.current && enabled && !selectedPlant) {
        gl.domElement.requestPointerLock();
      }
    };
    gl.domElement.addEventListener("click", onClick);
    return () => gl.domElement.removeEventListener("click", onClick);
  }, [gl.domElement, enabled, selectedPlant, mode]);

  // Mouse movement (Only for FPS)
  useEffect(() => {
    if (mode !== 'fps') return;

    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current || selectedPlant) return;

      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y -= e.movementX * 0.002;
      euler.current.x -= e.movementY * 0.002;
      euler.current.x = Math.max(-PI_2, Math.min(PI_2, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };

    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, [camera, selectedPlant, mode]);

  // Touch movement (Only for FPS)
  const touchStartRef = useRef<{ x: number, y: number, id: number | null }>({ x: 0, y: 0, id: null });

  useEffect(() => {
    if (mode !== 'fps' || !isMobile) return;

    const onTouchStart = (e: TouchEvent) => {
      if (selectedPlant) return;
      // Look touch is on the right half of the screen
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.clientX > window.innerWidth / 2 && touchStartRef.current.id === null) {
          touchStartRef.current = { x: t.clientX, y: t.clientY, id: t.identifier };
          break;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (selectedPlant || touchStartRef.current.id === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchStartRef.current.id) {
          const dx = t.clientX - touchStartRef.current.x;
          const dy = t.clientY - touchStartRef.current.y;
          touchStartRef.current.x = t.clientX;
          touchStartRef.current.y = t.clientY;

          euler.current.setFromQuaternion(camera.quaternion);
          euler.current.y -= dx * 0.005;
          euler.current.x -= dy * 0.005;
          euler.current.x = Math.max(-PI_2, Math.min(PI_2, euler.current.x));
          camera.quaternion.setFromEuler(euler.current);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchStartRef.current.id) {
          touchStartRef.current.id = null;
        }
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: false });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [camera, selectedPlant, mode, isMobile]);

  // Keyboard (Only for FPS)
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
    if (mode !== 'fps' || !enabled || (!isLocked.current && !isMobile) || selectedPlant) return;

    const k = keys.current;
    const direction = new THREE.Vector3();

    if (k["KeyW"] || k["ArrowUp"]) direction.z -= 1;
    if (k["KeyS"] || k["ArrowDown"]) direction.z += 1;
    if (k["KeyA"] || k["ArrowLeft"]) direction.x -= 1;
    if (k["KeyD"] || k["ArrowRight"]) direction.x += 1;

    // Add joystick influence
    if (isMobile) {
      direction.x += touchJoystickState.x;
      direction.z += touchJoystickState.y; // Y from joystick maps to Z (forward/backward)
    }

    direction.normalize();

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

    camera.position.y = Math.max(0.5, camera.position.y);
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -45, 45);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -45, 45);
  });

  return mode === 'orbit' ? (
    <OrbitControls 
      ref={orbitRef} 
      makeDefault 
      minDistance={1} 
      maxDistance={60} 
      maxPolarAngle={Math.PI / 2 - 0.05} // don't go below ground
      enabled={enabled && !selectedPlant}
    />
  ) : null;
}
