// Procedural black/gold hero film base: a near-black stage, a faint warm breath
// and two projector shafts that only light up while the final frame plays.
// Timing comes from heroModel so all layers share one 30 s clock.
import {LOOP, TAU, T, loopTime, smooth} from "./heroModel";

function fract(v: number): number {
  return v - Math.floor(v);
}

export function drawHeroFilm(
  ctx: CanvasRenderingContext2D,
  time: number,
  width: number,
  height: number,
): void {
  const local = loopTime(time);
  const ph = (local / LOOP) * TAU;
  const unit = Math.min(width, height * 1.35);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  // Warm bloom follows the act: almost nothing at the start/end, fullest during playback.
  const act = smooth((local - 1) / 8) * (1 - smooth((local - T.dissolve) / 3.5));
  const bx = width * 0.5, by = height * 0.5;
  const bloom = ctx.createRadialGradient(bx, by, 0, bx, by, unit * 0.7);
  bloom.addColorStop(0, `rgba(255,190,60,${(0.05 * act).toFixed(3)})`);
  bloom.addColorStop(1, "rgba(255,190,60,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, width, height);

  // Projector shafts from both upper corners toward the frame's upper edge, never the centre.
  const shaft = smooth((local - (T.play - 1.5)) / 2) * (1 - smooth((local - T.dissolve) / 2));
  if (shaft > 0.01) {
    for (const side of [0, 1]) {
      const ox = side ? width * 0.98 : width * 0.02, oy = height * 0.04;
      const tx = side ? width * 0.7 : width * 0.3, ty = height * 0.2;
      const sway = 0.02 * Math.sin(ph * 2 + side * 2);
      const g = ctx.createLinearGradient(ox, oy, tx, ty);
      g.addColorStop(0, `rgba(255,216,74,${(0.1 * shaft).toFixed(3)})`);
      g.addColorStop(1, "rgba(255,216,74,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(tx + width * (0.08 + sway), ty - height * 0.1);
      ctx.lineTo(tx - width * (0.04 - sway), ty + height * 0.06);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.7 * shaft;
      ctx.fillStyle = "#fff3c4";
      ctx.beginPath();
      ctx.arc(ox, oy, 2.2, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Atmosphere: slow drifting haze bands and fine dust, very low alpha.
  for (let i = 0; i < 3; i++) {
    const y = height * (0.25 + 0.25 * i) + height * 0.04 * Math.sin(ph + i * 2);
    const g = ctx.createLinearGradient(0, y - height * 0.12, 0, y + height * 0.12);
    const a = (0.01 + 0.012 * act).toFixed(3);
    g.addColorStop(0, "rgba(255,190,60,0)");
    g.addColorStop(0.5, `rgba(255,190,60,${a})`);
    g.addColorStop(1, "rgba(255,190,60,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y - height * 0.12, width, height * 0.24);
  }
  ctx.fillStyle = "#ffd84a";
  const count = width < 640 ? 50 : 110;
  for (let i = 0; i < count; i++) {
    // Hash-based fixed seeds; drift is an integer number of laps per loop, so it is seamless.
    const hx = fract(Math.sin(i * 12.9898) * 43758.5453);
    const hy = fract(Math.sin(i * 78.233) * 12345.678);
    const x = fract(hx + local / LOOP) * width;
    const y = (hy + 0.015 * Math.sin(ph * 2 + i)) * height;
    const lit = shaft * Math.max(0, 1 - Math.abs(y / height - 0.15) * 4);
    ctx.globalAlpha = 0.05 + 0.03 * act + 0.2 * lit;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
