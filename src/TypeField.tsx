import { useEffect, useRef, type RefObject } from 'react';
import type { SoundLevels } from './waves';

type Props = { levels: RefObject<SoundLevels>; speed: number; glow: number; tick: (dt: number) => void };
const passage = 'GIFT   imagination et mouvement, les lettres respirent au rythme du son. La voix traverse le silence; une nouvelle idee prend forme. Gifted education, curiosity and possibility. Chaque instant invente une autre histoire. ';

export function TypeField(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext('2d')!;
    let width = 0, height = 0, frame = 0, last = 0, time = 0, energy = 0;
    const resize = () => {
      width = el.clientWidth; height = el.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      el.width = Math.round(width * dpr); el.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    const draw = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      const { levels, speed, glow, tick } = latest.current;
      tick(dt);
      const sound = levels.current;
      const target = Math.min(1, Math.max(0, sound.level - 0.025) * 2.3);
      energy += (target - energy) * (1 - Math.exp(-dt / (target > energy ? 0.08 : 0.85)));
      time += dt * speed * (1 + energy * 1.1);
      ctx.fillStyle = '#f8f6f1'; ctx.fillRect(0, 0, width, height);
      // Overscan keeps the viewport filled even at maximum wave displacement.
      const padding = 190;
      const density = Math.max(1, Math.sqrt((width + padding * 2) * (height + padding * 2) / 1400000));
      const spacing = 12 * density, lineHeight = 16 * density;
      const columns = Math.ceil((width + padding * 2) / spacing);
      const rows = Math.ceil((height + padding * 2) / lineHeight);
      const wavelength = Math.max(220, Math.min(width, height) * 0.62);
      const amplitude = 3 + energy * 78;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `${14 * density}px Georgia, "Times New Roman", serif`;
      for (let row = 0; row < rows; row++) {
        const homeY = row * lineHeight - padding;
        for (let col = 0; col < columns; col++) {
          const id = row * columns + col;
          const char = passage[id % passage.length];
          if (char === ' ') continue;
          const homeX = col * spacing - padding;
          const dx = homeX - width * 0.5, dy = homeY - height * 0.5;
          const distance = Math.hypot(dx, dy);
          const phase = distance / wavelength * Math.PI * 2 - time * 2.8;
          const crest = Math.sin(phase);
          const sweep = homeX / wavelength * 4.5 + homeY / wavelength * 1.7 - time * 1.9;
          // Coherent circular ripples combine with broad diagonal waves, so the
          // text rows visibly undulate together instead of scattering randomly.
          const radial = crest * amplitude * (0.55 + sound.bass * 0.45);
          const x = homeX + dx / Math.max(1, distance) * radial
            + Math.sin(sweep) * amplitude * 0.5;
          const y = homeY + dy / Math.max(1, distance) * radial
            + Math.sin(sweep * 0.85 + 1.2) * amplitude * 0.8
            + Math.sin(homeX * 0.035 - time * 4) * sound.high * 14;
          if (x < -24 || x > width + 24 || y < -24 || y > height + 24) continue;
          const focus = (Math.cos(phase + 0.9) + 1) * 0.5;
          const opacity = Math.min(1, (0.18 + focus * 0.65 + energy * 0.12) * glow);
          ctx.fillStyle = `rgba(19,17,15,${opacity})`;
          ctx.fillText(char, x, y);
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);
  return <canvas ref={canvas} className="jelly-canvas" aria-label="화면 전체를 채운 활자에 소리를 따라 원형 파동과 큰 물결이 퍼지는 작품" />;
}
