import { Input, applyTouch } from "./input";
import { Sfx } from "./audio";
import { loadImage, drawImg } from "./assets";
import { loadCareer, writeCareer, freshUnlocks } from "./garage";
import { awardMissions } from "./missions";
import { blankHud } from "./hudBlank";
import { drawSkyline, fitView } from "./view";
import { drawJedLite } from "./jedLite";
import { drawBossJohn, drawFoe, drawGuard, GUARD_COUNT, guardOrbit, type EnemyKind } from "./units";
import type { GameHandle, Screen } from "./types";
import { resolveLoadout } from "./loadout";
import { drawUnitSide, unitSideSize } from "./drawCar";

type Foe = { x: number; y: number; w: number; h: number; vx: number; hp: number; kind: EnemyKind };

export async function createSurvival(
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
  const cone = await loadImage("/sprites/cone.png", 1800);
  const sedan = await loadImage("/sprites/sedan.png", 2000);
  const suv = await loadImage("/sprites/suv.png", 2000);
  const bg = await loadImage("/maps/showroom.jpg", 2500);
  const W = 1600;
  const FLOOR = 500;
  let vw = 960;
  let vh = 540;
  let dpr = 1;
  let screen: Screen = "play";
  let menuReturn: Screen = "play";
  let px = 200;
  let py = FLOOR - 42;
  let vx = 0;
  let vy = 0;
  let facing = 1;
  let grounded = true;
  let air = 1;
  let invuln = 1.2;
  let clock = 0;
  let wave = 1;
  let score = 0;
  let spawnT = 0.4;
  let foes: Foe[] = [];
  let running = true;
  let acc = 0;
  let last = performance.now();
  let raf = 0;
  let cam = 0;
  let popupT = 2;
  let popupTitle = "LOT SURVIVAL";
  let popupCopy = "Walk-ins never stop. Stomp them. Last on the lot.";
  let record = false;
  let bannerT = 1.8;
  let hudAcc = 0;
  let armor = 0;
  let grazed = false;
  let johnT = 0;
  let fidT = 0;
  let dropT = 8;
  let dropX = 400;
  let dropKind: "john" | "fidelity" | null = null;
  const lo = () => resolveLoadout(save.equipped);

  function hud() {
    const unit = lo();
    return blankHud(save, {
      screen,
      levelName: "Lot Survival",
      kicker: `${unit.year} ${unit.name} · ${unit.survLine}`,
      clock,
      pesos: score,
      progress: Math.min(1, (clock % 20) / 20),
      record,
      popup: popupT > 0 ? { id: 1, title: popupTitle, copy: popupCopy, kind: "car", jed: true } : null,
      mode: "survival",
      score,
      wave,
      padAction: "Jump",
      missionHint: `${unit.tag} · WAVE ${wave} · BEST ${save.survivalBest}s`,
      banner: bannerT > 0 ? "LAST ON THE LOT" : "",
    });
  }
  function push() {
    onHud(hud());
  }
  function reset() {
    const unit = lo();
    px = 220;
    py = FLOOR - 42;
    vx = 0;
    vy = 0;
    facing = 1;
    grounded = true;
    air = unit.survAir;
    invuln = 1.2;
    clock = 0;
    wave = 1;
    score = 0;
    spawnT = 0.3;
    foes = [];
    armor = unit.survArmor;
    grazed = unit.firstHazFree;
    johnT = 0;
    fidT = 0;
    dropT = 7;
    dropKind = null;
    screen = "play";
    bannerT = 1.6;
    popupTitle = `${unit.year} ${unit.name}`;
    popupCopy = unit.survLine;
    popupT = 2.2;
    sfx.unlock();
    push();
  }
  function die() {
    if (invuln > 0 || screen !== "play") return;
    if (grazed) {
      grazed = false;
      invuln = 1.2;
      sfx.power();
      popupTitle = "CLEAN";
      popupCopy = "First tag. Still last on the lot.";
      popupT = 1.3;
      return;
    }
    if (armor > 0) {
      armor -= 1;
      invuln = 1.4;
      sfx.power();
      popupTitle = "UNIT ARMOR";
      popupCopy = `${armor} left. Walk-ins still coming.`;
      popupT = 1.4;
      return;
    }
    sfx.death();
    screen = "win";
    const t = Math.floor(clock);
    if (t > save.survivalBest) {
      save.survivalBest = t;
      record = true;
    }
    save.careerPesos += t * 200 + score;
    awardMissions(save);
    writeCareer(save);
    const fresh = freshUnlocks(save);
    for (const c of fresh) if (!save.cars.includes(c.id)) save.cars.push(c.id);
    if (fresh.length) writeCareer(save);
    popupTitle = record ? "NEW BEST" : "LOT CLOSED";
    popupCopy = `${t}s · wave ${wave}. ${record ? "Elite Agent pace." : "Walk-ins still coming."}`;
    popupT = 2.4;
    input.clearTouch();
    push();
  }
  function spawn() {
    const fromL = Math.random() < 0.5;
    const n = 1 + Math.floor(wave / 3);
    for (let i = 0; i < n; i++) {
      const kinds: EnemyKind[] = ["walkin", "rival", "repo"];
      const kind = kinds[(wave + i) % 3];
      foes.push({
        x: fromL ? -40 - i * 50 : W + 10 + i * 50,
        y: FLOOR - 40,
        w: kind === "repo" ? 30 : 28,
        h: 40,
        vx: (fromL ? 1 : -1) * ((kind === "repo" ? 90 : 70) + wave * 12 + Math.random() * 40),
        hp: kind === "repo" ? 2 : 1,
        kind,
      });
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
    const unit = lo();
    clock += dt;
    popupT = Math.max(0, popupT - dt);
    bannerT = Math.max(0, bannerT - dt);
    invuln = Math.max(0, invuln - dt);
    johnT = Math.max(0, johnT - dt);
    fidT = Math.max(0, fidT - dt);
    if (fidT > 0) invuln = Math.max(invuln, 0.2);
    dropT -= dt;
    if (dropT <= 0 && !dropKind) {
      dropKind = Math.random() < 0.5 ? "john" : "fidelity";
      dropX = 220 + Math.random() * 1100;
      dropT = 14;
    }
    if (dropKind) {
      const dx = dropX - 14;
      if (Math.abs(px - dropX) < 28 && py > FLOOR - 80) {
        if (dropKind === "john") {
          johnT = 10;
          popupTitle = "SUMMON BOSS JOHN";
          popupCopy = "The closer walks in.";
        } else {
          fidT = 8;
          invuln = Math.max(invuln, 8);
          popupTitle = "FIDELITY SECURITY";
          popupCopy = "Terracotta ring. Nothing tags you.";
        }
        popupT = 1.8;
        sfx.power();
        dropKind = null;
      }
    }
    hudAcc += dt;
    if (hudAcc >= 0.12) {
      hudAcc = 0;
      push();
    }
    const nextWave = 1 + Math.floor(clock / 18);
    if (nextWave !== wave) {
      wave = nextWave;
      sfx.unlockChime();
    }
    spawnT -= dt;
    if (spawnT <= 0) {
      spawnT = Math.max(0.55, 2.1 - wave * 0.12);
      spawn();
    }
    const cap = 320 * unit.survSpeed;
    if (input.moveX !== 0) {
      vx += input.moveX * 3200 * unit.survSpeed * dt;
      facing = input.moveX < 0 ? -1 : 1;
    } else if (grounded) vx *= Math.max(0, 1 - 14 * dt);
    vx = Math.max(-cap, Math.min(cap, vx));
    if (input.jumpPressed && (grounded || air > 0)) {
      if (!grounded && unit.blinkDash) {
        vx = facing * 640;
        vy = Math.min(vy, -220);
        invuln = Math.max(invuln, 0.22);
      } else {
        vy = (grounded ? -860 : -720) * unit.survJump;
      }
      if (!grounded) air -= 1;
      grounded = false;
      sfx.jump();
    }
    vy += (vy < 0 ? 1780 : 2680) * dt;
    px += vx * dt;
    py += vy * dt;
    if (px < 20) {
      px = 20;
      vx = 0;
    }
    if (px > W - 40) {
      px = W - 40;
      vx = 0;
    }
    if (py >= FLOOR - 42) {
      py = FLOOR - 42;
      vy = 0;
      if (!grounded) sfx.land();
      grounded = true;
      air = unit.survAir;
    }
    const hit = {
      x: px + 4 - Math.max(0, (unit.survHitW - 20) / 2),
      y: py + 6,
      w: unit.survHitW,
      h: unit.survHitH,
    };
    for (let i = foes.length - 1; i >= 0; i--) {
      const f = foes[i];
      f.x += f.vx * dt;
      if (f.x < -80 || f.x > W + 80) {
        foes.splice(i, 1);
        continue;
      }
      const box = { x: f.x, y: f.y, w: f.w, h: f.h };
      if (!(hit.x < box.x + box.w && hit.x + hit.w > box.x && hit.y < box.y + box.h && hit.y + hit.h > box.y)) continue;
      if (vy > 80 && py + 40 < f.y + 22) {
        foes.splice(i, 1);
        vy = -520;
        const pay = 500;
        score += pay;
        save.careerPesos += pay;
        sfx.stomp();
        continue;
      }
      if (unit.survRam && Math.abs(vx) > 180) {
        foes.splice(i, 1);
        score += 400;
        save.careerPesos += 400;
        sfx.stomp();
        continue;
      }
      if (johnT > 0 || fidT > 0) {
        foes.splice(i, 1);
        score += 600;
        save.careerPesos += 600;
        sfx.stomp();
        continue;
      }
      die();
      return;
    }
  }
  function present() {
    const unit = lo();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cam += (px - vw * 0.42 - cam) * 0.12;
    cam = Math.max(0, Math.min(W - vw, cam));
    ctx.clearRect(0, 0, vw, vh);
    ctx.fillStyle = "#1c1820";
    ctx.fillRect(0, 0, vw, vh);
    drawSkyline(ctx, bg, vw, vh, cam * 0.12, FLOOR, 0.55);
    ctx.save();
    ctx.translate(-Math.round(cam), 0);
    ctx.fillStyle = "#2c2e38";
    ctx.fillRect(-40, FLOOR, W + 80, 200);
    ctx.fillStyle = "#e10600";
    ctx.fillRect(-40, FLOOR, W + 80, 4);
    ctx.fillStyle = "#d8dae4";
    ctx.fillRect(-40, FLOOR + 4, W + 80, 4);
    if (dropKind) {
      ctx.fillStyle = dropKind === "john" ? "#d4a017" : "#c9a227";
      ctx.beginPath();
      ctx.arc(dropX, FLOOR - 36 + Math.sin(clock * 4) * 4, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0b0b0d";
      ctx.font = "700 9px 'Barlow Condensed', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(dropKind === "john" ? "JOHN" : "FID", dropX, FLOOR - 33 + Math.sin(clock * 4) * 4);
      ctx.textAlign = "left";
    }
    for (const f of foes) {
      drawFoe(ctx, f.kind, f.x + f.w / 2, f.y + f.h, f.vx < 0 ? -1 : 1, clock);
    }
    if (fidT > 0) {
      for (let i = 0; i < GUARD_COUNT; i++) {
        const g = guardOrbit(px + 13, py + 42, i, clock, 52);
        drawGuard(ctx, g.x, g.y, g.facing, clock);
      }
    }
    if (johnT > 0) {
      drawBossJohn(ctx, px - facing * 44, py + 42, facing, clock, 1.12, Math.abs(vx) > 40);
    }
    const ghost = invuln > 0 && Math.floor(clock * 16) % 2 === 0;
    const carImg = unit.kind === "suv" ? suv : sedan;
    const sz = unitSideSize(unit);
    const carX = px + 13 - sz.w * 0.45;
    const carY = py + 42 - sz.h;
    drawUnitSide(ctx, carImg, carX, carY, unit, facing, { ghost });
    if (!ghost) drawJedLite(ctx, px + 13, carY + 10, facing, clock, 1, save.equippedOutfit, { pose: grounded ? (Math.abs(vx) > 40 ? "run" : "idle") : "air" });
    ctx.restore();
    ctx.fillStyle = "#f4f4f5";
    ctx.font = "700 22px 'Barlow Condensed', sans-serif";
    ctx.fillText(`${Math.floor(clock)}s  WAVE ${wave}`, 16, 32);
    ctx.fillStyle = "#d4a017";
    ctx.font = "600 13px 'DM Sans', sans-serif";
    ctx.fillText(`${unit.tag}${armor ? ` · ARMOR ${armor}` : unit.survRam ? " · RAM" : ""}`, 16, 52);
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
    getYaw: () => (facing < 0 ? 1 : -1),
    getSpeed: () => Math.hypot(vx, vy),
    setKeys: (codes: string[]) => {
      input.injected = codes.length ? codes : null;
    },
    getState: () => ({
      x: px,
      y: py,
      vx,
      vy,
      grounded,
      invuln,
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
