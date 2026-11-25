import { useEffect, useRef, useState } from 'react';
import { easeLevel, type SoundLevels } from './waves';
import { FREQUENCY_BANDS, readFrequencyBands, microphoneLevel, easeAudioResponse } from './frequency';

export function useMicrophone() {
  const [status, setStatus] = useState<'off' | 'requesting' | 'on' | 'error'>('off');
  const [message, setMessage] = useState('마이크를 켜고 목소리나 음악을 들려주세요.');
  const levels = useRef<SoundLevels>({ level: 0, bass: 0, mid: 0, high: 0, bands: new Float32Array(FREQUENCY_BANDS) });
  const bandTargets = useRef(new Float32Array(FREQUENCY_BANDS));
  const resources = useRef<{
    context: AudioContext; stream: MediaStream; source: MediaStreamAudioSourceNode;
    analyser: AnalyserNode; spectrum: Uint8Array<ArrayBuffer>; waveform: Float32Array<ArrayBuffer>;
  } | null>(null);
  const generation = useRef(0);
  const pending = useRef(false);

  function release() {
    const active = resources.current;
    resources.current = null;
    if (active) {
      active.stream.getTracks().forEach(track => { track.onended = null; track.stop(); });
      active.source.disconnect();
      active.analyser.disconnect();
      void active.context.close().catch(() => {});
    }
  }

  useEffect(() => () => { generation.current++; release(); }, []);

  function stop() {
    generation.current++;
    pending.current = false;
    release();
    setStatus('off');
    setMessage('마이크가 꺼졌습니다. 글자는 계속 천천히 움직입니다.');
  }

  async function start() {
    if (pending.current || resources.current) return;
    const token = ++generation.current;
    pending.current = true;
    setStatus('requesting');
    setMessage('브라우저에서 마이크 사용을 허용해 주세요.');
    let context: AudioContext | undefined;
    let stream: MediaStream | undefined;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('UNSUPPORTED');
      context = new AudioContext();
      await context.resume();
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false,
      });
      if (token !== generation.current) {
        stream.getTracks().forEach(track => track.stop());
        await context.close();
        return;
      }
      const analyser = context.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0.7;
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser); // No speaker connection, recording, or upload.
      resources.current = {
        context, stream, source, analyser,
        spectrum: new Uint8Array(analyser.frequencyBinCount),
        waveform: new Float32Array(analyser.fftSize),
      };
      stream.getAudioTracks().forEach(track => {
        track.onended = () => {
          stop();
          setMessage('마이크 연결이 끊겼습니다. 다시 켜 주세요.');
        };
      });
      setStatus('on');
      setMessage('소리를 듣고 있어요. 목소리나 음악에 글자가 반응합니다.');
    } catch (error) {
      stream?.getTracks().forEach(track => track.stop());
      if (context && context.state !== 'closed') await context.close().catch(() => {});
      if (token !== generation.current) return;
      const name = error instanceof Error ? error.name : '';
      setStatus('error');
      setMessage(name === 'NotAllowedError'
        ? '마이크 권한이 차단되었습니다. 주소창의 마이크 권한을 허용한 뒤 다시 시도해 주세요.'
        : name === 'NotFoundError' ? '마이크를 찾지 못했습니다. 마이크를 연결하고 다시 시도해 주세요.'
        : '마이크를 열지 못했습니다. 다른 앱의 사용 여부와 브라우저 권한을 확인해 주세요.');
    } finally {
      if (token === generation.current) pending.current = false;
    }
  }

  function sample(delta: number, sensitivity: number) {
    const active = resources.current;
    let level = 0, bass = 0, mid = 0, high = 0;
    bandTargets.current.fill(0);
    if (active && active.context.state === 'running' && !active.stream.getAudioTracks()[0]?.muted) {
      const { analyser, waveform, spectrum, context } = active;
      analyser.getFloatTimeDomainData(waveform);
      analyser.getByteFrequencyData(spectrum);
      let sum = 0;
      for (const value of waveform) sum += value * value;
      const rms = Math.sqrt(sum / waveform.length);
      level = microphoneLevel(rms, sensitivity);
      const band = (lo: number, hi: number) => {
        const first = Math.max(1, Math.floor(lo * analyser.fftSize / context.sampleRate));
        const last = Math.min(spectrum.length - 1, Math.ceil(hi * analyser.fftSize / context.sampleRate));
        let total = 0;
        for (let i = first; i <= last; i++) total += spectrum[i] / 255;
        return total / Math.max(1, last - first + 1) * level;
      };
      bass = band(40, 250); mid = band(250, 2400); high = band(2400, 10000);
      readFrequencyBands(spectrum, context.sampleRate, analyser.fftSize, level, bandTargets.current);
    }
    const current = levels.current;
    current.level = easeLevel(current.level, level, delta);
    current.bass = easeLevel(current.bass, bass, delta);
    current.mid = easeLevel(current.mid, mid, delta);
    current.high = easeLevel(current.high, high, delta);
    for (let i = 0; i < FREQUENCY_BANDS; i++) {
      current.bands![i] = easeAudioResponse(current.bands![i], bandTargets.current[i], delta);
    }
  }

  return { status, message, levels, start, stop, sample };
}



