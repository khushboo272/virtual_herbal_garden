import * as THREE from 'three';

export interface BboxFramingResult {
  target: [number, number, number];
  distance: number;
  cameraPosition: [number, number, number];
  minDistance: number;
  maxDistance: number;
  plantHeightM: number;
  plantSpreadM: number;
}

/**
 * Computes camera distance and target from a model bounding box.
 * Ensures the plant fills targetCoverage (default 65%) of the viewport height.
 */
export function calculateBboxFraming(
  box: THREE.Box3,
  fov: number = 45,
  targetCoverage: number = 0.65
): BboxFramingResult {
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const plantHeightM = Math.max(0.1, size.y);
  const plantSpreadM = Math.max(0.1, Math.max(size.x, size.z));

  // Determine vertical dimension to frame
  const fovRad = (fov * Math.PI) / 180;
  // Distance required so plantHeightM occupies targetCoverage of the view height
  const distance = (plantHeightM / 2) / Math.tan(fovRad / 2) / Math.max(0.1, targetCoverage);

  // Target centered in Y at bbox center
  const target: [number, number, number] = [center.x, center.y, center.z];
  // Slightly elevated front-perspective position
  const cameraPosition: [number, number, number] = [
    center.x,
    center.y + distance * 0.15,
    center.z + distance,
  ];

  return {
    target,
    distance,
    cameraPosition,
    minDistance: Math.max(0.2, distance * 0.25),
    maxDistance: Math.max(1.0, distance * 4.0),
    plantHeightM,
    plantSpreadM,
  };
}

