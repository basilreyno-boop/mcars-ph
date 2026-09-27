/** Lot arsenal — Hotline-style pick up / swap / throw. Weapons are dealership tools; foes get KO'd, not killed. */

import type { Rect } from "./types";

export type WeaponKind = "iron" | "wrench" | "pricegun" | "plate";

export type WeaponDef = {
  name: string;
  short: string;
  color: string;
  /** Melee reach in px past the player's front edge. 0 = ranged. */
  reach: number;
  /** Damage per melee hit or per bullet. */
  dmg: number;
  /** Seconds between attacks. */
  cd: number;
  /** Rounds for ranged weapons. Infinity for melee. */
  ammo: number;
  /** Stun seconds when this weapon is thrown into a foe. */
  throwStun: number;
  /** Plates fly flat before gravity takes them. */
  flatT: number;
};

export const WEAPONS: Record<WeaponKind, WeaponDef> = {
  iron: {
    name: "TIRE IRON",
    short: "IRON",
    color: "#c4c9d4",
    reach: 40,
    dmg: 2,
    cd: 0.34,
    ammo: Infinity,
    throwStun: 2.0,
    flatT: 0,
  },
  wrench: {
    name: "TORQUE WRENCH",
    short: "WRENCH",
    color: "#e0a526",
    reach: 32,
    dmg: 1,
    cd: 0.2,
    ammo: Infinity,
    throwStun: 1.7,
    flatT: 0,
  },
  pricegun: {
    name: "PRICE TAG GUN",
    short: "TAGGER",
    color: "#f472b6",
    reach: 0,
    dmg: 1,
    cd: 0.16,
    ammo: 8,
    throwStun: 1.6,
    flatT: 0,
  },
  plate: {
    name: "PLATE FRISBEE",
    short: "PLATE",
    color: "#f4f4f5",
    reach: 26,
    dmg: 1,
    cd: 0.3,
    ammo: Infinity,
    throwStun: 2.4,
    flatT: 0.42,
  },
};

export type Held = { kind: WeaponKind; ammo: number };

export type WeaponItem = {
  kind: WeaponKind;
  ammo: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  /** Airborne and able to stun on contact. */
  live: boolean;
  /** Seconds before a fresh drop can be grabbed or hit someone. */
  grace: number;
  flatT: number;
  /** Foes this throw already hit (plates pierce once). */
  hits: number;
  /** Index of the last foe hit, so a piercing plate doesn't hit the same one twice. */
  skip: number;
};

export type Bullet = { x: number; y: number; vx: number; life: number };

export const ITEM_W = 26;
export const ITEM_H = 10;
const ITEM_GRAV = 1500;
const MAX_ITEMS = 24;

export function freshHeld(kind: WeaponKind): Held {
  return { kind, ammo: WEAPONS[kind].ammo };
}

export function dropItem(items: WeaponItem[], kind: WeaponKind, ammo: number, x: number, y: number, vx = 0, vy = -260) {
  if (items.length >= MAX_ITEMS) {
    const idle = items.findIndex((i) => !i.live);
    items.splice(idle >= 0 ? idle : 0, 1);
  }
  items.push({ kind, ammo, x, y, vx, vy, spin: 0, live: false, grace: 0.25, flatT: 0, hits: 0, skip: -1 });
}

export function throwItem(items: WeaponItem[], held: Held, x: number, y: number, facing: number, carryVx: number) {
  const def = WEAPONS[held.kind];
  items.push({
    kind: held.kind,
    ammo: held.ammo,
    x,
    y,
    vx: facing * 760 + carryVx * 0.35,
    vy: def.flatT > 0 ? -20 : -170,
    spin: facing * 22,
    live: true,
    grace: 0,
    flatT: def.flatT,
    hits: 0,
    skip: -1,
  });
}

export function itemBox(i: WeaponItem): Rect {
  return { x: i.x - ITEM_W / 2, y: i.y - ITEM_H, w: ITEM_W, h: ITEM_H };
}

function overlap(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Integrate one item against the lot's solids and one-way ledges. */
export function stepItem(i: WeaponItem, dt: number, solids: Rect[], oneWays: Rect[], levelW: number) {
  i.grace = Math.max(0, i.grace - dt);
  if (i.flatT > 0) i.flatT = Math.max(0, i.flatT - dt);
  else i.vy = Math.min(1100, i.vy + ITEM_GRAV * dt);
  const prevBottom = i.y;
  i.x += i.vx * dt;
  let box = itemBox(i);
  for (const s of solids) {
    if (!overlap(box, s)) continue;
    if (i.vx > 0) i.x = s.x - ITEM_W / 2;
    else if (i.vx < 0) i.x = s.x + s.w + ITEM_W / 2;
    i.vx *= -0.35;
    i.flatT = 0;
    box = itemBox(i);
  }
  if (i.x < ITEM_W / 2) {
    i.x = ITEM_W / 2;
    i.vx = Math.abs(i.vx) * 0.35;
  } else if (i.x > levelW - ITEM_W / 2) {
    i.x = levelW - ITEM_W / 2;
    i.vx = -Math.abs(i.vx) * 0.35;
  }
  i.y += i.vy * dt;
  box = itemBox(i);
  let landed = false;
  for (const s of solids) {
    if (!overlap(box, s)) continue;
    if (i.vy >= 0) {
      i.y = s.y;
      landed = true;
    } else {
      i.y = s.y + s.h + ITEM_H;
      i.vy = 0;
    }
    box = itemBox(i);
  }
  if (!landed && i.vy >= 0) {
    for (const p of oneWays) {
      if (prevBottom <= p.y + 2 && overlap(box, p)) {
        i.y = p.y;
        landed = true;
        break;
      }
    }
  }
  if (landed) {
    if (Math.abs(i.vy) > 380) i.vy = -i.vy * 0.28;
    else i.vy = 0;
    i.vx *= 0.55;
    if (Math.abs(i.vx) < 24) i.vx = 0;
    i.flatT = 0;
    if (i.vy === 0 && i.vx === 0) i.live = false;
  }
  if (i.live || i.vx !== 0 || i.vy !== 0) i.spin += (i.vx >= 0 ? 1 : -1) * 18 * dt;
  else i.spin = 0;
}

/** Nearest resting item within grab range of a point. */
export function nearestItem(items: WeaponItem[], x: number, y: number, range = 58) {
  let best = -1;
  let bestD = range;
  for (let n = 0; n < items.length; n++) {
    const i = items[n];
    if (i.live || i.grace > 0) continue;
    const d = Math.hypot(i.x - x, (i.y - y) * 0.6);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

/** Draw a weapon centred on the origin, pointing +x. */
export function paintWeapon(ctx: CanvasRenderingContext2D, kind: WeaponKind, scale = 1) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (kind === "iron") {
    ctx.strokeStyle = "#0a0a0c";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(10, 0);
    ctx.lineTo(13, -6);
    ctx.stroke();
    ctx.strokeStyle = WEAPONS.iron.color;
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.fillStyle = "#e10600";
    ctx.fillRect(-14, -2.5, 7, 5);
  } else if (kind === "wrench") {
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(-12, -3.5, 20, 7);
    ctx.beginPath();
    ctx.arc(10, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = WEAPONS.wrench.color;
    ctx.fillRect(-11, -2, 18, 4);
    ctx.beginPath();
    ctx.arc(10, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(10, -2, 6, 4);
  } else if (kind === "pricegun") {
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(-11, -7, 22, 11);
    ctx.fillRect(-7, 2, 7, 9);
    ctx.fillStyle = WEAPONS.pricegun.color;
    ctx.fillRect(-10, -6, 20, 9);
    ctx.fillStyle = "#3a1830";
    ctx.fillRect(-6, 3, 5, 7);
    ctx.fillStyle = "#f4f4f5";
    ctx.fillRect(4, -5, 5, 4);
  } else {
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(-12, -6, 24, 12);
    ctx.fillStyle = "#f4f4f5";
    ctx.fillRect(-11, -5, 22, 10);
    ctx.fillStyle = "#1e3a8a";
    ctx.font = "700 7px 'Barlow Condensed', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MCR 095", 0, 0.5);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
  }
  ctx.restore();
}

/** Resting pickup on the lot, with a bob and glow so it reads as grabbable. */
export function drawItem(ctx: CanvasRenderingContext2D, i: WeaponItem, time: number, near: boolean) {
  const bob = i.live || i.vy !== 0 ? 0 : Math.sin(time * 4 + i.x * 0.05) * 1.5;
  ctx.save();
  ctx.translate(i.x, i.y - ITEM_H / 2 - 2 + bob);
  if (!i.live && i.vy === 0) {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(-12, ITEM_H / 2 + 1 - bob, 24, 2);
    ctx.globalAlpha = 0.28 + Math.sin(time * 5) * 0.12;
    ctx.fillStyle = WEAPONS[i.kind].color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.rotate(i.spin);
  paintWeapon(ctx, i.kind);
  ctx.restore();
  if (near) {
    ctx.fillStyle = WEAPONS[i.kind].color;
    ctx.font = "700 10px 'Barlow Condensed', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(WEAPONS[i.kind].name, i.x, i.y - 22 + bob);
    ctx.textAlign = "left";
  }
}

/** Default drop for each lot foe, so every KO feeds the next fight. */
export function foeDrop(kind: "rival" | "repo" | "walkin"): WeaponKind {
  if (kind === "repo") return "iron";
  if (kind === "rival") return "pricegun";
  return "plate";
}
