/** @license SPDX-License-Identifier: Apache-2.0 */
import { useRef, useState } from 'react';
import { TypeField } from './TypeField';


import { useMicrophone } from './useMicrophone';
import './index.css';

export default function App() {
  const mic = useMicrophone();
  const [sensitivity, setSensitivity] = useState(2);
  const [speed, setSpeed] = useState(0.8);
  const [glow, setGlow] = useState(1.1);
  const [controls, setControls] = useState(true);
  const meter = useRef<HTMLDivElement>(null);
  const listening = mic.status === 'on';
  return <main className="installation paper-installation">
    <TypeField levels={mic.levels} speed={speed} glow={glow} tick={delta => {
      mic.sample(delta, sensitivity);
      if (meter.current) meter.current.style.transform = `scaleX(${mic.levels.current.level})`;
    }} />

    <header className="masthead">
      <div><p className="eyebrow">MOVABLE TYPE / SOUND REACTIVE</p><h1>소리의 활자<span>WORDS IN MOTION</span></h1></div>
      <button className="quiet-button" onClick={() => setControls(!controls)} aria-expanded={controls} aria-controls="sound-controls">{controls ? '설정 숨기기' : '설정 열기'}</button>
    </header>
    <div className="scene-caption"><span className={listening ? 'live-dot active' : 'live-dot'} />{listening ? 'LIVE AUDIO · 소리에 반응하는 활자' : 'AMBIENT · 천천히 흐르는 글자들'}</div>
    {controls && <section id="sound-controls" className="control-panel" aria-label="활자 설정">
      <div className="microphone-control">
        <button className={'mic-button ' + (listening ? 'listening' : '')} aria-pressed={listening}
          onClick={listening || mic.status === 'requesting' ? mic.stop : mic.start}>
          <span>{listening ? '◉' : '◎'}</span>{listening ? '마이크 끄기' : mic.status === 'requesting' ? '권한 요청 취소' : '마이크 켜기'}
        </button>
        <div className="level-track" aria-hidden="true"><div ref={meter} /></div>
      </div>
      <label className="setting">소리 감도 <output>{sensitivity.toFixed(1)}×</output><input aria-label="소리 감도" type="range" min="0.5" max="4" step="0.1" value={sensitivity} onChange={e => setSensitivity(+e.target.value)} /></label>
      <label className="setting">움직임 속도 <output>{speed.toFixed(1)}×</output><input aria-label="움직임 속도" type="range" min="0.1" max="2" step="0.1" value={speed} onChange={e => setSpeed(+e.target.value)} /></label>
      <label className="setting">글자 농도 <output>{glow.toFixed(1)}×</output><input aria-label="글자 농도" type="range" min="0.4" max="2" step="0.1" value={glow} onChange={e => setGlow(+e.target.value)} /></label>
      <p className="mic-status" role="status">{mic.message}<span>마이크 소리는 저장하거나 전송하지 않습니다.</span></p>
    </section>}
  </main>;
}




