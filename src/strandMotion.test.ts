import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStrandMotion, PATH_SAMPLES, strandSeed } from './strandMotion.ts';

test('each frequency moves only its own strand and crossing is allowed', () => {
  const motion = createStrandMotion(22);
  const phases = Float32Array.from({ length: 22 }, (_, i) => strandSeed(i + 1) * Math.PI * 2);
  const bands = new Float32Array(22);
  motion.update(phases, bands, 0, 11, 0);
  const before = motion.data.slice();
  bands[10] = 1;
  motion.update(phases, bands, 0, 11, 0);
  let maxChange = 0;
  for (let id = 0; id < 22; id++) for (let j = 0; j < PATH_SAMPLES; j++) {
    const index = (id * PATH_SAMPLES + j) * 4;
    assert.ok(Number.isFinite(motion.data[index]));
    if (id !== 10) assert.equal(motion.data[index], before[index]);
    else maxChange = Math.max(maxChange, Math.abs(motion.data[index] - before[index]));
  }
  assert.ok(maxChange > 4);
});
test('stronger frequency input produces larger motion without synchronizing every strand', () => {
  const motion = createStrandMotion(22);
  const phases = Float32Array.from({ length: 22 }, (_, i) => strandSeed(i + 1) * Math.PI * 2);
  const bands = new Float32Array(22);
  motion.update(phases, bands, 0, 11, 0);
  const quiet = motion.data.slice();
  bands.fill(0.9);
  motion.update(phases, bands, 0, 11, 0);
  let change = 0;
  for (let i = 0; i < quiet.length; i += 4) change += (motion.data[i] - quiet[i]) ** 2;
  assert.ok(Math.sqrt(change / (22 * PATH_SAMPLES)) > 0.8);
  // Active lines retain different shapes and do not synchronize.
  const slopes = Array.from({ length: 22 }, (_, i) =>
    motion.data[(i * PATH_SAMPLES + 160) * 4] - motion.data[i * PATH_SAMPLES * 4]);
  assert.ok(Math.max(...slopes) - Math.min(...slopes) > 0.8);
});


