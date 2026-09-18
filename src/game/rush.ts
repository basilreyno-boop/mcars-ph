import { Input, applyTouch } from "./input";
import { Sfx } from "./audio";
import { loadImage, drawImg } from "./assets";
import { loadCareer, writeCareer, freshUnlocks } from "./garage";
import { awardMissions } from "./missions";
import { blankHud } from "./hudBlank";
import { drawSkyline, fitView, padReserve } from "./view";
import { formatKm, type GameHandle, type Screen } from "./types";
import { resolveLoadout } from "./loadout";
import { drawUnitTop } from "./drawCar";

type Car = { lane: number; y: number; kind: "player" | "sedan" | "jeep"; dead?: boolean };

export async function createRush(
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
  const playerImg = await loadImage("/sprites/car-top.png", 2000);
  const trafficImg = await loadImage("/sprites/car-traffic.png", 2000);
  const bg = await loadImage("/maps/edsa.jpg", 2500);

  let vw = 960;
  let vh = 540;
  let dpr = 1;
  let screen: Screen = "play";
  let menuReturn: Screen = "play";
  let lane = 1;
  let x = 0;
  let hop = 0;
  let invuln = 1.2;
  let dist = 0;
  let speed = 420;
  let clock = 0;
  let score = 0;
  let record = false;
  let popupT = 0;
  let popupTitle = "EDSA RUSH";
  let popupCopy = "A left. D right. Hop the bumpers. Don't eat traffic.";
  let cars: Car[] = [];
  let coins: { lane: number; y: number }[] = [];
  let spawnT = 0;
  let coinT = 0.8;
  let running = true;
  let acc = 0;
  let last = performance.now();
  let raf = 0;
  let bannerT = 2;
  let hudAcc = 0;
  let prevMove = 0;
  let armor = 0;
  let ram = 0;
  let grazed = false;
  const lanes = () => [vw * 0.32, vw * 0.5, vw * 0.68];
  const carY = () => vh - padReserve(vh) - 28;
  const lo = () => resolveLoadout(save.equipped);

  function hud() {
    const unit = lo();
    return blankHud(save, {
      screen,
      levelName: "EDSA Rush",
      kicker: `${unit.year} ${unit.name} · ${unit.rushLine}`,
      clock,
      pesos: score,
      progress: Math.min(1, dist / 4000),
      record,
      popup: popupT > 0 ? { id: 1, title: popupTitle, copy: popupCopy, kind: "car", jed: true } : null,
      mode: "rush",
      score: Math.round(dist),
      padAction: "Hop",
      missionHint: `${unit.tag} · BEST ${formatKm(save.rushBest)} · ${formatKm(dist)}`,
      banner: bannerT > 0 ? "EDSA RUSH" : "",
    });
  }
  function push() {
    onHud(hud());
  }
  function reset() {
    const unit = lo();
    lane = 1;
    hop = 0;
    invuln = 1.1;
    dist = 0;
    speed = 420 * unit.rushSpeed;
    clock = 0;
    score = 0;
    record = false;
    cars = [];
    coins = [];
    spawnT = 0.2;
    coinT = 0.6;
    armor = unit.rushArmor;
    ram = unit.rushRam;
    grazed = unit.firstHazFree;
    screen = "play";
    bannerT = 1.6;
    popupTitle = `${unit.year} ${unit.name}`;
    popupCopy = unit.rushLine;
    popupT = 2.2;
    sfx.unlock();
    push();
  }
  function crash() {
    if (hop > 0 || screen !== "play") return;
    if (invuln > 0) return;
    if (grazed) {
      grazed = false;
      invuln = 1.15;
      sfx.power();
      popupTitle = "CLEAN";
      popupCopy = "First graze. Still on the road.";
      popupT = 1.3;
      return;
    }
    if (armor > 0) {
      armor -= 1;
      invuln = 1.35;
      sfx.power();
      popupTitle = "UNIT ARMOR";
      popupCopy = `${armor} left. Keep the line moving.`;
      popupT = 1.4;
      return;
    }
    sfx.death();
    screen = "win";
    const best = dist > save.rushBest;
    if (best) {
      save.rushBest = dist;
      record = true;
    }
    save.careerPesos += Math.round((dist / 8) * lo().rushCoin);
    awardMissions(save);
    writeCareer(save);
    const fresh = freshUnlocks(save);
    for (const c of fresh) if (!save.cars.includes(c.id)) save.cars.push(c.id);
    if (fresh.length) writeCareer(save);
    popupTitle = best ? "NEW BEST" : "TRAFFIC WINS";
    popupCopy = `${formatKm(dist)} on EDSA. ${best ? "Same-day pace." : "Hop the next bumper."}`;
    popupT = 2.4;
    input.clearTouch();
    push();
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
    clock += dt;
    popupT = Math.max(0, popupT - dt);
    bannerT = Math.max(0, bannerT - dt);
    invuln = Math.max(0, invuln - dt);
    hop = Math.max(0, hop - dt);
    hudAcc += dt;
    if (hudAcc >= 0.12) {
      hudAcc = 0;
      push();
    }
    if (input.restartPressed) {
      reset();
      return;
    }
    const unit = lo();
    if (input.moveX < -0.2 && prevMove >= -0.2) lane = Math.max(0, lane - 1);
    if (input.moveX > 0.2 && prevMove <= 0.2) lane = Math.min(2, lane + 1);
    prevMove = input.moveX;
    if (input.jumpPressed && hop <= 0) {
      hop = unit.rushHop;
      invuln = Math.max(invuln, unit.rushHop);
      sfx.jump();
    }
    const xs = lanes();
    const tx = xs[lane];
    x += (tx - x) * (1 - Math.exp(-unit.rushLaneK * dt));
    speed = Math.min(820 * unit.rushSpeed, (420 + dist * 0.04) * unit.rushSpeed);
    dist += speed * dt;
    spawnT -= dt;
    coinT -= dt;
    if (spawnT <= 0) {
      spawnT = Math.max(0.38, 1.05 - dist / 8000);
      const near = cars.filter((c) => c.y < 200 && c.y > -60).map((c) => c.lane);
      const occ = new Set(near);
      const free = [0, 1, 2].filter((l) => !occ.has(l));
      if (free.length >= 1) {
        const pool = free.length === 1 ? [free[0], free[0], occ.size ? [...occ][0] : free[0]] : free;
        const laneN = pool[Math.floor(Math.random() * pool.length)];
        const nextOcc = new Set(occ);
        nextOcc.add(laneN);
        if (nextOcc.size < 3) {
          cars.push({ lane: laneN, y: -90, kind: Math.random() < 0.22 ? "jeep" : "sedan" });
        }
      }
    }
    if (coinT <= 0) {
      coinT = 0.7;
      coins.push({ lane: Math.floor(Math.random() * 3), y: -40 });
    }
    const py = carY();
    for (const c of cars) c.y += speed * dt;
    for (const c of coins) c.y += speed * dt;
    cars = cars.filter((c) => c.y < vh + 80 && !c.dead);
    coins = coins.filter((c) => c.y < vh + 40);
    const hitW = unit.rushHitW;
    if (hop <= 0) {
      for (const c of cars) {
        const cx = lanes()[c.lane];
        if (Math.abs(cx - x) < hitW + 10 && Math.abs(c.y - py) < 36) {
          if (ram > 0) {
            ram -= 1;
            c.dead = true;
            invuln = Math.max(invuln, 0.22);
            score += 800;
            save.careerPesos += 800;
            dist += 30;
            sfx.stomp();
            continue;
          }
          crash();
          return;
        }
      }
    }
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      const cx = lanes()[c.lane];
      const reach = unit.rushMagnet ? 72 : 26;
      if (Math.abs(cx - x) < reach && Math.abs(c.y - py) < 30) {
        coins.splice(i, 1);
        const pay = Math.round(1000 * unit.rushCoin);
        score += pay;
        save.careerPesos += pay;
        dist += 40;
        sfx.peso();
      }
    }
  }
  function present() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, vw, vh);
    const sky = ctx.createLinearGradient(0, 0, 0, vh);
    sky.addColorStop(0, "#1c2748");
    sky.addColorStop(1, "#1a1424");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, vw, vh);
    if (bg) {
      drawSkyline(ctx, bg, vw, vh, dist * 0.12, vh * 0.42, 0.5);
    }
    const roadX = vw * 0.22;
    const roadW = vw * 0.56;
    ctx.fillStyle = "#16181e";
    ctx.fillRect(roadX, 0, roadW, vh);
    ctx.fillStyle = "#e10600";
    ctx.fillRect(roadX, 0, 6, vh);
    ctx.fillRect(roadX + roadW - 6, 0, 6, vh);
    ctx.fillStyle = "rgba(244,244,245,0.55)";
    const dash = (dist * 1.4) % 44;
    for (let i = -1; i < vh / 22; i++) {
      ctx.fillRect(vw * 0.41, i * 44 + 10 - dash, 5, 18);
      ctx.fillRect(vw * 0.59, i * 44 + 10 - dash, 5, 18);
    }
    const xs = lanes();
    const py = carY();
    for (const c of coins) {
      ctx.fillStyle = "#d4a017";
      ctx.beginPath();
      ctx.arc(xs[c.lane], c.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const c of cars) {
      if (c.dead) continue;
      const img = trafficImg;
      const h = c.kind === "jeep" ? 78 : 64;
      const w = c.kind === "jeep" ? 42 : 36;
      if (!drawImg(ctx, img, xs[c.lane] - w / 2, c.y - h / 2, w, h)) {
        ctx.fillStyle = "#c8cad4";
        ctx.fillRect(xs[c.lane] - w / 2, c.y - h / 2, w, h);
      }
    }
    const unit = lo();
    const ghost = invuln > 0 && Math.floor(clock * 16) % 2 === 0;
    drawUnitTop(ctx, playerImg, x, py, unit, { hop, ghost });
    ctx.fillStyle = "#f4f4f5";
    ctx.font = "700 22px 'Barlow Condensed', sans-serif";
    ctx.fillText(formatKm(dist), 16, 32);
    ctx.fillStyle = "#d4a017";
    ctx.font = "600 13px 'DM Sans', sans-serif";
    ctx.fillText(`${unit.tag}${armor ? ` · ARMOR ${armor}` : ""}${ram ? ` · RAM ${ram}` : ""} · A / D · Hop`, 16, 52);
  }
  function fit() {
    const f = fitView(canvas, ctx);
    vw = f.vw;
    vh = f.vh;
    dpr = f.dpr;
    x = lanes()[lane];
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
    getYaw: () => (lane === 0 ? 1 : lane === 2 ? -1 : 0),
    getSpeed: () => speed,
    setKeys: (codes: string[]) => {
      input.injected = codes.length ? codes : null;
    },
    getState: () => ({
      x,
      y: carY(),
      vx: input.moveX * 318,
      vy: hop > 0 ? -200 : 0,
      grounded: hop <= 0,
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
      if (s !== "play") input.clearTouch();
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
