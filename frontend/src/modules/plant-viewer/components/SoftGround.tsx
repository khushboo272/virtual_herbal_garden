import React, { useMemo } from 'react';
import * as THREE from 'three';

interface SoftGroundProps {
  showGrid?: boolean;
  radius?: number;
}

/**
 * Creates a soft ground disc whose opacity fades radially to 0 towards the perimeter,
 * avoiding any sharp or cropped edges against the background/sky.
 */
export const SoftGround: React.FC<SoftGroundProps> = ({ showGrid = true, radius = 4.0 }) => {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw radial gradient from soft earth tone / moss to completely transparent at edge
    const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 250);
    grad.addColorStop(0, 'rgba(40, 70, 45, 0.28)');
    grad.addColorStop(0.35, 'rgba(45, 75, 50, 0.18)');
    grad.addColorStop(0.7, 'rgba(50, 80, 55, 0.07)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    if (showGrid) {
      // Subtle concentric rings and radial spokes
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.lineWidth = 1.5;

      for (let r = 50; r <= 220; r += 50) {
        ctx.beginPath();
        ctx.arc(256, 256, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(256 + Math.cos(a) * 30, 256 + Math.sin(a) * 30);
        ctx.lineTo(256 + Math.cos(a) * 220, 256 + Math.sin(a) * 220);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, [showGrid]);

  return (
    <group position={[0, -0.002, 0]}>
      {texture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[radius, 64]} />
          <meshBasicMaterial
            map={texture}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

