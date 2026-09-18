import { VIEW_H, VIEW_W } from "./types";

export function fitView(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const parent = canvas.parentElement ?? canvas;
  const w = Math.max(1, parent.clientWidth);
  const h = Math.max(1, parent.clientHeight);
  let vw = VIEW_W;
  let vh = VIEW_H;
  if (w >= 8 && h >= 8) {
    const aspect = w / h;
    const targetV = aspect < 0.95 ? 620 : VIEW_H;
    vw = Math.max(320, Math.min(1400, Math.round(targetV * aspect)));
    vh = Math.max(380, Math.round(vw / Math.max(0.2, aspect)));
  }
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(vw * dpr));
  canvas.height = Math.max(1, Math.round(vh * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { vw, vh, dpr };
}

/** Room at the bottom of the canvas so the DualShock overlay does not cover the player. */
export function padReserve(vh: number) {
  return Math.round(Math.min(176, Math.max(124, vh * 0.24)));
}

/** Sit a landscape city photo on a horizon so it never leaves a black band. */
export function drawSkyline(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  vw: number,
  vh: number,
  panX: number,
  horizon: number,
  alpha = 0.72,
) {
  if (!img) return false;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return false;
  const yBottom = Math.max(vh * 0.42, Math.min(vh + 8, horizon));
  const scale = Math.max(vw / iw, yBottom / ih);
  const w = iw * scale;
  const h = ih * scale;
  const y = yBottom - h;
  const wrap = w < 8 ? vw : w;
  let x = -(((panX % wrap) + wrap) % wrap);
  ctx.save();
  ctx.globalAlpha = alpha;
  while (x < vw) {
    ctx.drawImage(img, x, y, w, h);
    x += wrap;
  }
  ctx.restore();
  return true;
}
