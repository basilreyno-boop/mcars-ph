/** Pixel units matching Jed — Boss John, Fidelity guards, lot enemies. Origin = feet. */

export type EnemyKind = "rival" | "repo" | "walkin";

export type EnemyDef = {
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  patrol?: number;
  speed?: number;
};

export type LotEnemy = EnemyDef & {
  ox: number;
  hp: number;
  facing: number;
  anim: number;
  alive: boolean;
};

type GridPal = Record<string, string>;

const JOHN_IDLE = [
  "....HHHHHHH.....",
  "...HHHHHHHHH....",
  "..HHHSSSSSSH....",
  "..HHSSSSSSSH....",
  "..HHDSSSGEIH....",
  "..HHSSSSDSSH....",
  "..HHSSUUUUSH....",
  "...SSSNNNSS.....",
  "...BBBCTTBB.....",
  "..BBBBTTBBBB....",
  "..BBBBTTBBBB....",
  "..KBBBTTBBBK....",
  "...PPP..PPP.....",
  "...PPP..PPP.....",
  "...WWW..WWW.....",
  "...MMM..MMM.....",
];

const JOHN_RUN_A = [
  "....HHHHHHH.....",
  "...HHHHHHHHH....",
  "..HHHSSSSSSH....",
  "..HHSSSSSSSH....",
  "..HHDSSSGEIH....",
  "..HHSSSSDSSH....",
  "..HHSSUUUUSH....",
  "...SSSNNNSS.....",
  "..BBBBCTTBBB....",
  ".BBBBBTTBBBBB...",
  "..BBBBTTBBBB....",
  "..KBBBTTBBBK....",
  "PPP........PPP..",
  "PPP........PPP..",
  "WWW........WWW..",
  "MMM........MMM..",
];

const JOHN_RUN_B = [
  "....HHHHHHH.....",
  "...HHHHHHHHH....",
  "..HHHSSSSSSH....",
  "..HHSSSSSSSH....",
  "..HHDSSSGEIH....",
  "..HHSSSSDSSH....",
  "..HHSSUUUUSH....",
  "...SSSNNNSS.....",
  "...BBBCTTBB.....",
  "..BBBBTTBBBB....",
  "..BBBBTTBBBB....",
  "..KBBBTTBBBK....",
  "....PP..PP......",
  "....PP..PP......",
  "....WW..WW......",
  "....MM..MM......",
];

const GUARD = [
  ".....CCCCC......",
  "....CCCCCCC.....",
  "...CCVVVVVCC....",
  "...CCSSSSSCC....",
  "...CSDSSGEIC....",
  "...CCSSSSSCC....",
  "....SSNNNSS.....",
  "...NNNYYYNNN....",
  "..NNNNYYNNNNN...",
  ".ANNNNYYNNNNNA..",
  "..NNNNYYNNNNN...",
  "...KNNNYYNNNK...",
  "....PPP.PPP.....",
  "....PPP.PPP.....",
  "....WWW.WWW.....",
  "....MMM.MMM.....",
];

const RIVAL = [
  "...HHHHHHH....",
  "..HHHHHHHHH...",
  ".HHHSSSSSSH...",
  ".HHSSSSSSSH...",
  ".HHDSSSGEIH...",
  ".HHSSSSDSSH...",
  "..SSSQQQSS....",
  "..LLLCTTLL....",
  ".LLLLTTLLLL...",
  ".LLLLTTLLLL...",
  ".KLLLTTLLLK...",
  "..PPP..PPP....",
  "..PPP..PPP....",
  "..WWW..WWW....",
  "..MMM..MMM....",
];

const REPO = [
  "...HHHHHHH....",
  "..HHHHHHHHH...",
  ".HHHSSSSSSH...",
  ".HHSSSSSSSH...",
  ".HHDSSSGEIH...",
  ".HHSSSSDSSH...",
  "..SSSKKKSS....",
  ".RRRRCTTRRR...",
  "RRRRRTTERRRR..",
  ".RRRRTTERRR...",
  ".KRRRTTERRK...",
  "..PPP..PPP....",
  "..PPP..PPP....",
  "..WWW..WWW....",
  "..MMM..MMM....",
];

const WALKIN = [
  "...HHHHHHH....",
  "..HHHHHHHHH...",
  ".HHHSSSSSSH...",
  ".HHSSSSSSSH...",
  ".HHDSSSGEIH...",
  ".HHSSSSDSSH...",
  "..SSSTTTSS....",
  "..OOOOCTOO....",
  ".OOOOOTOOOO...",
  ".OOOOOTOOOO...",
  ".KOOOOTOOOK...",
  "..PPP..PPP....",
  "..PPP..PPP....",
  "..WWW..WWW....",
  "..MMM..MMM....",
];

const PAL_JOHN: GridPal = {
  H: "#2a2a32",
  S: "#c99570",
  D: "#a87454",
  G: "#111114",
  E: "#f4f4f5",
  I: "#1a120e",
  U: "#d4a017",
  N: "#1a1a22",
  B: "#141418",
  C: "#d8dde4",
  T: "#d4a017",
  K: "#0b0b0d",
  P: "#1c1c22",
  W: "#0b0b0d",
  M: "#d4a017",
};

const PAL_GUARD: GridPal = {
  C: "#1e2a4a",
  V: "#d4a017",
  S: "#c99570",
  D: "#a87454",
  G: "#111114",
  E: "#f4f4f5",
  I: "#1a120e",
  N: "#243056",
  Y: "#d4a017",
  A: "#c45c26",
  K: "#121826",
  P: "#1a2238",
  W: "#0b0b0d",
  M: "#d4a017",
};

const PAL_RIVAL: GridPal = {
  H: "#3f2a1a",
  S: "#d2a07a",
  D: "#b07c58",
  G: "#111114",
  E: "#f4f4f5",
  I: "#1a120e",
  Q: "#4a5568",
  L: "#3b4254",
  C: "#d8dde4",
  T: "#60a5fa",
  K: "#222636",
  P: "#2a2e3c",
  W: "#1a1a22",
  M: "#60a5fa",
};

const PAL_REPO: GridPal = {
  H: "#1a1a22",
  S: "#b88864",
  D: "#966848",
  G: "#111114",
  E: "#f4f4f5",
  I: "#1a120e",
  K: "#3a1020",
  R: "#4a1424",
  C: "#d8dde4",
  T: "#e10600",
  P: "#1c1c22",
  W: "#0b0b0d",
  M: "#e10600",
};

const PAL_WALK: GridPal = {
  H: "#5a4630",
  S: "#d2a07a",
  D: "#b07c58",
  G: "#111114",
  E: "#f4f4f5",
  I: "#1a120e",
  T: "#f4f4f5",
  O: "#3a5a9a",
  C: "#d8dde4",
  K: "#24365e",
  P: "#2a3348",
  W: "#1a1a22",
  M: "#d4a017",
};

function padRows(rows: string[]): string[] {
  const w = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(w, "."));
}

function paint(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  pal: GridPal,
  x: number,
  y: number,
  facing: number,
  scale: number,
  bob: number,
) {
  const s = Math.max(2, Math.round(2.3 * scale));
  const grid = padRows(rows);
  const w = grid[0].length;
  const h = grid.length;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y + bob));
  ctx.scale(facing < 0 ? -1 : 1, 1);
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fillRect(Math.round(-4 * s), 0, 8 * s, Math.max(2, Math.round(s * 0.7)));
  const ox = -Math.floor(w / 2) * s;
  const oy = -h * s;
  for (let r = 0; r < h; r++) {
    const row = grid[r];
    for (let c = 0; c < w; c++) {
      if (row[c] === ".") continue;
      const empty =
        r === 0 ||
        grid[r - 1][c] === "." ||
        r === h - 1 ||
        grid[r + 1][c] === "." ||
        c === 0 ||
        row[c - 1] === "." ||
        c === w - 1 ||
        row[c + 1] === ".";
      if (!empty) continue;
      ctx.fillStyle = "#0a0a0c";
      ctx.fillRect(ox + c * s - 1, oy + r * s - 1, s + 2, s + 2);
    }
  }
  for (let r = 0; r < h; r++) {
    const row = grid[r];
    for (let c = 0; c < w; c++) {
      const col = pal[row[c]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(ox + c * s, oy + r * s, s, s);
    }
  }
  ctx.restore();
}

export function drawBossJohn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  time: number,
  scale = 1.15,
  moving = false,
) {
  const rows = moving ? (Math.sin(time * 12) > 0 ? JOHN_RUN_A : JOHN_RUN_B) : JOHN_IDLE;
  const bob = moving ? 0 : Math.sin(time * 5) > 0 ? 0 : 1;
  paint(ctx, rows, PAL_JOHN, x, y, facing, scale, bob);
}

export function drawGuard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  time: number,
  scale = 0.92,
) {
  const bob = Math.sin(time * 4 + x * 0.02) > 0 ? 0 : 1;
  paint(ctx, GUARD, PAL_GUARD, x, y, facing, scale, bob);
}

export function drawFoe(
  ctx: CanvasRenderingContext2D,
  kind: EnemyKind,
  x: number,
  y: number,
  facing: number,
  time: number,
  scale = 1,
) {
  const moving = true;
  const bob = Math.sin(time * 14) > 0 ? 0 : 1;
  if (kind === "repo") paint(ctx, REPO, PAL_REPO, x, y, facing, scale, bob);
  else if (kind === "rival") paint(ctx, RIVAL, PAL_RIVAL, x, y, facing, scale, moving ? bob : 0);
  else paint(ctx, WALKIN, PAL_WALK, x, y, facing, scale, bob);
}

export function seedEnemies(width: number, groundY: number, extra?: EnemyDef[]): EnemyDef[] {
  if (extra && extra.length) return extra.map((e) => ({ ...e }));
  const n = 3 + Math.min(6, Math.floor(width / 1100));
  const kinds: EnemyKind[] = ["rival", "walkin", "repo"];
  const out: EnemyDef[] = [];
  for (let i = 0; i < n; i++) {
    const kind = kinds[i % 3];
    const h = kind === "repo" ? 44 : 40;
    const x = 420 + ((i + 1) * (width - 820)) / (n + 1);
    out.push({
      kind,
      x,
      y: groundY - h,
      w: kind === "repo" ? 28 : 26,
      h,
      patrol: 64 + (i % 4) * 18,
      speed: kind === "repo" ? 108 : kind === "rival" ? 78 : 54,
    });
  }
  return out;
}

export function bootEnemies(defs: EnemyDef[]): LotEnemy[] {
  return defs.map((d) => ({
    ...d,
    ox: d.x,
    hp: d.kind === "repo" ? 2 : 1,
    facing: 1,
    anim: Math.random() * 4,
    alive: true,
  }));
}

export const GUARD_COUNT = 8;

export function foeTag(kind: EnemyKind) {
  if (kind === "repo") return "REPO";
  if (kind === "rival") return "RIVAL";
  return "WALK-IN";
}

export function guardOrbit(
  cx: number,
  cy: number,
  i: number,
  time: number,
  radius = 54,
): { x: number; y: number; facing: number } {
  const a = time * 1.35 + (i / GUARD_COUNT) * Math.PI * 2;
  return {
    x: cx + Math.cos(a) * radius,
    y: cy + Math.sin(a) * radius * 0.28,
    facing: Math.cos(a) >= 0 ? 1 : -1,
  };
}
