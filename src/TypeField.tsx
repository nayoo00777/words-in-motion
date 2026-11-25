import { useEffect, useRef, type RefObject } from 'react';
import type { SoundLevels } from './waves';

type Props = { levels: RefObject<SoundLevels>; speed: number; glow: number; tick: (dt: number) => void };
const passage = 'GIFT   imagination et mouvement, les lettres respirent au rythme du son. La voix traverse le silence; une nouvelle idee prend forme. Gifted education, curiosity and possibility. Chaque instant invente une autre histoire. ';
const seed = (n: number) => { const x = Math.sin(n * 127.1 + 31.7) * 43758.5453; return x - Math.floor(x); };

export function TypeField(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext('2d')!;
    let width = 0, height = 0, frame = 0, last = 0, time = 0, scatter = 0;
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
      time += dt * speed;
      // Fast expansion and slower reunion. The threshold keeps room noise from
      // permanently scattering the page; sensitivity still controls the input.
      const targetScatter = Math.min(1, Math.max(0, (sound.level - 0.06) / 0.48)) ** 0.8;
      scatter += (targetScatter - scatter) * (1 - Math.exp(-dt / (targetScatter > scatter ? 0.07 : 0.65)));
      ctx.fillStyle = '#eeece7'; ctx.fillRect(0, 0, width, height);
      const sheetW = Math.min(width - 32, 920), sheetH = Math.max(160, height - 160);
      const left = (width - sheetW) / 2, top = 125;
      ctx.fillStyle = '#f8f6f1'; ctx.fillRect(left, top, sheetW, sheetH);
      ctx.strokeStyle = '#c9c4bb'; ctx.lineWidth = 0.7; ctx.strokeRect(left, top, sheetW, sheetH);
      ctx.save(); ctx.beginPath(); ctx.rect(left + 5, top + 4, sheetW - 10, sheetH - 8); ctx.clip();
      // Subtle fixed grain gives the white field the texture of printed paper.
      ctx.fillStyle = 'rgba(58,48,32,0.035)';
      for (let i = 0; i < 1800; i++) ctx.fillRect(left + seed(i) * sheetW, top + seed(i + 9000) * sheetH, 1, 1);
      const spacing = 12, lineHeight = 15;
      const columns = Math.ceil(sheetW / spacing), rows = Math.ceil(sheetH / lineHeight) + 2;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '14px Georgia, "Times New Roman", serif';
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const id = row * columns + col;
          const char = passage[id % passage.length];
          if (char === ' ') continue;
          const phase = col * 0.48 + row * 0.11;
          const band = sound.bands?.[col % (sound.bands?.length || 1)] ?? sound.level;
          // Moving compression bands gather neighboring letters into dark vertical knots.
          const wave = Math.sin(phase + time * 0.65);
          const drift = Math.sin(col * 0.17 - row * 0.18 + time * 0.43);
          const homeX = left + 12 + col * spacing + wave * 4 + drift;
          const homeY = top + 8 + row * lineHeight
            + Math.sin(col * 0.24 + row * 0.36 - time * 1.2) * 0.8;
          // Each letter has its own destination across the whole page. It keeps
          // its identity and returns to exactly the same row when sound fades.
          const phaseOffset = seed(id + 1400) * Math.PI * 2;
          const destinationX = left + sheetW * (0.08 + seed(id + 2700) * 0.84)
            + Math.sin(time * 1.9 + phaseOffset) * sheetW * 0.055;
          const destinationY = top + sheetH * (0.08 + seed(id + 4100) * 0.84)
            + Math.cos(time * 1.5 + phaseOffset) * sheetH * 0.055;
          const x = homeX + (destinationX - homeX) * scatter;
          const y = homeY + (destinationY - homeY) * scatter;
          const focus = (Math.sin(col * 0.51 + row * 0.065 + time * 0.5) + 1) / 2;
          const opacity = Math.min(1, (0.10 + focus ** 1.4 * 0.83 + band * 0.25 + scatter * 0.18) * glow);
          ctx.fillStyle = `rgba(19,17,15,${opacity})`;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(scatter * (Math.sin(time * 1.3 + phaseOffset) * 1.2 + (seed(id + 6200) - 0.5) * 3));
          const size = 1 + scatter * seed(id + 7300) * 0.55;
          ctx.scale(size, size);
          ctx.fillText(char, 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);
  return <canvas ref={canvas} className="jelly-canvas" aria-label="소리가 커지면 활자들이 흩어지고 조용해지면 원래 줄로 모이는 타이포그래피" />;
}
