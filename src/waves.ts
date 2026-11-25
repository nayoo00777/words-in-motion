export interface SoundLevels { level: number; bass: number; mid: number; high: number; bands?: Float32Array }

export function easeExpansion(current: number, target: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-Math.min(dt, 0.1) / (target > current ? 0.4 : 3.8)));
}

export function easeLevel(current: number, target: number, dt: number) {
  // A rounded attack and lingering release turn sharp sounds into rolling swells.
  return current + (target - current) * (1 - Math.exp(-Math.min(dt, 0.1) / (target > current ? 0.24 : 1.2)));
}

export function waveRadius(x: number, y: number, z: number, time: number, sound: SoundLevels) {
  const swell = Math.sin(x * 2.1 + y * 2.6 - time * 0.85)
    * Math.cos(z * 1.7 + time * 0.32);
  const crossWave = Math.sin(z * 3.2 - y * 2.2 - time * 1.05);
  const ripple = Math.sin(x * 5 + z * 4 + y * 2 - time * 1.4);
  const displacement = swell * (0.14 + sound.level * 2.4 + sound.bass * 1.7)
    + crossWave * (sound.level * 0.55 + sound.mid * 0.8) + ripple * sound.high * 0.22;
  // Soft limiting preserves a flowing silhouette even at full microphone volume.
  return 5 + 2.8 * Math.tanh(displacement / 2.8);
}

export function wavePosition<T extends { x: number; y: number; z: number }>(
  target: T, x: number, y: number, z: number, time: number, sound: SoundLevels,
) {
  const radius = waveRadius(x, y, z, time, sound);
  const flow = sound.level * 0.65 + sound.bass * 0.3;
  // Tangential motion lifts the strands instead of only inflating their radius.
  target.x = x * radius + flow * 0.45 * Math.sin(y * 2.4 + z * 1.6 - time * 0.7);
  target.y = y * radius + flow * (1 - y * y) * Math.sin(x * 2.7 + z * 2.2 - time * 0.95);
  target.z = z * radius + flow * 0.45 * Math.cos(y * 2.2 - x * 1.7 - time * 0.6);
  return target;
}
