import React, { useRef, useState, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
  z: number;
}

interface GardenPositionPickerProps {
  position: Position;
  onChange: (pos: Position) => void;
  gardenSize?: number; // Size of the 3D garden plane in world units (e.g., 200x200)
}

export function GardenPositionPicker({ position, onChange, gardenSize = 100 }: GardenPositionPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Draw the 2D grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f8fafc'; // slate-50
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#e2e8f0'; // slate-200
    ctx.lineWidth = 1;
    const step = width / 10;
    
    for (let i = 0; i <= width; i += step) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#94a3b8'; // slate-400
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); ctx.stroke(); // Z-axis mapping
    ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); ctx.stroke(); // X-axis mapping

    // Draw center dot
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.arc(centerX, centerY, 3, 0, Math.PI * 2); ctx.fill();

    // Map 3D coordinates to 2D canvas coordinates
    // 3D: (X, Z) with origin (0,0) at center.
    // Canvas: (0,0) is top-left.
    const scale = width / gardenSize;
    const dotX = centerX + (position.x * scale);
    const dotY = centerY + (position.z * scale); // using Z for the 2D depth

    // Draw current position
    ctx.fillStyle = '#9333ea'; // purple-600
    ctx.shadowColor = '#d8b4fe';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [position, gardenSize]);

  const handleInteract = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const xPos = clientX - rect.left;
    const yPos = clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = gardenSize / width;

    const newX = (xPos - centerX) * scale;
    const newZ = (yPos - centerY) * scale;

    // We only update X and Z, keeping Y (height) as is
    onChange({ x: Number(newX.toFixed(2)), y: position.y, z: Number(newZ.toFixed(2)) });
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="text-xs text-gray-500 text-center w-full max-w-sm mb-1">
        Drag the purple dot to position the plant in the 3D garden top-down view (X/Z plane).
      </div>
      <div className="relative border-2 border-purple-200 rounded-xl overflow-hidden shadow-inner cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="bg-white touch-none"
          onMouseDown={(e) => { setIsDragging(true); handleInteract(e); }}
          onMouseMove={(e) => isDragging && handleInteract(e)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={(e) => { setIsDragging(true); handleInteract(e); }}
          onTouchMove={(e) => isDragging && handleInteract(e)}
          onTouchEnd={() => setIsDragging(false)}
        />
      </div>
    </div>
  );
}
