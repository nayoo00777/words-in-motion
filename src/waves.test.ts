import assert from 'node:assert/strict';
import { test } from 'node:test';
import { easeLevel, waveRadius, wavePosition } from './waves.ts';

test('silence settles, while loud audio creates bounded, stronger waves', () => {
  let quietEnergy = 0, loudEnergy = 0;
  const quiet = { level: 0, bass: 0, mid: 0, high: 0 };
  const loud = { level: 1, bass: 1, mid: 1, high: 1 };
  for (let i = 0; i < 1000; i++) {
    const y = 1 - 2 * i / 999;
    const x = Math.sqrt(1 - y * y) * Math.cos(i * 2.4);
    const z = Math.sqrt(1 - y * y) * Math.sin(i * 2.4);
    const q = waveRadius(x, y, z, 3, quiet);
    const r = waveRadius(x, y, z, 3, loud);
    assert.ok(Number.isFinite(r) && r > 2.2 && r < 7.8);
    quietEnergy += (q - 5) ** 2;
    loudEnergy += (r - 5) ** 2;
    // Spatially close points stay close, avoiding spikes or broken strands.
    assert.ok(Math.abs(r - waveRadius(x + 0.0001, y, z, 3, loud)) < 0.002);
  }
  assert.ok(loudEnergy > quietEnergy * 20);
});

test('envelope is smooth, frame-rate independent, and fades after disconnect', () => {
  const run = (fps: number, initial: number, target: number, seconds: number) => {
    let value = initial;
    for (let i = 0; i < fps * seconds; i++) value = easeLevel(value, target, 1 / fps);
    return value;
  };
  assert.ok(easeLevel(0, 1, 1 / 60) < 0.2);
  assert.ok(Math.abs(run(30, 0, 1, 1) - run(120, 0, 1, 1)) < 1e-9);
  assert.ok(run(60, 1, 0, 6) < 0.01);
  assert.ok(easeLevel(1, 0, 1 / 60) > 0.95);
});

test('strands lift away from the equator and stay temporally continuous', () => {
  const sound = { level: 0.8, bass: 0.6, mid: 0.4, high: 0.2 };
  const a = { x: 0, y: 0, z: 0 }, b = { ...a };
  wavePosition(a, 1, 0, 0, 1, sound);
  assert.ok(Math.abs(a.y) > 0.5);
  for (let i = 0; i < 600; i++) {
    wavePosition(a, 0.6, 0, 0.8, i / 60, sound);
    wavePosition(b, 0.6, 0, 0.8, (i + 1) / 60, sound);
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 0.12);
    assert.ok(Math.hypot(a.x, a.y, a.z) < 8.5);
  }
});

// Expansion has its own slow release, independent of the motion-speed slider.
test('screen expansion rises quickly and returns gradually at any frame rate', async () => {
  const { easeExpansion } = await import('./waves.ts');
  const run = (fps: number, initial: number, target: number, seconds: number) => {
    let v = initial;
    for (let i = 0; i < fps * seconds; i++) v = easeExpansion(v, target, 1 / fps);
    return v;
  };
  assert.ok(run(60, 0, 1, 1) > 0.9);
  assert.ok(run(60, 1, 0, 1) > 0.75);
  assert.ok(run(60, 1, 0, 4) > 0.3);
  assert.ok(run(60, 1, 0, 20) < 0.01);
  assert.ok(Math.abs(run(30, 1, 0, 4) - run(120, 1, 0, 4)) < 1e-9);
});
