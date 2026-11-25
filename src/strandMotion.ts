export const PATH_SAMPLES = 321;
export function strandSeed(id: number) {
  const value = Math.sin(id * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export function createStrandMotion(count: number) {
  const data = new Float32Array(count * PATH_SAMPLES * 4);
  function update(phases: Float32Array, bands: Float32Array, expansion: number, height: number, time: number) {
    const span = 10.5 + expansion * (height * 1.65 - 10.5);
    for (let id = 0; id < count; id++) {
      const lane = id / (count - 1) - 0.5;
      const seed = strandSeed(id + 1);
      const rhythm = phases[id];
      const response = Math.pow(Math.max(0, bands[id]), 0.75);
      const direction = seed > 0.5 ? 1 : -1;
      for (let sample = 0; sample < PATH_SAMPLES; sample++) {
        const u = sample / (PATH_SAMPLES - 1);
        const longWave = Math.sin(u * (3.5 + strandSeed(id + 71) * 3.2) - rhythm * direction);
        const counterWave = Math.sin(u * (5 + strandSeed(id + 191) * 3) + rhythm * 0.57 + seed * 4);
        const tips = (1 - u) * Math.sin(rhythm * 0.41 + seed * 5)
          + u * Math.cos(rhythm * 0.34 + seed * 3);
        // Each line is independent: crossing is allowed, with no neighbor correction.
        data[(id * PATH_SAMPLES + sample) * 4] = lane * span
          + longWave * (0.25 + response * 6.8)
          + counterWave * (0.08 + response * 1.7)
          + tips * (0.18 + response * 1.1)
          + Math.sin(time * 0.22 + u * 3) * expansion * 0.6;
      }
    }
  }
  return { data, update };
}
