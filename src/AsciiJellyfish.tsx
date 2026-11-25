import { useEffect, useRef } from 'react';
import type { SoundLevels } from './waves';

type Props = { levels: React.RefObject<SoundLevels>; speed: number; glow: number; tick: (dt: number) => void };
const glyphs = '.:-=+*trvcxz108B$@';
const hash = (n: number) => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); };

export function AsciiJellyfish(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const current = useRef(props);
  current.current = props;
  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext('2d')!;
    let frame = 0, previous = 0, time = 0, width = 0, height = 0;
    const resize = () => {
      width = el.clientWidth; height = el.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      el.width = Math.round(width * dpr); el.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    function draw(now: number) {
      const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      const { speed, glow, levels, tick } = current.current;
      tick(dt);
      const audio = levels.current;
      time += dt * speed * (1 + audio.level * 0.65);
      ctx.fillStyle = '#020408'; ctx.fillRect(0, 0, width, height);
      const scale = Math.min(width / 8.6, height / 10.5);
      const font = Math.max(8, Math.min(12, scale * 0.13));
      const cw = font * 0.65, ch = font * 1.15;
      ctx.font = `${font}px "Consolas", "Courier New", monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      // A depth buffer on a character grid preserves the readable ASCII surface.
      const cells = new Map<number, { x: number; y: number; z: number; light: number; hue: number; char: string }>();
      const cols = Math.ceil(width / cw);
      const put = (x: number, y: number, z: number, light: number, hue: number, char: string) => {
        const col = Math.round(x / cw), row = Math.round(y / ch);
        if (col < 0 || col >= cols || row < 0 || row * ch > height) return;
        const key = row * cols + col;
        if ((cells.get(key)?.z ?? -Infinity) > z) return;
        cells.set(key, { x: col * cw, y: row * ch, z, light, hue, char });
      };
      for (let i = 0; i < 170; i++) {
        const x = hash(i + 3) * width;
        const y = ((hash(i + 901) * height - time * (3 + hash(i) * 9)) % height + height) % height;
        ctx.fillStyle = `hsla(205,55%,70%,${0.08 + hash(i + 20) * 0.2 * (0.6 + 0.4 * Math.sin(time + i))})`;
        ctx.fillText(i % 4 ? '.' : '+', x, y);
      }
      function jelly(cx: number, cy: number, size: number, phase: number, faint = false) {
        const t = time + phase;
        const pulse = Math.sin(t * 2.1) * (0.09 + audio.bass * 0.19);
        const radius = 1.6 * (1 - pulse + audio.level * 0.13);
        const yaw = Math.sin(t * 0.31) * 0.32;
        const tilt = Math.sin(t * 0.48) * 0.12;
        const hue = 205 + Math.sin(t * 0.23) * 35 + audio.mid * 150;
        const project = (x: number, y: number, z: number, light: number, char: string) => {
          const xx = x * Math.cos(yaw) + z * Math.sin(yaw);
          const zz = z * Math.cos(yaw) - x * Math.sin(yaw);
          const yy = y + zz * 0.21;
          put(cx + (xx * Math.cos(tilt) - yy * Math.sin(tilt)) * size,
            cy + (yy * Math.cos(tilt) + xx * Math.sin(tilt)) * size,
            zz, light * (faint ? 0.28 : 1), hue + y * 13 + zz * 15, char);
        };
        for (let v = 0; v <= 42; v++) {
          const u = v / 42, a = u * Math.PI * 0.53;
          for (let j = 0; j < 120; j++) {
            const theta = j / 120 * Math.PI * 2;
            const r = radius * Math.sin(a) * (1 + 0.035 * Math.cos(theta * 10) * u * u);
            const y = -1.7 * Math.cos(a) * (1 + pulse) + 0.07 * Math.sin(theta * 10 + t) * u ** 5;
            const light = 0.3 + 0.55 * Math.max(0, Math.cos(theta - 0.8)) + 0.1 * Math.sin(u * 14 + t);
            const n = Math.floor(hash(v * 121 + j) * 7 + light * 8);
            project(r * Math.cos(theta), y, r * Math.sin(theta), light, glyphs[Math.min(glyphs.length - 1, n)]);
          }
        }
        // Long trailing filaments with delayed waves, all attached to the bell rim.
        for (let strand = 0; strand < 26; strand++) {
          const theta = strand / 26 * Math.PI * 2;
          const length = 2.8 + hash(strand + 40) * 1.9;
          for (let k = 0; k < 100; k++) {
            const u = k / 99, sway = u * (0.22 + audio.level * 0.55);
            const x = radius * Math.cos(theta) * (1 - u * 0.35)
              + Math.sin(u * 8 - t * 1.7 + theta) * sway + Math.sin(t * 0.6) * u * 0.5;
            const z = radius * Math.sin(theta) * (1 - u * 0.35) + Math.cos(u * 7 - t + theta) * sway;
            project(x, 0.14 + u * length, z, (0.35 + 0.25 * Math.sin(theta + 1)) * (1 - u * 0.55), k % 5 === 0 ? '+' : Math.cos(u * 8 - t + theta) > 0 ? '/' : '\\');
          }
        }
        // Ruffled oral arms create the denser, twisting center of the animal.
        for (let arm = 0; arm < 4; arm++) {
          for (let k = 0; k < 110; k++) {
            const u = k / 109, p = arm * Math.PI / 2;
            for (let edge = -1; edge <= 1; edge++) {
              const x = Math.sin(u * 7 - t * 1.2 + p) * (0.2 + u * 0.5) + edge * 0.12 * Math.sin(u * 30 + p);
              project(x, 0.1 + u * 3.5, Math.cos(p + u * 5 - t) * 0.35, 0.68 * (1 - u * 0.5), glyphs[5 + ((k + arm * 3) % 12)]);
            }
          }
        }
      }
      jelly(width * 0.16, height * 0.32 + Math.sin(time * 0.4) * 15, scale * 0.2, 3, true);
      jelly(width * 0.84, height * 0.49 + Math.sin(time * 0.3) * 22, scale * 0.24, 6, true);
      jelly(width * 0.5 + Math.sin(time * 0.3) * scale * 0.28, height * 0.37 + Math.sin(time * 1.05) * scale * 0.17, scale, 0);
      ctx.shadowBlur = 5 * glow;
      for (const cell of cells.values()) {
        ctx.fillStyle = `hsla(${cell.hue},${65 + audio.high * 30}%,${Math.min(92, 35 + cell.light * 51 * glow)}%,${Math.min(1, 0.3 + cell.light)})`;
        ctx.shadowColor = `hsla(${cell.hue},90%,60%,0.45)`;
        ctx.fillText(cell.char, cell.x, cell.y);
      }
      ctx.shadowBlur = 0;
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);
  return <canvas ref={canvas} className="jelly-canvas" aria-label="소리에 반응하며 계속 헤엄치는 문자 해파리" />;
}
