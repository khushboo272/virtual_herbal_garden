import * as THREE from 'three';

class WindSystem {
  uniforms: {
    uTime: { value: number };
    uWindDirection: { value: THREE.Vector3 };
    uWindStrength: { value: number };
  };

  constructor() {
    this.uniforms = {
      uTime: { value: 0 },
      uWindDirection: { value: new THREE.Vector3(1, 0, 0.5).normalize() },
      uWindStrength: { value: 1.0 },
    };
  }

  update(time: number) {
    this.uniforms.uTime.value = time;
    // Slowly vary wind direction/strength for realism
    const angle = time * 0.1;
    this.uniforms.uWindDirection.value.set(
      Math.cos(angle) * 0.5 + 1.0, 
      0, 
      Math.sin(angle) * 0.5 + 0.5
    ).normalize();
    
    // Gusts
    this.uniforms.uWindStrength.value = 1.0 + Math.sin(time * 0.5) * 0.5 + Math.sin(time * 1.3) * 0.2;
  }
}

export const windSystem = new WindSystem();

export function useWind() {
  return windSystem.uniforms;
}
