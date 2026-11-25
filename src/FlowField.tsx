import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { easeExpansion, type SoundLevels } from './waves';
import { FREQUENCY_BANDS } from './frequency';
import { createStrandMotion, PATH_SAMPLES, strandSeed } from './strandMotion';

const STRANDS = FREQUENCY_BANDS;
const vertex = `
  uniform float uTime;
  uniform vec4 uSound;
  uniform float uExpansion;
  uniform vec2 uExtent;
  uniform vec2 uResolution;
  uniform float uBands[22];
  uniform float uPhases[22];
  uniform sampler2D uPaths;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vEdge;
  float hash(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
  vec3 pathPoint(float u, float id) {
    float lane = id / 21.0 - 0.5;
    float c = hash(id + 191.0);
    float response = uBands[int(id)];
    float phase = uPhases[int(id)];
    float midWave = sin(u * mix(5.7, 10.0, id / 21.0) + phase * 0.63 + lane * 1.1);
    float x = (u * 2.0 - 1.0) * mix(13.0, uExtent.x * 1.08, uExpansion);
    float y = texture2D(uPaths, vec2((u * 320.0 + 0.5) / 321.0, (id + 0.5) / 22.0)).r;
    float z = sin(u * 4.0 + lane * 2.0 + phase * 0.45) * (0.7 + response * 1.8)
      + (c - 0.5) * 1.3 + midWave * response * 0.7;
    float angle = sin(uTime * 0.12) * 0.018;
    vec2 rotated = mat2(cos(angle), sin(angle), -sin(angle), cos(angle)) * vec2(x, y);
    x = rotated.x + (c - 0.5) * uExpansion * 0.7;
    y = rotated.y;
    z += (c - 0.5) * uExpansion * 5.0;
    float drift = mix(sin(uTime * 0.38 + lane * 1.4), sin(uTime * 0.31 + 2.1 + lane * 1.6), smoothstep(0.0, 1.0, u));
    x += drift * (0.8 + response * 1.1);
    z += mix(cos(uTime * 0.29 + lane), sin(uTime * 0.34 + lane + 1.7), u) * (0.55 + response * 0.7);
    return vec3(x, y + 0.6, z);
  }
  void main() {
    float u = position.x;
    float id = position.y;
    float side = position.z;
    float response = pow(max(0.0, uBands[int(id)]), 0.7);
    vec4 center = projectionMatrix * modelViewMatrix * vec4(pathPoint(u, id), 1.0);
    vec4 before = projectionMatrix * modelViewMatrix * vec4(pathPoint(max(0.0, u - 0.0015), id), 1.0);
    vec4 after = projectionMatrix * modelViewMatrix * vec4(pathPoint(min(1.0, u + 0.0015), id), 1.0);
    vec2 tangent = (after.xy / after.w - before.xy / before.w) * uResolution;
    tangent /= max(length(tangent), 0.0001);
    vec2 normal = vec2(-tangent.y, tangent.x);
    // Screen-space ribbons work consistently on browsers where GL lines are only 1px wide.
    float width = 2.5 + response * 3.7 + uSound.x * 0.6;
    center.xy += normal * side * width / uResolution * center.w;
    gl_Position = center;
    vEdge = side;
    vec3 cyan = vec3(0.2, 1.35, 1.65);
    vec3 violet = vec3(1.1, 0.45, 1.55);
    vColor = mix(cyan, violet, step(0.8, hash(id + 71.0)) * 0.8) * (1.05 + response * 1.05);
    float endFade = smoothstep(0.0, 0.025, u) * smoothstep(0.0, 0.025, 1.0 - u);
    vAlpha = endFade * (0.8 + response * 0.2);
  }
`;
const fragment = `
  uniform float uGlow;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vEdge;
  void main() {
    float edge = 1.0 - smoothstep(0.55, 1.0, abs(vEdge));
    gl_FragColor = vec4(vColor * uGlow, vAlpha * edge);
  }
`;

export function FlowField({ levels, speed, glow }: {
  levels: RefObject<SoundLevels>; speed: number; glow: number;
}) {
  const clock = useRef(0);
  const { camera, size } = useThree();
  const motion = useMemo(() => createStrandMotion(STRANDS), []);
  const pathTexture = useMemo(() => {
    const texture = new THREE.DataTexture(motion.data, PATH_SAMPLES, STRANDS, THREE.RGBAFormat, THREE.FloatType);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }, [motion]);
  useEffect(() => () => pathTexture.dispose(), [pathTexture]);
  const data = useMemo(() => {
    const vertices: number[] = [], indices: number[] = [];
    for (let s = 0; s < STRANDS; s++) {
      const base = s * PATH_SAMPLES * 2;
      for (let i = 0; i < PATH_SAMPLES; i++) {
        vertices.push(i / (PATH_SAMPLES - 1), s, -1, i / (PATH_SAMPLES - 1), s, 1);
        if (i < PATH_SAMPLES - 1) {
          const v = base + i * 2;
          indices.push(v, v + 1, v + 2, v + 2, v + 1, v + 3);
        }
      }
    }
    return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
  }, []);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uSound: { value: new THREE.Vector4() }, uGlow: { value: 1.0 },
    uExpansion: { value: 0 }, uExtent: { value: new THREE.Vector2(14, 11) },
    uResolution: { value: new THREE.Vector2(1100, 880) },
    uBands: { value: new Float32Array(STRANDS) },
    uPhases: { value: Float32Array.from({ length: STRANDS }, (_, id) => strandSeed(id + 1) * Math.PI * 2) },
    uPaths: { value: pathTexture },
  }), [pathTexture]);
  useFrame((_, delta) => {
    clock.current += Math.min(delta, 0.1) * speed * (1 + levels.current.level * 0.65);
    uniforms.uTime.value = clock.current;
    const s = levels.current;
    for (let i = 0; i < STRANDS; i++) {
      const response = s.bands?.[i] ?? 0;
      uniforms.uBands.value[i] = response;
      uniforms.uPhases.value[i] += Math.min(delta, 0.1) * speed
        * (0.28 + strandSeed(i + 31) * 0.52 + i / STRANDS * 0.18 + response * (0.65 + strandSeed(i + 51) * 0.65));
    }
    uniforms.uSound.value.set(s.level, s.bass, s.mid, s.high);
    uniforms.uExpansion.value = easeExpansion(uniforms.uExpansion.value, Math.min(1, s.level * 1.5), delta);
    uniforms.uGlow.value = glow * (1.1 + s.level * 0.25);
    uniforms.uResolution.value.set(size.width, size.height);
    camera.position.z = Math.max(28, 34 / (size.width / size.height));
    const halfHeight = Math.tan(21 * Math.PI / 180) * camera.position.z;
    uniforms.uExtent.value.set(halfHeight * size.width / size.height, halfHeight);
    motion.update(uniforms.uPhases.value, uniforms.uBands.value, uniforms.uExpansion.value, halfHeight, clock.current);
    pathTexture.needsUpdate = true;
  });
  return <mesh frustumCulled={false}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[data.vertices, 3]} />
      <bufferAttribute attach="index" args={[data.indices, 1]} />
    </bufferGeometry>
    <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms}
      transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
  </mesh>;
}
