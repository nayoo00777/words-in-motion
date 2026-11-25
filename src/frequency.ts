export const FREQUENCY_BANDS = 22;

export function microphoneLevel(rms: number, sensitivity: number) {
  return 1 - Math.exp(-Math.pow(Math.max(0, rms - 0.00035) * 24 * sensitivity, 0.75));
}

export function easeAudioResponse(current: number, target: number, delta: number) {
  const seconds = target > current ? 0.16 : 2.8;
  return current + (target - current) * (1 - Math.exp(-Math.min(delta, 0.1) / seconds));
}

// Logarithmic bands give bass and treble comparable space in the artwork.
export function readFrequencyBands(spectrum: Uint8Array, sampleRate: number, fftSize: number, level: number, output: Float32Array) {
  const upper = Math.min(12000, sampleRate * 0.48);
  for (let band = 0; band < output.length; band++) {
    const low = 55 * (upper / 55) ** (band / output.length);
    const high = 55 * (upper / 55) ** ((band + 1) / output.length);
    const first = Math.max(1, Math.ceil(low * fftSize / sampleRate));
    const last = Math.min(spectrum.length - 1, Math.max(first, Math.ceil(high * fftSize / sampleRate) - 1));
    let sum = 0;
    for (let bin = first; bin <= last; bin++) sum += (spectrum[bin] / 255) ** 2;
    output[band] = Math.min(1, Math.sqrt(sum / Math.max(1, last - first + 1)) * Math.sqrt(level) * 1.8);
  }
}
