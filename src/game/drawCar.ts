import type { Loadout } from "./loadout";

const tintCache = new Map<string, HTMLCanvasElement>();

export function tintSprite(img: HTMLImageElement, hue: number, key: string): CanvasImageSource {
  if (!hue) return img;
  const hit = tintCache.get(key);
  if (hit) return hit;
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (w < 2 || h < 2) return img;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  if (!g) return img;
  g.filter = `hue-rotate(${hue}deg) saturate(1.18)`;
  g.drawImage(img, 0, 0);
  g.filter = "none";
  tintCache.set(key, c);
  return c;
}

function paint(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  lo: Loadout,
  key: string,
  flip: boolean,
) {
  ctx.save();
  if (flip) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    x = 0;
    y = 0;
  }
  if (img) {
    try {
      ctx.drawImage(tintSprite(img, lo.hue, `${lo.id}-${key}`), x, y, w, h);
      ctx.restore();
      return true;
    } catch {
      /* fall through */
    }
  }
  ctx.fillStyle = "#e10600";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#f4f4f5";
  ctx.fillRect(x + w * 0.18, y + h * 0.18, w * 0.64, h * 0.16);
  ctx.fillStyle = "#d4a017";
  ctx.fillRect(x + w * 0.12, y + h * 0.72, w * 0.2, h * 0.1);
  ctx.restore();
  return false;
}

export function drawUnitTop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cx: number,
  cy: number,
  lo: Loadout,
  opts?: { ghost?: boolean; hop?: number },
) {
  const scale = lo.rushWide;
  const w = (lo.kind === "suv" ? 48 : 40) * scale;
  const h = (lo.kind === "suv" ? 78 : 66) * scale;
  ctx.save();
  if (opts?.hop && opts.hop > 0) ctx.translate(0, -Math.min(22, opts.hop * 52));
  if (opts?.ghost) ctx.globalAlpha = 0.45;
  paint(ctx, img, cx - w / 2, cy - h / 2, w, h, lo, "top", false);
  ctx.restore();
}

export function drawUnitSide(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  lo: Loadout,
  facing: number,
  opts?: { ghost?: boolean },
) {
  const w = lo.kind === "suv" ? 78 : 64;
  const h = lo.kind === "suv" ? 38 : 30;
  ctx.save();
  if (opts?.ghost) ctx.globalAlpha = 0.45;
  paint(ctx, img, x, y, w, h, lo, "side", facing < 0);
  ctx.restore();
  return { w, h };
}

export function unitSideSize(lo: Loadout) {
  return lo.kind === "suv" ? { w: 78, h: 38 } : { w: 64, h: 30 };
}
