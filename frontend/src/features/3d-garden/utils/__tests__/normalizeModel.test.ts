// ──────────────────────────────────────────────────────────
// utils/__tests__/normalizeModel.test.ts — Unit tests for normalizeModel
// ──────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { normalizeModel } from '../normalizeModel';

describe('normalizeModel', () => {
  it('centers the base at y = 0 and scales to targetHeightM', () => {
    // Create a mesh with known dimensions: width=2, height=4, depth=2, centered at (0, 0, 0)
    // Its Y range is -2 to +2.
    const geometry = new THREE.BoxGeometry(2, 4, 2);
    const material = new THREE.MeshStandardMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);

    const targetHeight = 2.0;
    const result = normalizeModel(group, targetHeight);

    // Initial raw height is 4.0. Target height is 2.0. Scale factor should be 0.5.
    expect(result.scale).toBeCloseTo(0.5);
    expect(result.boundingBox.height).toBeCloseTo(2.0);

    // The root group position was adjusted so base sits at y=0
    expect(group.position.y).toBeCloseTo(1.0); // -(-2 * 0.5) = +1.0
  });

  it('applies transform overrides: scale, rotationY, offsetY', () => {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
    const material = new THREE.MeshStandardMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);

    const transform = {
      scale: 1.5,
      rotationY: Math.PI / 2,
      offsetY: 0.35,
    };

    const result = normalizeModel(group, 1.0, transform);

    // Raw height is 2.0. Base scale = 1.0 / 2.0 = 0.5.
    // Final scale = 0.5 * 1.5 = 0.75.
    expect(result.scale).toBeCloseTo(0.75);
    expect(result.rotationY).toBeCloseTo(Math.PI / 2);
    expect(result.offsetY).toBeCloseTo(0.35);
    expect(group.rotation.y).toBeCloseTo(Math.PI / 2);
  });

  it('configures shadows and material standard properties', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ envMapIntensity: 0.2 });
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);

    normalizeModel(group, 1.0, {}, true);

    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
    expect(material.envMapIntensity).toBe(1.0);
    expect(material.side).toBe(THREE.DoubleSide);
  });
});

