/** @license SPDX-License-Identifier: Apache-2.0 */
import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { FlowField } from './FlowField';
function Sampler({ tick }: { tick: (delta: number) => void }) { useFrame((_, delta) => tick(delta), -1); return null; }


import { useMicrophone } from './useMicrophone';
import './index.css';

export default function WaveApp() {
  useEffect(() => { document.title = 'Resonance — 빛의 물결'; }, []);
  const mic = useMicrophone();
  const [sensitivity, setSensitivity] = useState(2);
  const [speed, setSpeed] = useState(0.8);
  const [glow, setGlow] = useState(1.1);
  const [controls, setControls] = useState(true);
  const meter = useRef<HTMLDivElement>(null);
  const listening = mic.status === 'on';
  return <main className="installation">
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 1, 28], fov: 42 }} gl={{ antialias: false }}>
      <color attach="background" args={['#010709']} />
      <Sampler tick={delta => {
      mic.sample(delta, sensitivity);
      if (meter.current) meter.current.style.transform = `scaleX(${mic.levels.current.level})`;
    }} />
      <FlowField levels={mic.levels} speed={speed} glow={glow} />
      <EffectComposer enableNormalPass={false}><Bloom luminanceThreshold={0.8} mipmapBlur intensity={0.65} radius={0.5} /></EffectComposer>
    </Canvas>

    <header className="masthead">
      <div><p className="eyebrow">IMMERSIVE SOUND SCULPTURE / 01</p><h1>빛의 물결<span>RESONANCE</span></h1></div>
      <button className="quiet-button" onClick={() => setControls(!controls)} aria-expanded={controls} aria-controls="sound-controls">{controls ? '설정 숨기기' : '설정 열기'}</button>
    </header>
    <div className="scene-caption"><span className={listening ? 'live-dot active' : 'live-dot'} />{listening ? 'LIVE AUDIO · 소리와 함께 흐르는 빛' : 'AMBIENT · 소리를 기다리는 물결'}</div>
    {controls && <section id="sound-controls" className="control-panel" aria-label="파동 설정">
      <div className="microphone-control">
        <button className={'mic-button ' + (listening ? 'listening' : '')} aria-pressed={listening}
          onClick={listening || mic.status === 'requesting' ? mic.stop : mic.start}>
          <span>{listening ? '◉' : '◎'}</span>{listening ? '마이크 끄기' : mic.status === 'requesting' ? '권한 요청 취소' : '마이크 켜기'}
        </button>
        <div className="level-track" aria-hidden="true"><div ref={meter} /></div>
      </div>
      <label className="setting">소리 감도 <output>{sensitivity.toFixed(1)}×</output><input aria-label="소리 감도" type="range" min="0.5" max="4" step="0.1" value={sensitivity} onChange={e => setSensitivity(+e.target.value)} /></label>
      <label className="setting">움직임 속도 <output>{speed.toFixed(1)}×</output><input aria-label="움직임 속도" type="range" min="0.1" max="2" step="0.1" value={speed} onChange={e => setSpeed(+e.target.value)} /></label>
      <label className="setting">빛의 강도 <output>{glow.toFixed(1)}×</output><input aria-label="빛의 강도" type="range" min="0.4" max="2" step="0.1" value={glow} onChange={e => setGlow(+e.target.value)} /></label>
      <p className="mic-status" role="status">{mic.message}<span>마이크 소리는 저장하거나 전송하지 않습니다.</span></p>
    </section>}
  </main>;
}





