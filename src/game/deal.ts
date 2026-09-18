import { Input, applyTouch } from "./input";
import { Sfx } from "./audio";
import { loadImage } from "./assets";
import { loadCareer, writeCareer, freshUnlocks } from "./garage";
import { awardMissions } from "./missions";
import { blankHud } from "./hudBlank";
import { drawSkyline, fitView, padReserve } from "./view";
import { formatPesos, type GameHandle, type Screen } from "./types";
import { resolveLoadout } from "./loadout";
import { drawUnitSide } from "./drawCar";

const VALUES = [1000, 5000, 10000, 25000, 50000, 75000, 100000, 150000, 250000, 500000, 750000, 1000000];
const OPEN_PER = [3, 3, 2, 2, 1, 1];

type Case = { id: number; value: number; open: boolean };
type Phase = "pick" | "open" | "offer" | "final" | "win";
type Anim = { kind: "idle" | "flip" | "ring" | "count" | "slam"; t: number; i: number; shown: boolean };

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 8) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export async function createDeal(
  canvas: HTMLCanvasElement,
  onHud: (h: ReturnType<typeof blankHud>) => void,
  _onProgress?: (p: number) => void,
): Promise<GameHandle> {
  const rawCtx = canvas.getContext("2d");
  if (!rawCtx) throw new Error("Canvas 2D unavailable");
  const ctx: CanvasRenderingContext2D = rawCtx;
  const input = new Input();
  const sfx = new Sfx();
  input.attach();
  canvas.tabIndex = 0;
  const save = loadCareer();
  const face = await loadImage("/jed-face.png", 2000);
  const bg = await loadImage("/maps/timog.jpg", 2500);
  const sedan = await loadImage("/sprites/sedan.png", 2000);
  const suv = await loadImage("/sprites/suv.png", 2000);

  let vw = 960;
  let vh = 540;
  let dpr = 1;
  let screen: Screen = "play";
  let menuReturn: Screen = "play";
  let cases: Case[] = [];
  let mine = -1;
  let cursor = 0;
  let offerSel = 0;
  let phase: Phase = "pick";
  let round = 0;
  let toOpen = OPEN_PER[0];
  let offer = 0;
  let offerShown = 0;
  let clock = 0;
  let score = 0;
  let record = false;
  let bannerT = 1.8;
  let running = true;
  let acc = 0;
  let last = performance.now();
  let raf = 0;
  let hudAcc = 0;
  let lockT = 0;
  let prevMove = 0;
  let anim: Anim = { kind: "slam", t: 0, i: -1, shown: false };
  let callout = { title: "PICK YOUR CASE", copy: "A / D move. Jump locks it in.", t: 2.4 };
  let shake = 0;
  let peeked = new Set<number>();
  const lo = () => resolveLoadout(save.equipped);

  function leftover() {
    return cases.filter((c) => !c.open && c.id !== mine);
  }
  function openedValues() {
    return new Set(cases.filter((c) => c.open).map((c) => c.value));
  }
  function hud() {
    const unit = lo();
    return blankHud(save, {
      screen,
      levelName: "Jed's Deal",
      kicker: `${unit.year} ${unit.name} · ${unit.dealLine}`,
      clock,
      pesos: score,
      progress: mine < 0 ? 0 : 1 - leftover().length / 11,
      record,
      popup: null,
      mode: "deal",
      score,
      padAction: "Pick",
      missionHint:
        phase === "offer"
          ? `JED OFFERS ${formatPesos(Math.round(offerShown))} · A no · D deal`
          : phase === "final"
            ? "Keep yours or swap the last case"
            : `${unit.tag} · BEST ${formatPesos(save.dealBest)}`,
      banner: bannerT > 0 ? "JED'S DEAL" : "",
    });
  }
  function push() {
    onHud(hud());
  }
  function say(title: string, copy: string, t = 2) {
    callout = { title, copy, t };
  }
  function reset() {
    const vals = shuffle(VALUES);
    cases = vals.map((value, i) => ({ id: i, value, open: false }));
    mine = -1;
    cursor = 0;
    offerSel = 0;
    phase = "pick";
    round = 0;
    toOpen = OPEN_PER[0];
    offer = 0;
    offerShown = 0;
    clock = 0;
    score = 0;
    record = false;
    screen = "play";
    bannerT = 1.6;
    lockT = 0.4;
    anim = { kind: "slam", t: 0, i: -1, shown: false };
    peeked = new Set();
    const unit = lo();
    say("PICK YOUR CASE", unit.id === "vios" ? "Twelve briefcases. One is yours." : `${unit.tag}. ${unit.dealLine}`, 2.4);
    sfx.unlock();
    push();
  }
  function bankerOffer() {
    const left = cases.filter((c) => !c.open).map((c) => c.value);
    const avg = left.reduce((a, b) => a + b, 0) / Math.max(1, left.length);
    const hi = Math.max(...left, 0);
    const pressure = 0.52 + round * 0.09;
    const unit = lo();
    offer = Math.max(5000, Math.round(((avg * 0.62 + hi * 0.18) * pressure * unit.dealOfferMul) / 1000) * 1000);
    offerShown = 0;
    phase = "offer";
    offerSel = 0;
    anim = { kind: "ring", t: 0, i: -1, shown: false };
    lockT = 0.9;
    shake = 0.6;
    say("BANKER CALLING", "Jed's on the line.", 1.6);
    sfx.unlockChime();
    push();
  }
  function finish(amount: number, dealt: boolean) {
    score = Math.max(0, Math.round(amount));
    screen = "win";
    phase = "win";
    if (score > save.dealBest) {
      save.dealBest = score;
      record = true;
    }
    save.careerPesos += score;
    awardMissions(save);
    writeCareer(save);
    const fresh = freshUnlocks(save);
    for (const c of fresh) if (!save.cars.includes(c.id)) save.cars.push(c.id);
    if (fresh.length) writeCareer(save);
    say(dealt ? "DEAL" : "NO DEAL", `${formatPesos(score)}. ${record ? "New best close." : "Walk in. Drive out."}`, 3);
    input.clearTouch();
    push();
  }
  function nextCursor(dir: number) {
    let n = cursor;
    for (let k = 0; k < 12; k++) {
      n = (n + dir + 12) % 12;
      if (phase === "pick") {
        cursor = n;
        return;
      }
      if (phase === "final") {
        cursor = n === mine ? leftover()[0]?.id ?? n : n;
        return;
      }
      if (cases[n] && !cases[n].open && n !== mine) {
        cursor = n;
        return;
      }
    }
  }
  function startFlip(i: number) {
    const c = cases[i];
    if (!c || c.open) return false;
    if (i === mine && phase !== "final") return false;
    anim = { kind: "flip", t: 0, i, shown: false };
    lockT = 0.85;
    sfx.jump();
    return true;
  }
  function afterFlip() {
    const i = anim.i;
    const c = cases[i];
    if (c) c.open = true;
    toOpen = Math.max(0, toOpen - 1);
    anim = { kind: "idle", t: 0, i: -1, shown: false };
    if (phase === "final") {
      finish(cases[i]?.value ?? 0, false);
      return;
    }
    if (leftover().length <= 1) {
      phase = "final";
      const last = leftover()[0];
      cursor = last ? last.id : mine;
      offerSel = 0;
      say("LAST CASE", "Keep yours or swap. A keep · D swap · Jump lock.", 2.4);
      lockT = 0.35;
      push();
      return;
    }
    if (toOpen <= 0) {
      bankerOffer();
      return;
    }
    nextCursor(1);
    say(formatPesos(c?.value ?? 0), `${toOpen} more to open.`, 1.4);
    push();
  }
  function confirm() {
    if (lockT > 0 || anim.kind === "flip" || anim.kind === "slam") return;
    if (phase === "pick") {
      mine = cursor;
      phase = "open";
      round = 0;
      toOpen = OPEN_PER[0];
      nextCursor(1);
      const unit = lo();
      peeked = new Set();
      if (unit.dealPeek > 0) {
        const pool = cases.map((_, i) => i).filter((i) => i !== mine);
        for (let n = pool.length - 1; n > 0; n--) {
          const j = Math.floor(Math.random() * (n + 1));
          const tmp = pool[n];
          pool[n] = pool[j];
          pool[j] = tmp;
        }
        for (let k = 0; k < unit.dealPeek && k < pool.length; k++) peeked.add(pool[k]);
      }
      say(
        `CASE ${mine + 1} IS YOURS`,
        peeked.size ? `${unit.tag} scouted ${peeked.size} case${peeked.size > 1 ? "s" : ""}. Open ${toOpen}.` : `Open ${toOpen}. Then Jed calls.`,
        1.8,
      );
      sfx.coin();
      lockT = 0.28;
      push();
      return;
    }
    if (phase === "open") {
      startFlip(cursor);
      return;
    }
    if (phase === "offer") {
      if (offerSel === 1) {
        finish(offer, true);
        return;
      }
      round += 1;
      toOpen = OPEN_PER[Math.min(OPEN_PER.length - 1, round)] ?? 1;
      toOpen = Math.min(toOpen, Math.max(1, leftover().length - 1));
      phase = "open";
      nextCursor(1);
      say("NO DEAL", `Open ${toOpen} more. Keep the line moving.`, 1.6);
      sfx.jump();
      lockT = 0.3;
      push();
      return;
    }
    if (phase === "final") {
      if (offerSel === 1) {
        const last = leftover()[0];
        if (last) startFlip(last.id);
        else finish(cases[mine]?.value ?? 0, false);
      } else {
        startFlip(mine);
      }
    }
  }
  function physics(dt: number) {
    input.sample();
    if (screen === "play" && input.pausePressed) {
      screen = "pause";
      push();
      return;
    }
    if (screen === "pause") {
      if (input.pausePressed) {
        screen = "play";
        push();
      }
      return;
    }
    if (screen === "win" || screen === "garage" || screen === "missions") return;
    if (input.restartPressed) {
      reset();
      return;
    }
    clock += dt;
    lockT = Math.max(0, lockT - dt);
    bannerT = Math.max(0, bannerT - dt);
    callout.t = Math.max(0, callout.t - dt);
    shake = Math.max(0, shake - dt * 2.2);
    hudAcc += dt;
    if (hudAcc >= 0.12) {
      hudAcc = 0;
      push();
    }
    anim.t += dt;
    if (anim.kind === "slam" && anim.t > 0.55) anim = { kind: "idle", t: 0, i: -1, shown: false };
    if (anim.kind === "flip") {
      if (anim.t > 0.22 && !anim.shown) {
        anim.shown = true;
        sfx.stomp();
        shake = 0.35;
      }
      if (anim.t > 0.82) afterFlip();
    }
    if (anim.kind === "ring") {
      if (anim.t > 0.85) {
        anim = { kind: "count", t: 0, i: -1, shown: false };
        say(`JED OFFERS ${formatPesos(offer)}`, "A = no deal. D = deal. Jump locks.", 2.2);
      }
    }
    if (anim.kind === "count") {
      offerShown += (offer - offerShown) * (1 - Math.exp(-5 * dt));
      if (Math.abs(offer - offerShown) < 500) offerShown = offer;
      if (anim.t > 1.1) anim = { kind: "idle", t: 0, i: -1, shown: false };
    }
    const busy = anim.kind === "flip" || anim.kind === "slam" || lockT > 0.15;
    const mx = input.moveX;
    if (!busy) {
      if (phase === "offer" || phase === "final") {
        if (mx < -0.2) offerSel = 0;
        if (mx > 0.2) offerSel = 1;
      } else if (mx < -0.2 && prevMove >= -0.2) nextCursor(-1);
      else if (mx > 0.2 && prevMove <= 0.2) nextCursor(1);
      if (input.jumpPressed) confirm();
    }
    prevMove = mx;
  }
  function caseRect(i: number) {
    const narrow = vw < 720;
    const cols = narrow ? 4 : 6;
    const rows = Math.ceil(12 / cols);
    const pad = padReserve(vh);
    const action = phase === "offer" || phase === "final" ? 52 : 0;
    const top = narrow ? 108 : 84;
    const bottom = pad + 10 + action;
    const boardW = vw - 24;
    const cellW = boardW / cols;
    const cellH = Math.min(82, Math.max(50, (vh - top - bottom) / rows));
    const ox = 12;
    const oy = top;
    const col = i % cols;
    const row = Math.floor(i / cols);
    return { x: ox + col * cellW + 5, y: oy + row * (cellH + 8), w: cellW - 10, h: cellH, cols, rows };
  }
  function present() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, vw, vh);
    const g = ctx.createLinearGradient(0, 0, 0, vh);
    g.addColorStop(0, "#1a1024");
    g.addColorStop(1, "#120c14");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, vw, vh);
    drawSkyline(ctx, bg, vw, vh, clock * 8, vh * 0.7, 0.32);
    ctx.fillStyle = "rgba(10,8,14,0.42)";
    ctx.fillRect(0, 0, vw, vh);
    const sx = (Math.random() - 0.5) * shake * 10;
    const sy = (Math.random() - 0.5) * shake * 8;
    ctx.save();
    ctx.translate(sx, sy);

    ctx.fillStyle = "#f4f4f5";
    ctx.font = "700 22px 'Barlow Condensed', sans-serif";
    const head =
      phase === "pick"
        ? "PICK YOUR CASE"
        : phase === "offer"
          ? anim.kind === "ring"
            ? "PHONE'S RINGING"
            : `JED OFFERS ${formatPesos(Math.round(offerShown || offer))}`
          : phase === "final"
            ? "KEEP OR SWAP"
            : "OPEN A CASE";
    ctx.fillText(head, 16, 30);
    ctx.fillStyle = "#d4a017";
    ctx.font = "600 13px 'DM Sans', sans-serif";
    const unit = lo();
    ctx.fillText(
      mine >= 0 ? `Yours · Case ${mine + 1} · ${unit.tag}` : `${unit.year} ${unit.name} · Walk in.`,
      16,
      50,
    );

    if (face) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(vw - 44, 36, 26, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(face, vw - 70, 10, 52, 52);
      ctx.restore();
      ctx.strokeStyle = "#e10600";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(vw - 44, 36, 26, 0, Math.PI * 2);
      ctx.stroke();
    }
    const parked = lo();
    ctx.save();
    ctx.translate(vw - 124, 10);
    ctx.scale(0.62, 0.62);
    drawUnitSide(ctx, parked.kind === "suv" ? suv : sedan, 0, 0, parked, 1);
    ctx.restore();

    const gone = openedValues();
    const chipW = Math.min(86, (vw - 28) / 6 - 4);
    VALUES.forEach((v, i) => {
      const cx = 14 + (i % 6) * (chipW + 4);
      const cy = 62 + Math.floor(i / 6) * 18;
      ctx.fillStyle = gone.has(v) ? "#2a2c34" : "#d4a017";
      ctx.font = "700 11px 'Barlow Condensed', sans-serif";
      ctx.fillText(formatPesos(v), cx, cy);
    });

    const slam = anim.kind === "slam" ? Math.min(1, anim.t / 0.45) : 1;
    for (let i = 0; i < 12; i++) {
      const c = cases[i];
      if (!c) continue;
      const r = caseRect(i);
      const flipping = anim.kind === "flip" && anim.i === i;
      const pop = flipping ? 1 + Math.sin(Math.min(1, anim.t / 0.8) * Math.PI) * 0.08 : 1;
      const sxK = flipping ? Math.max(0.08, Math.abs(Math.cos(anim.t * 6.2))) : 1;
      const yOff = (1 - slam) * (30 + (i % 4) * 10);
      const x = r.x + r.w * (1 - sxK) * 0.5;
      const y = r.y + yOff;
      const w = r.w * sxK;
      const on = phase !== "offer" && i === cursor && anim.kind !== "flip";
      const showVal = c.open || (flipping && anim.shown) || peeked.has(i);
      ctx.save();
      ctx.fillStyle = showVal ? "#2a2c34" : i === mine ? "#3a2418" : "#1c1822";
      ctx.strokeStyle = on ? "#e10600" : i === mine ? "#d4a017" : peeked.has(i) && !c.open ? "#60a5fa" : showVal ? "#3a3c44" : "#c4a056";
      ctx.lineWidth = on ? 3 : 1.6;
      box(ctx, x, y, w, r.h * pop, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = showVal ? "#d4a017" : "#f4f4f5";
      ctx.font = `700 ${Math.round(16 * pop)}px 'Barlow Condensed', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(showVal ? formatPesos(c.value) : String(i + 1), x + w / 2, y + r.h * 0.52);
      if (i === mine && !c.open && !flipping) {
        ctx.fillStyle = "#d4a017";
        ctx.font = "600 10px 'DM Sans', sans-serif";
        ctx.fillText("YOURS", x + w / 2, y + r.h * 0.78);
      } else if (peeked.has(i) && !c.open && !flipping) {
        ctx.fillStyle = "#60a5fa";
        ctx.font = "600 9px 'DM Sans', sans-serif";
        ctx.fillText("SCOUT", x + w / 2, y + r.h * 0.78);
      }
      ctx.textAlign = "left";
      ctx.restore();
    }

    if (phase === "offer" && anim.kind !== "ring") {
      const by = vh - padReserve(vh) - 50;
      const bw = Math.min(168, vw * 0.36);
      const labels: [number, string][] = [
        [0, "NO DEAL"],
        [1, "DEAL"],
      ];
      labels.forEach(([i, label]) => {
        const x = vw / 2 + (i === 0 ? -bw - 8 : 8);
        const on = offerSel === i;
        ctx.fillStyle = on ? (i === 1 ? "#e10600" : "#1e1c24") : "#1e1c24";
        ctx.strokeStyle = on ? "#f4f4f5" : "#d4a017";
        ctx.lineWidth = on ? 3 : 1.4;
        box(ctx, x, by, bw, 44, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f4f4f5";
        ctx.font = "700 16px 'Barlow Condensed', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, x + bw / 2, by + 28);
        ctx.textAlign = "left";
      });
    }
    if (phase === "final") {
      const by = vh - padReserve(vh) - 50;
      const bw = Math.min(168, vw * 0.36);
      (["KEEP", "SWAP"] as const).forEach((label, i) => {
        const x = vw / 2 + (i === 0 ? -bw - 8 : 8);
        const on = offerSel === i;
        ctx.fillStyle = on ? "#e10600" : "#1e1c24";
        ctx.strokeStyle = on ? "#f4f4f5" : "#d4a017";
        ctx.lineWidth = on ? 3 : 1.4;
        box(ctx, x, by, bw, 44, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f4f4f5";
        ctx.font = "700 16px 'Barlow Condensed', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, x + bw / 2, by + 28);
        ctx.textAlign = "left";
      });
    }

    if (callout.t > 0 && phase !== "offer" && phase !== "final") {
      const a = Math.min(1, callout.t * 3);
      const cy = vh - padReserve(vh) - 50;
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(20,16,22,0.86)";
      box(ctx, 16, cy, vw - 32, 50, 10);
      ctx.fill();
      ctx.strokeStyle = "#e10600";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#f4f4f5";
      ctx.font = "700 18px 'Barlow Condensed', sans-serif";
      ctx.fillText(callout.title, 28, cy + 22);
      ctx.fillStyle = "#a0a0ab";
      ctx.font = "600 12px 'DM Sans', sans-serif";
      ctx.fillText(callout.copy, 28, cy + 40);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  function fit() {
    const f = fitView(canvas, ctx);
    vw = f.vw;
    vh = f.vh;
    dpr = f.dpr;
  }
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(canvas.parentElement ?? canvas);
  function loop(now: number) {
    if (!running) return;
    const raw = Math.min(0.05, (now - last) / 1000);
    last = now;
    acc += raw;
    while (acc >= 1 / 60) {
      physics(1 / 60);
      acc -= 1 / 60;
    }
    try {
      present();
    } catch {
      /* keep the loop alive */
    }
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  reset();
  window.__controlsTest = {
    getYaw: () => (input.moveX < 0 ? 1 : input.moveX > 0 ? -1 : 0),
    getSpeed: () => 1,
    setKeys: (codes: string[]) => {
      input.injected = codes.length ? codes : null;
    },
    getState: () => ({
      x: cursor,
      y: 0,
      vx: input.moveX * 318,
      vy: 0,
      grounded: true,
      invuln: lockT,
      deaths: 0,
      screen,
      clock,
      coins: score,
    }),
  };
  const handle: GameHandle = {
    startLevel: () => reset(),
    setScreen: (s) => {
      if (s === "garage" || s === "missions" || s === "wardrobe") {
        if (screen === "play") {
          screen = "pause";
          menuReturn = "pause";
        } else if (screen !== "garage" && screen !== "missions" && screen !== "wardrobe") menuReturn = screen;
      }
      screen = s;
      input.clearTouch();
      push();
    },
    back: () => {
      screen = menuReturn || "play";
      input.clearTouch();
      push();
    },
    pause: () => {
      if (screen === "play") {
        screen = "pause";
        push();
      }
    },
    resume: () => {
      if (screen === "pause") {
        screen = "play";
        canvas.focus({ preventScroll: true });
        push();
      }
    },
    restart: () => reset(),
    destroy: () => {
      running = false;
      cancelAnimationFrame(raf);
      input.detach();
      ro.disconnect();
      if (window.__controlsTest) delete window.__controlsTest;
    },
    setTouch: (t) => applyTouch(input, t),
    equipCar: (id) => {
      if (!save.cars.includes(id)) return;
      save.equipped = id;
      writeCareer(save);
      push();
    },
    equipOutfit: (id) => {
      if (!save.outfits.includes(id)) return;
      save.equippedOutfit = id;
      writeCareer(save);
      push();
    },
    hud,
  };
  push();
  return handle;
}
