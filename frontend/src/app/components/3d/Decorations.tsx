// ─────────────────────────────────────────────────────
// Decorations.tsx — Realistic garden decorations
// Procedural branching trees, instanced grass,
// natural flowers, mossy rocks, mushrooms, garden path
// ─────────────────────────────────────────────────────
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/* ═══════════════════════════════════════════════════
   PROCEDURAL TREE GEOMETRY GENERATOR
   Creates realistic branching tree structures
   ═══════════════════════════════════════════════════ */

interface Branch {
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
  depth: number;
}

function generateTreeBranches(
  seed: number,
  maxDepth = 4,
): { branches: Branch[]; leafPositions: THREE.Vector3[] } {
  const branches: Branch[] = [];
  const leafPositions: THREE.Vector3[] = [];

  function grow(
    start: THREE.Vector3,
    direction: THREE.Vector3,
    length: number,
    radius: number,
    depth: number,
    branchSeed: number,
  ) {
    const end = start.clone().add(direction.clone().multiplyScalar(length));
    branches.push({ start: start.clone(), end: end.clone(), radius, depth });

    if (depth >= maxDepth) {
      // Leaf cluster at terminal branches
      leafPositions.push(end.clone());
      return;
    }

    // Fork into 2-3 child branches
    const childCount = depth < 2 ? 3 : 2;
    for (let i = 0; i < childCount; i++) {
      const childSeed = branchSeed + i * 137 + depth * 53;
      const spreadAngle = 0.4 + seededRandom(childSeed) * 0.5;
      const rotY = ((i / childCount) * Math.PI * 2) + seededRandom(childSeed + 7) * 0.8;

      // Perturb direction
      const childDir = direction.clone();
      const axis = new THREE.Vector3(
        Math.cos(rotY),
        0,
        Math.sin(rotY),
      ).normalize();
      childDir.applyAxisAngle(axis, spreadAngle);
      // Add slight upward bias
      childDir.y = Math.max(childDir.y, 0.2);
      childDir.normalize();

      const childLength = length * (0.6 + seededRandom(childSeed + 3) * 0.2);
      const childRadius = radius * (0.55 + seededRandom(childSeed + 5) * 0.15);

      grow(end, childDir, childLength, childRadius, depth + 1, childSeed + 17);
    }
  }

  // Start the trunk pointing up with slight lean
  const lean = seededRandom(seed) * 0.15;
  grow(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(lean, 1, lean * 0.5).normalize(),
    1.8 + seededRandom(seed + 1) * 0.5,
    0.18 + seededRandom(seed + 2) * 0.06,
    0,
    seed,
  );

  return { branches, leafPositions };
}

/* ── Single Realistic Tree ─────────────────────────── */

function RealisticTree({ position, scale, seed }: {
  position: [number, number, number];
  scale: number;
  seed: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const { branches, leafPositions } = useMemo(
    () => generateTreeBranches(seed, 4),
    [seed],
  );

  // Derive leaf color from seed
  const leafColor = useMemo(() => {
    const h = 95 + seededRandom(seed * 3) * 40;
    const s = 40 + seededRandom(seed * 7) * 25;
    const l = 22 + seededRandom(seed * 11) * 14;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }, [seed]);

  const leafColorDark = useMemo(() => {
    const c = new THREE.Color(leafColor);
    c.multiplyScalar(0.7);
    return `#${c.getHexString()}`;
  }, [leafColor]);

  // Wind sway
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z = Math.sin(t * 0.25 + position[0] * 0.5) * 0.012;
    groupRef.current.rotation.x = Math.cos(t * 0.2 + position[2] * 0.3) * 0.008;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Branches — cylinder segments between branch start/end */}
      {branches.map((b, i) => {
        const dir = b.end.clone().sub(b.start);
        const len = dir.length();
        const mid = b.start.clone().add(b.end).multiplyScalar(0.5);

        // Orientation: point cylinder from start → end
        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(
          up,
          dir.clone().normalize(),
        );
        const euler = new THREE.Euler().setFromQuaternion(quat);

        // Bark color varies slightly per branch
        const barkL = 18 + seededRandom(seed + i * 13) * 10;
        const barkColor = `hsl(25, 25%, ${barkL}%)`;

        return (
          <mesh
            key={`branch-${i}`}
            position={[mid.x, mid.y, mid.z]}
            rotation={euler}
            castShadow
          >
            <cylinderGeometry args={[
              b.radius * 0.65, // top (thinner)
              b.radius,        // bottom
              len,
              b.depth < 2 ? 8 : 5,
            ]} />
            <meshStandardMaterial
              color={barkColor}
              roughness={0.92}
              metalness={0}
            />
          </mesh>
        );
      })}

      {/* Leaf clusters at branch endpoints */}
      {leafPositions.map((pos, i) => {
        const clusterSize = 0.5 + seededRandom(seed + i * 37) * 0.4;
        const isLight = seededRandom(seed + i * 43) > 0.4;
        return (
          <group key={`leaf-cluster-${i}`} position={[pos.x, pos.y, pos.z]}>
            {/* Main leaf sphere */}
            <mesh castShadow>
              <icosahedronGeometry args={[clusterSize, 2]} />
              <meshStandardMaterial
                color={isLight ? leafColor : leafColorDark}
                roughness={0.75}
                metalness={0}
              />
            </mesh>
            {/* Offset secondary blob for fullness */}
            <mesh
              position={[
                (seededRandom(seed + i * 47) - 0.5) * 0.4,
                seededRandom(seed + i * 53) * 0.3,
                (seededRandom(seed + i * 59) - 0.5) * 0.4,
              ]}
              castShadow
            >
              <icosahedronGeometry args={[clusterSize * 0.65, 1]} />
              <meshStandardMaterial
                color={isLight ? leafColorDark : leafColor}
                roughness={0.78}
                metalness={0}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ── Background Trees — ring of realistic trees ───── */

export function BackgroundTrees() {
  const trees = useMemo(() => {
    const arr: Array<{ pos: [number, number, number]; scale: number; seed: number }> = [];
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const r = 28 + seededRandom(i * 17) * 18;
      arr.push({
        pos: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
        scale: 1.0 + seededRandom(i * 7) * 1.8,
        seed: i * 127 + 42,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {trees.map((t, i) => (
        <RealisticTree key={i} position={t.pos} scale={t.scale} seed={t.seed} />
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════
   INSTANCED GRASS BLADES — GPU wind-animated
   ═══════════════════════════════════════════════════ */

export function GrassTufts() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 600;

  const { matrix, colors, windOffsets } = useMemo(() => {
    const m = new THREE.Matrix4();
    const matrices: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];
    const offsets: number[] = [];

    for (let i = 0; i < COUNT; i++) {
      const x = (seededRandom(i * 7) - 0.5) * 80;
      const z = (seededRandom(i * 13) - 0.5) * 80;
      const sc = 0.2 + seededRandom(i * 3) * 0.5;
      const rotation = seededRandom(i * 11) * Math.PI * 2;

      m.makeRotationY(rotation);
      m.setPosition(x, sc * 0.2, z);
      m.scale(new THREE.Vector3(0.15, sc, 0.08));
      matrices.push(m.clone());

      const h = 90 + seededRandom(i * 17) * 35;
      const s = 50 + seededRandom(i * 23) * 30;
      const l = 20 + seededRandom(i * 29) * 18;
      cols.push(new THREE.Color(`hsl(${h}, ${s}%, ${l}%)`));

      offsets.push(seededRandom(i * 31) * Math.PI * 2);
    }

    return { matrix: matrices, colors: cols, windOffsets: offsets };
  }, []);

  useMemo(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const colorAttr = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      mesh.setMatrixAt(i, matrix[i]);
      colorAttr[i * 3] = colors[i].r;
      colorAttr[i * 3 + 1] = colors[i].g;
      colorAttr[i * 3 + 2] = colors[i].b;
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(colorAttr, 3);
  }, [matrix, colors]);

  const tmpMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);
  const tmpScale = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < COUNT; i++) {
      meshRef.current.getMatrixAt(i, tmpMatrix);
      tmpMatrix.decompose(tmpPos, tmpQuat, tmpScale);

      const windAngle = Math.sin(t * 1.5 + windOffsets[i]) * 0.12
                       + Math.sin(t * 0.7 + windOffsets[i] * 2) * 0.06;
      const euler = new THREE.Euler(0, 0, windAngle);
      tmpQuat.setFromEuler(euler);

      tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
      meshRef.current.setMatrixAt(i, tmpMatrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} castShadow>
      <coneGeometry args={[1, 1, 3]} />
      <meshStandardMaterial
        vertexColors
        roughness={0.85}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════════
   FLOWERS — Petal geometry with stems
   ═══════════════════════════════════════════════════ */

function SingleFlower({ position, color, scale }: {
  position: [number, number, number];
  color: string;
  scale: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z = Math.sin(t * 0.8 + position[0] * 10) * 0.05;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Stem */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.3, 4]} />
        <meshStandardMaterial color="#2e6b1e" roughness={0.8} />
      </mesh>
      {/* Petals */}
      {[0, 1, 2, 3, 4].map((j) => {
        const a = (j / 5) * Math.PI * 2;
        return (
          <mesh
            key={j}
            position={[Math.cos(a) * 0.08, 0.32, Math.sin(a) * 0.08]}
            rotation={[0.3, a, 0]}
          >
            <circleGeometry args={[0.08, 6]} />
            <meshStandardMaterial
              color={color}
              roughness={0.5}
              side={THREE.DoubleSide}
              emissive={color}
              emissiveIntensity={0.08}
            />
          </mesh>
        );
      })}
      {/* Center pistil */}
      <mesh position={[0, 0.33, 0]}>
        <sphereGeometry args={[0.04, 6, 4]} />
        <meshStandardMaterial color="#ffd54f" roughness={0.4} emissive="#ffd54f" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

export function Flowers() {
  const flowers = useMemo(() => {
    const palette = ["#e91e63", "#ff5722", "#ffeb3b", "#ce93d8", "#ef5350", "#ff9800", "#f48fb1", "#ba68c8"];
    const arr: Array<{ pos: [number, number, number]; color: string; scale: number }> = [];
    for (let i = 0; i < 100; i++) {
      arr.push({
        pos: [
          (seededRandom(i * 23) - 0.5) * 55,
          0,
          (seededRandom(i * 31) - 0.5) * 55,
        ],
        color: palette[Math.floor(seededRandom(i * 19) * palette.length)],
        scale: 0.6 + seededRandom(i * 37) * 0.8,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {flowers.map((f, i) => (
        <SingleFlower key={i} position={f.pos} color={f.color} scale={f.scale} />
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════
   GARDEN PATH
   ═══════════════════════════════════════════════════ */

export function GardenPath() {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-15, 0.03, 20),
      new THREE.Vector3(-5, 0.03, 10),
      new THREE.Vector3(0, 0.03, 5),
      new THREE.Vector3(5, 0.03, 0),
      new THREE.Vector3(10, 0.03, -5),
      new THREE.Vector3(5, 0.03, -12),
      new THREE.Vector3(-5, 0.03, -15),
    ]);

    const shape = new THREE.Shape();
    shape.moveTo(-0.6, 0);
    shape.lineTo(0.6, 0);

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 60,
      bevelEnabled: false,
      extrudePath: curve,
    });
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#8d7460" roughness={0.95} metalness={0} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════
   STONES — Natural rocks with moss
   ═══════════════════════════════════════════════════ */

export function Stones() {
  const stones = useMemo(() => {
    const arr: Array<{
      pos: [number, number, number];
      scale: [number, number, number];
      rotation: number;
      hasMoss: boolean;
    }> = [];
    for (let i = 0; i < 30; i++) {
      arr.push({
        pos: [
          (seededRandom(i * 41) - 0.5) * 45,
          0.05,
          (seededRandom(i * 47) - 0.5) * 45,
        ],
        scale: [
          0.15 + seededRandom(i * 53) * 0.25,
          0.1 + seededRandom(i * 59) * 0.12,
          0.15 + seededRandom(i * 61) * 0.25,
        ],
        rotation: seededRandom(i * 67) * Math.PI * 2,
        hasMoss: seededRandom(i * 73) > 0.5,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {stones.map((s, i) => (
        <group key={i} position={s.pos} rotation={[0, s.rotation, 0]} scale={s.scale}>
          <mesh castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={`hsl(25, ${8 + seededRandom(i) * 8}%, ${35 + seededRandom(i * 5) * 20}%)`}
              roughness={0.95}
              metalness={0}
            />
          </mesh>
          {s.hasMoss && (
            <mesh position={[0, 0.6, 0]} scale={[1.1, 0.3, 1.1]}>
              <sphereGeometry args={[0.6, 6, 4]} />
              <meshStandardMaterial
                color="#4a7a3a"
                roughness={0.9}
                transparent
                opacity={0.7}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════
   MUSHROOMS
   ═══════════════════════════════════════════════════ */

export function Mushrooms() {
  const mushrooms = useMemo(() => {
    const arr: Array<{ pos: [number, number, number]; scale: number; color: string }> = [];
    const capColors = ["#c4956a", "#b87333", "#8b6e4e", "#d4a574", "#e8c9a0"];
    for (let i = 0; i < 25; i++) {
      arr.push({
        pos: [
          (seededRandom(i * 83) - 0.5) * 40,
          0,
          (seededRandom(i * 89) - 0.5) * 40,
        ],
        scale: 0.05 + seededRandom(i * 97) * 0.08,
        color: capColors[Math.floor(seededRandom(i * 101) * capColors.length)],
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {mushrooms.map((m, i) => (
        <group key={i} position={m.pos} scale={m.scale}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.3, 0.4, 1, 6]} />
            <meshStandardMaterial color="#f5eed6" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.7, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color={m.color} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
