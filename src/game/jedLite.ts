import { outfitById, type OutfitPal } from "./outfits";

export type JedPose = "idle" | "run" | "air";

const IDLE = [
  "...HHHHHHH....",
  "..HHHHHHHHH...",
  ".HHHSSSSSSH...",
  ".HHSSSSSSSH...",
  ".HHDSSSGEIH...",
  ".HHSSSSDSSH...",
  ".HHSSBBBBSH...",
  "..SSSKKKSS....",
  "..JJJCTTJJ....",
  ".JJJJTTJJJJ...",
  ".JJJJTTJJJJ...",
  ".KJJJTTJJJK...",
  "..PPP..PPP....",
  "..PPP..PPP....",
  "..WWW..WWW....",
  "..MMM..MMM....",
];

const RUN_A = [
  "...HHHHHHH....",
  "..HHHHHHHHH...",
  ".HHHSSSSSSH...",
  ".HHSSSSSSSH...",
  ".HHDSSSGEIH...",
  ".HHSSSSDSSH...",
  ".HHSSBBBBSH...",
  "..SSSKKKSS....",
  ".JJJJCTTJJJ...",
  "JJJJJTTJJJJJ..",
  ".JJJJTTJJJJ...",
  ".KJJJTTJJJK...",
  "PPP......PPP..",
  "PPP......PPP..",
  "WWW......WWW..",
  "MMM......MMM..",
];

const RUN_B = [
  "...HHHHHHH....",
  "..HHHHHHHHH...",
  ".HHHSSSSSSH...",
  ".HHSSSSSSSH...",
  ".HHDSSSGEIH...",
  ".HHSSSSDSSH...",
  ".HHSSBBBBSH...",
  "..SSSKKKSS....",
  "..JJJCTTJJ....",
  ".JJJJTTJJJJ...",
  ".JJJJTTJJJJ...",
  ".KJJJTTJJJK...",
  "...PP..PP.....",
  "...PP..PP.....",
  "...WW..WW.....",
  "...MM..MM.....",
];

const AIR = [
  "...HHHHHHH....",
  "..HHHHHHHHH...",
  ".HHHSSSSSSH...",
  ".HHSSSSSSSH...",
  ".HHDSSSGEIH...",
  ".HHSSSSDSSH...",
  ".HHSSBBBBSH...",
  ".SSSSKKKSSS...",
  ".JJJJCTTJJJ...",
  ".JJJJTTJJJJ...",
  ".KJJJTTJJJK...",
  "..PPP..PPP....",
  "..PPP..PPP....",
  "..WWW..WWW....",
  "..MMM..MMM....",
];

function colorFor(ch: string, pal: OutfitPal): string | null {
  switch (ch) {
    case "H":
      return pal.hair;
    case "S":
      return pal.skin;
    case "D":
      return pal.skinDeep;
    case "B":
      return pal.skinDeep;
    case "J":
      return pal.jacket;
    case "K":
      return pal.jacketDark;
    case "T":
      return pal.stripe;
    case "P":
      return pal.pants;
    case "W":
      return pal.shoes;
    case "M":
      return pal.shoeMark;
    case "C":
      return pal.chain ? "#d8dde4" : pal.jacket;
    case "G":
      return pal.shades ? "#111114" : pal.skin;
    case "E":
      return pal.shades ? "#1c1c22" : "#f4f4f5";
    case "I":
      return pal.shades ? "#2a2a32" : "#1a120e";
    default:
      return null;
  }
}

function frameFor(pose: JedPose, time: number): string[] {
  if (pose === "air") return AIR;
  if (pose === "run") return Math.sin(time * 12) > 0 ? RUN_A : RUN_B;
  return IDLE;
}

function padRows(rows: string[]): string[] {
  const w = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(w, "."));
}

/** Chunky pixel Jed. Palette from the equipped outfit. Origin = feet. */
export function drawJedLite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  time: number,
  scale = 1,
  outfitId?: string,
  opts?: { bob?: boolean; pose?: JedPose },
) {
  const pal: OutfitPal = outfitById(outfitId).pal;
  const s = Math.max(2, Math.round(2.4 * scale));
  const pose = opts?.pose ?? "idle";
  const bob = opts?.bob === false ? 0 : pose === "air" ? 0 : Math.sin(time * (pose === "run" ? 14 : 5)) > 0 ? 0 : Math.max(1, Math.round(s / 2));
  const rows = padRows(frameFor(pose, time));
  const w = rows[0].length;
  const h = rows.length;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y + bob));
  ctx.scale(facing < 0 ? -1 : 1, 1);

  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fillRect(Math.round(-4 * s), 0, 8 * s, Math.max(2, Math.round(s * 0.7)));

  const ox = -Math.floor(w / 2) * s;
  const oy = -h * s;

  for (let r = 0; r < h; r++) {
    const row = rows[r];
    for (let c = 0; c < w; c++) {
      if (row[c] === ".") continue;
      const empty =
        (r === 0 || rows[r - 1][c] === ".") ||
        (r === h - 1 || rows[r + 1][c] === ".") ||
        (c === 0 || row[c - 1] === ".") ||
        (c === w - 1 || row[c + 1] === ".");
      if (!empty) continue;
      ctx.fillStyle = "#0a0a0c";
      ctx.fillRect(ox + c * s - 1, oy + r * s - 1, s + 2, s + 2);
    }
  }

  for (let r = 0; r < h; r++) {
    const row = rows[r];
    for (let c = 0; c < w; c++) {
      const col = colorFor(row[c], pal);
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(ox + c * s, oy + r * s, s, s);
    }
  }

  if (pal.letter) {
    ctx.fillStyle = pal.jacketDark;
    ctx.font = `700 ${Math.round(4.5 * s)}px 'Pixelify Sans', 'Barlow Condensed', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pal.letter, 0, oy + 10.4 * s);
  }

  ctx.restore();
}
