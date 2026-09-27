/** Field Guide — first-encounter briefing cards for foes, hazards and weapons. Seen once, remembered per browser. */

import { WEAPONS, paintWeapon, type WeaponKind } from "./arsenal";
import type { HazardKind } from "./types";
import { drawFoe, type EnemyKind } from "./units";

export type GuideId = "controls" | "stun" | EnemyKind | HazardKind | WeaponKind;

type Card = {
  tag: string;
  title: string;
  lines: string[];
  tip: string;
  color: string;
};

const GUIDE_KEY = "mcars-ph-guide-v1";

function controlLines(touch: boolean): string[] {
  if (touch) {
    return [
      "Stick — move.   ✕ — jump (tap again in the air).",
      "○ — HIT. Swing what you hold, or shove bare-handed.",
      "△ — GRAB. Pick up · swap with the floor · or THROW.",
    ];
  }
  return [
    "A / D — move.   W / Space — jump (again in the air).",
    "F / J / left-click — HIT. Swing, fire, or shove bare-handed.",
    "E / L / right-click — GRAB. Pick up · swap · or THROW.",
  ];
}

export function guideCard(id: GuideId, touch: boolean): Card {
  switch (id) {
    case "controls":
      return {
        tag: "HOW TO CLOSE",
        title: "WALK IN. DRIVE OUT.",
        lines: controlLines(touch),
        tip: "Nothing in hand? Grab the first tool you see. Empty tagger? Throw it.",
        color: "#e10600",
      };
    case "rival":
      return {
        tag: "NEW THREAT",
        title: "RIVAL DEALER",
        lines: ["Paces his patch of the lot. Touch him and you lose the sale.", "Drops a PRICE TAG GUN when he goes down."],
        tip: "Stomp him, swing on him, or throw anything at him.",
        color: "#60a5fa",
      };
    case "repo":
      return {
        tag: "NEW THREAT",
        title: "REPO MAN",
        lines: ["Spots you inside 260px and charges. Takes TWO hits.", "Drops a TIRE IRON — the best swing on the lot."],
        tip: "Throw to stun him first, then finish. Or one Tire Iron hit.",
        color: "#e10600",
      };
    case "walkin":
      return {
        tag: "NEW THREAT",
        title: "WALK-IN",
        lines: ["Slow and wandering, but still blocks the line.", "Drops a PLATE FRISBEE — flies flat and far."],
        tip: "Easy stomp. Save your weapon for the Repo Man.",
        color: "#d4a017",
      };
    case "cone":
      return {
        tag: "HAZARD",
        title: "TRAFFIC CONE",
        lines: ["Touch it and you're out. CMAP lets you phase through.", "Grown or Trade-In? Stomp it flat for pesos."],
        tip: "Jump it clean. Keep the combo rolling.",
        color: "#fb923c",
      };
    case "oil":
      return {
        tag: "HAZARD",
        title: "OIL SLICK",
        lines: ["Won't take you out — it shoves you forward, fast.", "Slide into a cone or a foe and THAT takes you out."],
        tip: "Hop it early. Replevin Accepted lets you bounce off it.",
        color: "#a78bfa",
      };
    case "spikes":
      return {
        tag: "HAZARD",
        title: "TIRE SPIKES",
        lines: ["Nothing stomps these. Nothing.", "Only Same-Day Release or a warranty save gets you through."],
        tip: "Jump. Always jump.",
        color: "#f4f4f5",
      };
    case "stun":
      return {
        tag: "TECHNIQUE",
        title: "STUNNED — FINISH HIM",
        lines: ["Thrown tools and bare-hand shoves knock foes down.", "A downed foe can't hurt you. Any hit or stomp = FINISH."],
        tip: "FINISH pays double. Throw, then close.",
        color: "#f5d76e",
      };
    default: {
      const w = WEAPONS[id];
      const lines =
        id === "iron"
          ? ["Heavy swing. Two damage — drops a Repo Man in one.", "Unlimited swings. Slow between hits."]
          : id === "wrench"
            ? ["Fast, short swings. One damage each.", "Spam it — nothing on the lot swings quicker."]
            : id === "pricegun"
              ? ["Fires price stickers down the line. 8 tags.", "Empty? It's still a brick — THROW IT."]
              : ["Swing it, or throw it: flies flat, far, and stuns long.", "Pierces the first foe it hits."];
      return {
        tag: "NEW WEAPON",
        title: w.name,
        lines,
        tip: touch ? "△ picks it up. △ again throws it." : "E picks it up. E again throws it.",
        color: w.color,
      };
    }
  }
}

export function loadGuideSeen(): Set<GuideId> {
  try {
    const raw = localStorage.getItem(GUIDE_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(list) ? (list.filter((x) => typeof x === "string") as GuideId[]) : []);
  } catch {
    return new Set();
  }
}

export function saveGuideSeen(seen: Set<GuideId>) {
  try {
    localStorage.setItem(GUIDE_KEY, JSON.stringify([...seen]));
  } catch {
    /* private mode — the guide just shows again next visit */
  }
}

export function clearGuideSeen() {
  try {
    localStorage.removeItem(GUIDE_KEY);
  } catch {
    /* ignore */
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

/**
 * Draw the briefing in screen space: dim the lot, spotlight the subject, slam in the card.
 * `t` is seconds since the card opened; `sx/sy` is the subject on screen (or null for controls).
 */
export function drawGuide(
  ctx: CanvasRenderingContext2D,
  id: GuideId,
  touch: boolean,
  t: number,
  vw: number,
  vh: number,
  spot: { x: number; y: number } | null,
  time: number,
  reduced: boolean,
) {
  const card = guideCard(id, touch);
  const inT = reduced ? 1 : Math.min(1, t / 0.22);
  const ease = 1 - Math.pow(1 - inT, 3);

  ctx.save();
  ctx.fillStyle = `rgba(6,6,10,${0.62 * ease})`;
  ctx.beginPath();
  ctx.rect(0, 0, vw, vh);
  if (spot) {
    const r = 56 + (reduced ? 0 : Math.sin(time * 5) * 4);
    ctx.moveTo(spot.x + r, spot.y);
    ctx.arc(spot.x, spot.y, r, 0, Math.PI * 2, true);
  }
  ctx.fill("evenodd");
  if (spot) {
    ctx.strokeStyle = card.color;
    ctx.globalAlpha = ease;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = reduced ? 0 : -time * 30;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const w = Math.min(560, vw - 32);
  const x = (vw - w) / 2 + (reduced ? 0 : (1 - ease) * -60);
  const art = w > 380 ? 96 : 0;
  const textW = w - art - 40;
  ctx.font = "500 13px 'DM Sans', sans-serif";
  const body = card.lines.flatMap((l) => wrap(ctx, l, textW));
  ctx.font = "700 12px 'DM Sans', sans-serif";
  const tip = wrap(ctx, card.tip, textW);
  const h = 78 + body.length * 18 + tip.length * 17 + 30;
  // Keep clear of the DOM top bar (~110px) and park the card on the far side of the spotlight.
  const top = Math.min(116, vh * 0.2);
  const y = !spot
    ? Math.max(top, (vh - h) / 2)
    : spot.y > vh * 0.5
      ? Math.max(top, spot.y - 84 - h)
      : Math.min(vh - h - 16, spot.y + 84);

  ctx.globalAlpha = ease;
  ctx.fillStyle = "rgba(10,10,14,0.96)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = card.color;
  ctx.fillRect(x, y, 6, h);
  ctx.strokeStyle = card.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  if (art) {
    const ax = x + 16 + art / 2;
    const ay = y + h / 2;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(x + 16, y + 16, art, h - 32);
    if (id === "rival" || id === "repo" || id === "walkin") {
      drawFoe(ctx, id, ax, ay + 34, 1, time, 1.6);
    } else if (id === "iron" || id === "wrench" || id === "pricegun" || id === "plate") {
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(reduced ? 0 : Math.sin(time * 2.4) * 0.25);
      paintWeapon(ctx, id, 2.4);
      ctx.restore();
    } else {
      ctx.fillStyle = card.color;
      ctx.font = "700 44px 'Barlow Condensed', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(id === "controls" ? "✕○△" : id === "stun" ? "★" : "!", ax, ay + 15);
      ctx.textAlign = "left";
    }
  }

  const tx = x + art + 28;
  let ty = y + 26;
  ctx.fillStyle = card.color;
  ctx.font = "700 12px 'Barlow Condensed', sans-serif";
  ctx.fillText(`${card.tag}  ·  FIELD GUIDE`, tx, ty);
  ty += 28;
  ctx.fillStyle = "#f4f4f5";
  ctx.font = "700 28px 'Barlow Condensed', sans-serif";
  ctx.fillText(card.title, tx, ty);
  ty += 22;
  ctx.fillStyle = "#c4c4cc";
  ctx.font = "500 13px 'DM Sans', sans-serif";
  for (const l of body) {
    ctx.fillText(l, tx, ty);
    ty += 18;
  }
  ty += 6;
  ctx.fillStyle = card.color;
  ctx.font = "700 12px 'DM Sans', sans-serif";
  for (const l of tip) {
    ctx.fillText(l, tx, ty);
    ty += 17;
  }
  if (t > 0.5) {
    ctx.globalAlpha = ease * (reduced ? 1 : 0.6 + Math.sin(time * 6) * 0.4);
    ctx.fillStyle = "#f4f4f5";
    ctx.font = "700 11px 'Barlow Condensed', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(touch ? "TAP ✕ ○ △ TO GO" : "PRESS JUMP · HIT · GRAB TO GO", x + w - 14, y + h - 10);
    ctx.textAlign = "left";
  }
  ctx.restore();
}
