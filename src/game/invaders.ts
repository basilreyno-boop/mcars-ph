import { Input, applyTouch } from "./input";
import { Sfx } from "./audio";
import { loadImage, drawImg } from "./assets";
import { loadCareer, writeCareer, freshUnlocks } from "./garage";
import { awardMissions } from "./missions";
import { blankHud } from "./hudBlank";
import { drawSkyline, fitView, padReserve } from "./view";
import type { GameHandle, Screen } from "./types";
import { resolveLoadout } from "./loadout";
import { drawUnitTop } from "./drawCar";
import { drawBossJohn, drawGuard, GUARD_COUNT, guardOrbit } from "./units";

type Alien = { x: number; y: number; alive: boolean };
type Shot = { x: number; y: number; vy: number; foe?: boolean; pierce?: number };

export async function createInvaders(
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
  const walkin = await loadImage("/sprites/walkin.png", 2000);
  const carTop = await loadImage("/sprites/car-top.png", 2000);
  const bg = await loadImage("/maps/timog.jpg", 2500);
  let vw = 960;
  let vh = 540;
  let dpr = 1;
  let screen: Screen = "play";
  let menuReturn: Screen = "play";
  let px = 480;
  let cooldown = 0;
  let dir = 1;
  let aliens: Alien[] = [];
  let shots: Shot[] = [];
  let score = 0;
  let wave = 1;
  let clock = 0;
  let invuln = 0;
  let running = true;
  let acc = 0;
  let last = performance.now();
  let raf = 0;
  let popupT = 2;
  let popupTitle = "QUOTA INVADERS";
  let popupCopy = "Walk-ins incoming. A / D aim. Jump fires the close.";
  let record = false;
  let bannerT = 1.8;
  let lives = 3;
  let hudAcc = 0;
  let grazed = false;
  let johnT = 0;
  let fidT = 0;
  const lo = () => resolveLoadout(save.equipped);

  function grid() {
    aliens = [];
    const cols = vw < 520 ? 6 : 8;
    const rows = 3 + Math.min(2, wave - 1);
    const margin = Math.max(22, vw * 0.08);
    const span = Math.max(120, vw - margin * 2);
    const gap = cols <= 1 ? 0 : span / (cols - 1);
    const rowGap = vh < 500 ? 36 : 42;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        aliens.push({ x: margin + c * gap, y: 64 + r * rowGap, alive: true });
      }
    }
    dir = 1;
  }
  function hud() {
    const unit = lo();
    return blankHud(save, {
      screen,
      levelName: "Quota Invaders",
      kicker: `${unit.year} ${unit.name} · ${unit.invLine}`,
      clock,
      pesos: score,
      progress: aliens.length ? aliens.filter((a) => !a.alive).length / aliens.length : 1,
      record,
      popup: popupT > 0 ? { id: 1, title: popupTitle, copy: popupCopy, kind: "car", jed: true } : null,
      mode: "invaders",
      score,
      wave,
      padAction: "Fire",
      missionHint: `${unit.tag} · WAVE ${wave} · BEST ${save.invadersBest}`,
      banner: bannerT > 0 ? "QUOTA INVADERS" : "",
    });
  }
  function push() {
    onHud(hud());
  }
  function reset() {
    const unit = lo();
    px = vw / 2;
    cooldown = 0;
    shots = [];
    score = 0;
    wave = 1;
    clock = 0;
    lives = unit.invLives;
    invuln = 0.8;
    grazed = unit.firstHazFree;
    johnT = 0;
    fidT = 0;
    screen = "play";
    bannerT = 1.6;
    popupTitle = `${unit.year} ${unit.name}`;
    popupCopy = unit.invLine;
    popupT = 2.2;
    grid();
    sfx.unlock();
    push();
  }
  function over() {
    screen = "win";
    if (score > save.invadersBest) {
      save.invadersBest = score;
      record = true;
    }
    save.careerPesos += score;
    awardMissions(save);
    writeCareer(save);
    const fresh = freshUnlocks(save);
    for (const c of fresh) if (!save.cars.includes(c.id)) save.cars.push(c.id);
    if (fresh.length) writeCareer(save);
    popupTitle = record ? "NEW BEST" : "QUOTA MISSED";
    popupCopy = `${score} closes · wave ${wave}.`;
    popupT = 2.4;
    input.clearTouch();
    push();
  }
  function shipY() {
    return vh - padReserve(vh) - 8;
  }
  function fire() {
    const unit = lo();
    const y = shipY() - 24;
    const vy = -unit.invShotVy;
    if (unit.invShots >= 2) {
      shots.push({ x: px - 12, y, vy, pierce: unit.invPierce });
      shots.push({ x: px + 12, y, vy, pierce: unit.invPierce });
    } else {
      shots.push({ x: px, y, vy, pierce: unit.invPierce });
    }
    cooldown = unit.invCool;
    sfx.jump();
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
    const unit = lo();
    clock += dt;
    popupT = Math.max(0, popupT - dt);
    bannerT = Math.max(0, bannerT - dt);
    cooldown = Math.max(0, cooldown - dt);
    invuln = Math.max(0, invuln - dt);
    johnT = Math.max(0, johnT - dt);
    fidT = Math.max(0, fidT - dt);
    if (fidT > 0) invuln = Math.max(invuln, 0.2);
    if (wave === 2 && johnT <= 0 && clock > 8 && clock < 8.2) {
      johnT = 12;
      popupTitle = "SUMMON BOSS JOHN";
      popupCopy = "He closes the walk-ins with you.";
      popupT = 1.8;
      sfx.power();
    }
    if (wave === 3 && fidT <= 0 && clock > 4 && clock < 4.2) {
      fidT = 9;
      invuln = Math.max(invuln, 9);
      popupTitle = "FIDELITY SECURITY";
      popupCopy = "Terracotta ring. Quota holds.";
      popupT = 1.8;
      sfx.power();
    }
    hudAcc += dt;
    if (hudAcc >= 0.12) {
      hudAcc = 0;
      push();
    }
    px += input.moveX * 380 * unit.invMove * dt;
    px = Math.max(30, Math.min(vw - 30, px));
    if (input.jumpPressed && cooldown <= 0) fire();
    if (johnT > 0 && Math.floor(clock * 8) !== Math.floor((clock - dt) * 8)) {
      shots.push({ x: px + 36, y: shipY() - 32, vy: -unit.invShotVy * 0.9 });
    }
    const live = aliens.filter((a) => a.alive);
    if (!live.length) {
      wave += 1;
      score += Math.round(2000 * unit.invPay);
      grid();
      sfx.unlockChime();
    }
    let bounce = false;
    const spd = 28 + wave * 10;
    const edge = Math.max(18, Math.round(vw * 0.06));
    for (const a of live) {
      a.x += dir * spd * dt;
      if (a.x < edge || a.x > vw - edge) bounce = true;
    }
    if (bounce) {
      dir *= -1;
      const drop = vh < 500 ? 10 : 14;
      for (const a of live) {
        a.y += drop;
        a.x = Math.max(edge, Math.min(vw - edge, a.x));
      }
    }
    if (Math.random() < 0.012 + wave * 0.004 && live.length) {
      const a = live[Math.floor(Math.random() * live.length)];
      shots.push({ x: a.x, y: a.y + 16, vy: 220 + wave * 20, foe: true });
    }
    for (const s of shots) s.y += s.vy * dt;
    shots = shots.filter((s) => s.y > -20 && s.y < vh + 20);
    for (const s of shots) {
      if (s.foe) {
        if (invuln <= 0 && Math.abs(s.x - px) < 18 && Math.abs(s.y - (shipY() - 6)) < 22) {
          if (grazed) {
            grazed = false;
            invuln = 1.1;
            s.y = 9999;
            sfx.power();
            continue;
          }
          lives -= 1;
          invuln = 1.4;
          s.y = 9999;
          sfx.death();
          if (lives <= 0) {
            over();
            return;
          }
        }
        continue;
      }
      for (const a of aliens) {
        if (!a.alive) continue;
        if (Math.abs(s.x - a.x) < 20 && Math.abs(s.y - a.y) < 18) {
          a.alive = false;
          score += Math.round(200 * unit.invPay);
          sfx.stomp();
          if (s.pierce && s.pierce > 0) {
            s.pierce -= 1;
          } else {
            s.y = -99;
            break;
          }
        }
      }
    }
    for (const a of live) {
      if (a.y > shipY() - 46) {
        over();
        return;
      }
    }
  }
  function present() {
    const unit = lo();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    ctx.fillStyle = "#140c14";
    ctx.fillRect(0, 0, vw, vh);
    drawSkyline(ctx, bg, vw, vh, clock * 6, vh * 0.55, 0.4);
    for (const a of aliens) {
      if (!a.alive) continue;
      if (!drawImg(ctx, walkin, a.x - 16, a.y - 18, 32, 36)) {
        ctx.fillStyle = "#f4f4f5";
        ctx.fillRect(a.x - 12, a.y - 14, 24, 28);
      }
    }
    for (const s of shots) {
      ctx.fillStyle = s.foe ? "#e10600" : "#d4a017";
      ctx.fillRect(s.x - 2, s.y - 8, 4, 12);
    }
    const sy = shipY();
    const ghost = invuln > 0 && Math.floor(clock * 16) % 2 === 0;
    if (fidT > 0) {
      for (let i = 0; i < GUARD_COUNT; i++) {
        const g = guardOrbit(px, sy + 16, i, clock, 48);
        drawGuard(ctx, g.x, g.y, g.facing, clock, 0.85);
      }
    }
    if (johnT > 0) drawBossJohn(ctx, px + 40, sy + 12, 1, clock, 1.05, true);
    drawUnitTop(ctx, carTop, px, sy, unit, { ghost });
    ctx.fillStyle = "#f4f4f5";
    ctx.font = "700 22px 'Barlow Condensed', sans-serif";
    ctx.fillText(`${score}   WAVE ${wave}   x${lives}`, 16, 32);
    ctx.fillStyle = "#d4a017";
    ctx.font = "600 13px 'DM Sans', sans-serif";
    ctx.fillText(`${unit.tag} · ${unit.invShots > 1 ? "DUAL" : "FIRE"}${unit.invPierce ? " · PIERCE" : ""}`, 16, 52);
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
    present();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  reset();
  window.__controlsTest = {
    getYaw: () => 0,
    getSpeed: () => Math.abs(input.moveX) * 380 * lo().invMove,
    setKeys: (codes: string[]) => {
      input.injected = codes.length ? codes : null;
    },
    getState: () => ({
      x: px,
      y: shipY(),
      vx: input.moveX * 380,
      vy: 0,
      grounded: true,
      invuln,
      deaths: lo().invLives - lives,
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
