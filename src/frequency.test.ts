import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FREQUENCY_BANDS, readFrequencyBands } from './frequency.ts';

test('low and high tones excite different strands, and silence clears every band', () => {
  const spectrum = new Uint8Array(4096);
  const output = new Float32Array(FREQUENCY_BANDS);
  const peak = (hz: number) => {
    spectrum.fill(0);
    spectrum[Math.round(hz * 8192 / 48000)] = 255;
    readFrequencyBands(spectrum, 48000, 8192, 0.7, output);
    assert.ok(output.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
    return output.indexOf(Math.max(...output));
  };
  const low = peak(100);
  const high = peak(4000);
  assert.ok(high > low + 10);
  readFrequencyBands(spectrum, 48000, 8192, 0, output);
  assert.ok(output.every(value => value === 0));
});

test('quiet sound is visible, loud sound is stronger, and the release is gradual', async () => {
  const { microphoneLevel, easeAudioResponse } = await import('./frequency.ts');
  assert.equal(microphoneLevel(0, 2), 0);
  assert.ok(microphoneLevel(0.002, 2) > 0.1);
  assert.ok(microphoneLevel(0.03, 2) > microphoneLevel(0.002, 2) * 3);
  let value = 0;
  for (let i = 0; i < 30; i++) value = easeAudioResponse(value, 1, 1 / 60);
  assert.ok(value > 0.95);
  for (let i = 0; i < 60; i++) value = easeAudioResponse(value, 0, 1 / 60);
  assert.ok(value > 0.6 && value < 0.8);
  for (let i = 0; i < 14 * 60; i++) value = easeAudioResponse(value, 0, 1 / 60);
  assert.ok(value < 0.01);
});
