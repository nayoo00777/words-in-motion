import { useEffect, useRef } from 'react';
import type { SoundLevels } from './waves';

type Props = { levels: React.RefObject<SoundLevels>; speed: number; glow: number; tick: (dt: number) => void };
const glyphs = '.:-=+*GIFT08B$@';
const hash = (n: number) => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); };

export function AsciiGift(props: Props) {
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
    const mask = document.createElement('canvas'); mask.width = 600; mask.height = 150;
    const ink = mask.getContext('2d')!;
    ink.fillStyle = '#fff'; ink.font = 'bold 155px Arial'; ink.textAlign = 'center';
    ink.fillText('GIFT', 300, 128);
    const pixels = ink.getImageData(0, 0, 600, 150).data;
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
      const cells = new Map<number, { x: number; y: number; z: number; light: number; hue: number; char: string; ink: boolean }>();
      const cols = Math.ceil(width / cw);
      const put = (x: number, y: number, z: number, light: number, hue: number, char: string, ink = false) => {
        const col = Math.round(x / cw), row = Math.round(y / ch);
        if (col < 0 || col >= cols || row < 0 || row * ch > height) return;
        const key = row * cols + col;
        if ((cells.get(key)?.z ?? -Infinity) > z) return;
        cells.set(key, { x: col * cw, y: row * ch, z, light, hue, char, ink });
      };
      for (let i = 0; i < 170; i++) {
        const x = hash(i + 3) * width;
        const y = ((hash(i + 901) * height - time * (3 + hash(i) * 9)) % height + height) % height;
        ctx.fillStyle = `hsla(205,55%,70%,${0.08 + hash(i + 20) * 0.2 * (0.6 + 0.4 * Math.sin(time + i))})`;
        ctx.fillText(i % 4 ? '.' : '+', x, y);
      }
      // Sample a half-twisted ribbon in 3D, then resolve visibility on the ASCII grid.
      
      const available = Math.max(180, height - 365);
      const radius = Math.min(width * 0.28, available * 0.36);
      const centerY = 110 + available * 0.48;
      const spin = time * 0.24;
      const pulse = 1 + Math.sin(time * 1.6) * 0.025 + audio.bass * 0.16;
      const tilt = -0.36 + Math.sin(time * 0.3) * 0.1;
      const rotate = (x: number, y: number, z: number) => {
        const xx = x * Math.cos(spin) + z * Math.sin(spin);
        const zz = -x * Math.sin(spin) + z * Math.cos(spin);
        const yy = y * Math.cos(0.48) - zz * Math.sin(0.48);
        const depth = y * Math.sin(0.48) + zz * Math.cos(0.48);
        return [xx * Math.cos(tilt) - yy * Math.sin(tilt), xx * Math.sin(tilt) + yy * Math.cos(tilt), depth];
      };
      for (let a = 0; a < 300; a++) {
        const u = a / 300 * Math.PI * 2;
        for (let b = 0; b <= 62; b++) {
          const v = (b / 62 - 0.5) * 1.3;
          const ripple = audio.mid * 0.06 * Math.sin(u * 7 - time * 3);
          const r = 1 + v * Math.cos(u / 2) + ripple;
          const [x, y, z] = rotate(r * Math.cos(u), r * Math.sin(u), v * Math.sin(u / 2));
          const light = 0.34 + 0.48 * Math.abs(Math.sin(u * 0.5 + spin) * Math.cos(v * 1.3)) + z * 0.08;
          const edge = b < 2 || b > 60;
          // The lettering is a fixed UV texture on the ribbon, not a screen overlay.
          // Repeat on opposite arcs so it comes into view as the ribbon turns.
          const along = (u / Math.PI) % 1;
          const tx = Math.floor((along - 0.08) / 0.84 * 600);
          const ty = Math.floor((0.5 - v / 1.04) * 150);
          const printed = tx >= 0 && tx < 600 && ty >= 0 && ty < 150
            && pixels[(ty * 600 + tx) * 4 + 3] > 128;
          const char = printed ? '@' : edge ? '+' : glyphs[Math.min(glyphs.length - 1, Math.floor(light * 11 + hash(a * 63 + b) * 3))];
          put(width / 2 + x * radius * pulse, centerY + y * radius * pulse,
            z, edge ? 0.95 : light, 205 + audio.mid * 80 + y * 15, char, printed);
        }
      }
      ctx.shadowBlur = 5 * glow;
      for (const cell of cells.values()) {
        ctx.shadowBlur = cell.ink ? 0 : 5 * glow;
        ctx.fillStyle = cell.ink ? '#071018' : `hsla(${cell.hue},${65 + audio.high * 30}%,${Math.min(92, 35 + cell.light * 51 * glow)}%,${Math.min(1, 0.3 + cell.light)})`;
        ctx.shadowColor = `hsla(${cell.hue},90%,60%,0.45)`;
        ctx.fillText(cell.char, cell.x, cell.y);
      }
      ctx.shadowBlur = 0;
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);
  return <canvas ref={canvas} className="jelly-canvas" aria-label="GIFT 글자가 표면에 새겨져 함께 움직이는 소리 반응 리본" />;
}



