import { useEffect, useRef, useState } from 'react';
import { touchJoystickState } from './touchState';

export function MobileJoystick() {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  // Reset the global state when the joystick unmounts or goes inactive
  useEffect(() => {
    return () => {
      touchJoystickState.x = 0;
      touchJoystickState.y = 0;
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only accept touch if we don't already have one
    if (touchIdRef.current !== null) return;
    
    // Prevent default scrolling on this area
    // In React 18, we can't easily preventDefault on touchstart in synthetic events if passive is true
    // but we have touch-action: none in CSS
    
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setActive(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setActive(false);
        touchJoystickState.x = 0;
        touchJoystickState.y = 0;
        
        // Reset visual position
        if (knobRef.current) {
          knobRef.current.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
        }
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!containerRef.current || !knobRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate raw distance from center
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    
    // Max radius the knob can move
    const maxRadius = rect.width / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Cap at max radius
    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }
    
    // Move the knob visually
    knobRef.current.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
    
    // Update global state (-1 to 1)
    touchJoystickState.x = dx / maxRadius;
    touchJoystickState.y = dy / maxRadius;
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: 'fixed',
        bottom: 40,
        left: 40,
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(8px)',
        zIndex: 50,
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: active ? 1 : 0.6,
        transition: 'opacity 0.2s',
      }}
    >
      <div
        ref={knobRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
          transition: active ? 'none' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      />
    </div>
  );
}
