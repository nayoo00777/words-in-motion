import { useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { wavePosition, type SoundLevels } from './waves';

const RINGS = 40;
const SEGMENTS = 192;

export function WaveLines({ levels, hue, speed }: {
  levels: RefObject<SoundLevels>; hue: number; speed: number;
}) {
  const attribute = useRef<THREE.BufferAttribute>(null!);
  const material = useRef<THREE.LineBasicMaterial>(null!);
  const rotation = useRef(0);
  const point = useMemo(() => new THREE.Vector3(), []);
  const { directions, positions } = useMemo(() => {
    const directions = new Float32Array(RINGS * SEGMENTS * 2 * 3);
    let cursor = 0;
    for (let ring = 0; ring < RINGS; ring++) {
      const phi = (ring + 1) / (RINGS + 1) * Math.PI;
      for (let segment = 0; segment < SEGMENTS; segment++) {
        for (let endpoint = 0; endpoint < 2; endpoint++) {
          const theta = ((segment + endpoint) % SEGMENTS) / SEGMENTS * Math.PI * 2;
          directions[cursor++] = Math.cos(theta) * Math.sin(phi);
          directions[cursor++] = Math.cos(phi);
          directions[cursor++] = Math.sin(theta) * Math.sin(phi);
        }
      }
    }
    return { directions, positions: new Float32Array(directions.length) };
  }, []);

  useFrame((state, delta) => {
    rotation.current += delta * speed;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < directions.length; i += 3) {
      const x = directions[i], y = directions[i + 1], z = directions[i + 2];
      wavePosition(point, x, y, z, t, levels.current);
      const angle = rotation.current * (0.2 + Math.sin(Math.acos(y) * 2) * 0.1);
      positions[i] = point.x * Math.cos(angle) + point.z * Math.sin(angle);
      positions[i + 1] = point.y;
      positions[i + 2] = -point.x * Math.sin(angle) + point.z * Math.cos(angle);
    }
    attribute.current.needsUpdate = true;
    material.current.color.setHSL((hue + t * 0.025) % 1, 0.8, 0.65);
    material.current.opacity = 0.25 + levels.current.level * 0.4;
  });

  return <lineSegments frustumCulled={false}>
    <bufferGeometry>
      <bufferAttribute ref={attribute} attach="attributes-position" args={[positions, 3]} usage={THREE.DynamicDrawUsage} />
    </bufferGeometry>
    <lineBasicMaterial ref={material} transparent opacity={0.3} depthWrite={false}
      blending={THREE.AdditiveBlending} toneMapped={false} />
  </lineSegments>;
}
