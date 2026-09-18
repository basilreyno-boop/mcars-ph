import { Input, applyTouch } from "./input";
import { Sfx } from "./audio";
import { loadImage, drawImg } from "./assets";
import { loadCareer, writeCareer, freshUnlocks } from "./garage";
import { awardMissions } from "./missions";
import { blankHud } from "./hudBlank";
import { drawSkyline, fitView } from "./view";
import { drawJedLite } from "./jedLite";
import { POWER_META, type GameHandle, type PowerKind, type Rect, type Screen } from "./types";
import { resolveLoadout } from "./loadout";
import { drawUnitSide, unitSideSize } from "./drawCar";

type FoeKind = "walkin" | "cone" | "elite";
type LootKind = "key" | "peso" | "flask" | "scroll" | "weapon";
type WeaponId = "clip" | "gavel" | "keys" | "star";
type Biome = "showroom" | "edsa" | "timog" | "clark";

type Foe = {
  x: number; y: number; w: number; h: number; vx: number;
  hp: number; max: number; kind: FoeKind; hurt: number; min: number; maxX: number;
};
type Loot = { x: number; y: number; kind: LootKind; power?: PowerKind; weapon?: WeaponId; got: boolean };
type Solid = Rect & { oneWay?: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };

type Room = {
  biome: Biome;
  name: string;
  width: number;
  solids: Solid[];
  foes: Foe[];
  loot: Loot[];
  doorX: number;
};

const FLOOR = 500;
const PW = 26;
const PH = 40;
const WEAPONS: Record<WeaponId, { name: string; range: number; dmg: number; cool: number; knock: number }> = {
  clip: { name: "Clipboard", range: 48, dmg: 1, cool: 0.34, knock: 140 },
  gavel: { name: "Gavel", range: 72, dmg: 2, cool: 0.42, knock: 280 },
  keys: { name: "Keyring", range: 52, dmg: 1, cool: 0.16, knock: 90 },
  star: { name: "Same-Day Star", range: 60, dmg: 2, cool: 0.26, knock: 200 },
};

function aabb(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function plat(x: number, y: number, w: number, oneWay = true): Solid {
  return { x, y, w, h: 18, oneWay };
}

function makeRooms(): Room[] {
  const biomes: { biome: Biome; name: string }[] = [
    { biome: "showroom", name: "Malabon Floor" },
    { biome: "showroom", name: "Lift Bay" },
    { biome: "edsa", name: "EDSA Crawl" },
    { biome: "edsa", name: "Overpass Pit" },
    { biome: "timog", name: "Music Box Hall" },
    { biome: "timog", name: "Timog Rafters" },
    { biome: "clark", name: "Freeport Line" },
    { biome: "clark", name: "Hangar Close" },
  ];
  return biomes.map((b, i) => buildRoom(i, b.biome, b.name));
}

function foe(kind: FoeKind, x: number, min: number, maxX: number): Foe {
  const elite = kind === "elite";
  const cone = kind === "cone";
  const h = cone ? 28 : elite ? 46 : 40;
  return {
    x, y: FLOOR - h, w: cone ? 22 : elite ? 32 : 28, h,
    vx: cone ? 0 : (x % 2 ? 1 : -1) * (elite ? 90 : 70),
    hp: elite ? 3 : 1, max: elite ? 3 : 1, kind, hurt: 0, min, maxX,
  };
}

function loot(kind: LootKind, x: number, y = FLOOR - 28, extra: Partial<Loot> = {}): Loot {
  return { x, y, kind, got: false, ...extra };
}

function buildRoom(i: number, biome: Biome, name: string): Room {
  const width = 1680 + i * 90;
  const solids: Solid[] = [{ x: -40, y: FLOOR, w: width + 80, h: 90 }];
  const foes: Foe[] = [];
  const drops: Loot[] = [];
  const doorX = width - 70;

  if (i === 0) {
    solids.push(plat(420, 410, 180), plat(760, 350, 160));
    foes.push(foe("walkin", 380, 200, 700), foe("walkin", 820, 500, 1100), foe("cone", 600, 0, 0), foe("walkin", 1280, 1100, 1500));
    drops.push(loot("key", 250), loot("scroll", 210, FLOOR - 28, { power: "approved" }), loot("key", 480, 382), loot("peso", 790, 322), loot("flask", 980), loot("key", 1400));
  } else if (i === 1) {
    solids.push(plat(300, 400, 200), plat(620, 330, 180), plat(980, 380, 220), plat(1280, 300, 160));
    foes.push(foe("cone", 360, 0, 0), foe("walkin", 700, 400, 900), foe("walkin", 1040, 800, 1300), foe("elite", 1400, 1200, 1600));
    drops.push(loot("key", 340, 372), loot("scroll", 700, 302, { power: "approved" }), loot("weapon", 1320, 272, { weapon: "gavel" }), loot("peso", 1100));
  } else if (i === 2) {
    solids[0] = { x: -40, y: FLOOR, w: 520, h: 90 };
    solids.push({ x: 680, y: FLOOR, w: 420, h: 90 }, { x: 1280, y: FLOOR, w: width - 1240, h: 90 });
    solids.push(plat(500, 390, 160), plat(1080, 360, 180));
    foes.push(foe("walkin", 240, 40, 460), foe("cone", 760, 0, 0), foe("walkin", 900, 700, 1080), foe("walkin", 1480, 1320, 1700));
    drops.push(loot("key", 200), loot("key", 540, 362), loot("flask", 1140, 332), loot("peso", 1500));
  } else if (i === 3) {
    solids[0] = { x: -40, y: FLOOR, w: 380, h: 90 };
    solids.push({ x: 560, y: FLOOR, w: 300, h: 90 }, { x: 1040, y: FLOOR, w: 280, h: 90 }, { x: 1500, y: FLOOR, w: width - 1460, h: 90 });
    solids.push(plat(400, 370, 140), plat(840, 320, 160), plat(1320, 300, 150));
    foes.push(foe("elite", 220, 40, 320), foe("walkin", 640, 560, 840), foe("cone", 1160, 0, 0), foe("walkin", 1600, 1520, 1780));
    drops.push(loot("scroll", 430, 342, { power: "release" }), loot("key", 900, 292), loot("key", 1360, 272), loot("peso", 1680));
  } else if (i === 4) {
    solids.push(plat(280, 400, 160), plat(560, 340, 200), plat(900, 400, 180), plat(1220, 320, 200));
    foes.push(
      foe("walkin", 200, 40, 500), foe("walkin", 480, 300, 760), foe("walkin", 860, 700, 1100),
      foe("elite", 1280, 1100, 1500), foe("cone", 700, 0, 0),
    );
    drops.push(loot("key", 300, 372), loot("scroll", 620, 312, { power: "musicbox" }), loot("weapon", 1280, 292, { weapon: "keys" }), loot("flask", 1480), loot("peso", 980));
  } else if (i === 5) {
    solids.push(plat(220, 420, 140), plat(420, 350, 140), plat(640, 280, 160), plat(900, 340, 180), plat(1180, 270, 160), plat(1420, 360, 180));
    foes.push(foe("walkin", 360, 200, 560), foe("elite", 700, 500, 900), foe("walkin", 1100, 900, 1300), foe("walkin", 1500, 1400, 1700));
    drops.push(loot("key", 240, 392), loot("key", 680, 252), loot("scroll", 1220, 242, { power: "nationwide" }), loot("peso", 1460, 332));
  } else if (i === 6) {
    solids[0] = { x: -40, y: FLOOR, w: 460, h: 90 };
    solids.push({ x: 620, y: FLOOR, w: 360, h: 90 }, { x: 1160, y: FLOOR, w: width - 1120, h: 90 });
    solids.push(plat(480, 380, 140), plat(960, 330, 180), plat(1400, 300, 160));
    foes.push(foe("elite", 200, 40, 400), foe("elite", 780, 640, 960), foe("walkin", 1280, 1180, 1500), foe("cone", 1480, 0, 0));
    drops.push(loot("flask", 120), loot("key", 520, 352), loot("scroll", 1020, 302, { power: "elite" }), loot("weapon", 1460, 272, { weapon: "star" }));
  } else {
    solids.push(plat(300, 390, 180), plat(620, 320, 200), plat(980, 360, 180), plat(1320, 280, 220));
    foes.push(
      foe("walkin", 180, 40, 400), foe("elite", 500, 300, 780), foe("elite", 900, 800, 1160),
      foe("walkin", 1280, 1180, 1500), foe("elite", 1600, 1500, 1850),
    );
    drops.push(
      loot("key", 320, 362), loot("flask", 680, 292), loot("scroll", 1040, 332, { power: "replevin" }),
      loot("peso", 1400, 252), loot("key", 1720),
    );
  }

  for (const f of foes) {
    if (f.kind === "cone") {
      f.y = FLOOR - f.h;
      f.vx = 0;
    }
  }
  return { biome, name, width, solids, foes, loot: drops, doorX };
}

export async function createCells(
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
  const [walkin, cone, sedan, suv, keyImg, pesoImg, starImg, goalImg, showroom, edsa, timog, clark] = await Promise.all([
    loadImage("/sprites/walkin.png", 2000),
    loadImage("/sprites/cone.png", 1800),
    loadImage("/sprites/sedan.png", 2000),
    loadImage("/sprites/suv.png", 2000),
    loadImage("/sprites/key.png", 1800),
    loadImage("/sprites/peso.png", 1800),
    loadImage("/sprites/star.png", 1800),
    loadImage("/sprites/goal.png", 1800),
    loadImage("/maps/showroom.jpg", 2500),
    loadImage("/maps/edsa.jpg", 2500),
    loadImage("/maps/timog.jpg", 2500),
    loadImage("/maps/clark.jpg", 2500),
  ]);
  const bgs: Record<Biome, HTMLImageElement | null> = { showroom, edsa, timog, clark };

  let vw = 960;
  let vh = 540;
  let dpr = 1;
  let screen: Screen = "play";
  let menuReturn: Screen = "play";
  let rooms = makeRooms();
  let roomI = 0;
  let room = rooms[0];
  let px = 80;
  let py = FLOOR - PH;
  let vx = 0;
  let vy = 0;
  let facing = 1;
  let grounded = true;
  let coyote = 0;
  let buffer = 0;
  let air = 1;
  let invuln = 1.1;
  let clock = 0;
  let score = 0;
  let keys = 0;
  let hp = 3;
  let maxHp = 3;
  let weapon: WeaponId = "clip";
  let slashCd = 0;
  let slashT = 0;
  let running = true;
  let acc = 0;
  let last = performance.now();
  let raf = 0;
  let cam = 0;
  let popupT = 2.4;
  let popupTitle = "REPLEVIN CELLS";
  let popupCopy = "Slash the walk-ins. Loot the lot. Don't die — the run is the repo.";
  let popupKind: "line" | "car" | "rank" | PowerKind = "line";
  let popupJed = true;
  let record = false;
  let bannerT = 1.8;
  let banner = "CELL 1 · MALABON FLOOR";
  let hudAcc = 0;
  let grazed = false;
  let sparks: Spark[] = [];
  let buffSpeed = 0;
  let buffStar = 0;
  let buffPhase = 0;
  let buffJump = 0;
  let buffMagnet = 0;
  let jumpCut = false;
  const lo = () => resolveLoadout(save.equipped);

  function hud() {
    const unit = lo();
    return blankHud(save, {
      screen,
      levelName: "Replevin Cells",
      kicker: `${unit.year} ${unit.name} · ${WEAPONS[weapon].name} · ${room.name}`,
      clock,
      pesos: score,
      progress: (roomI + Math.min(1, px / Math.max(1, room.width - 80))) / rooms.length,
      record,
      popup: popupT > 0
        ? { id: Math.floor(clock * 10) + popupTitle.length, title: popupTitle, copy: popupCopy, kind: popupKind, jed: popupJed }
        : null,
      mode: "cells",
      score,
      wave: roomI + 1,
      padAction: "Jump",
      padExtra: "Slash",
      coins: keys,
      totalCoins: 8,
      missionHint: `${unit.tag} · HP ${hp}/${maxHp} · ${WEAPONS[weapon].name} · BEST ${save.cellsBest}`,
      banner: bannerT > 0 ? banner : "",
      buffs: [
        ...(buffStar > 0 ? [{ kind: "release" as const, label: "STAR", remain: buffStar }] : []),
        ...(buffSpeed > 0 ? [{ kind: "approved" as const, label: "SPEED", remain: buffSpeed }] : []),
        ...(buffPhase > 0 ? [{ kind: "cmap" as const, label: "PHASE", remain: buffPhase }] : []),
        ...(buffJump > 0 ? [{ kind: "elite" as const, label: "SUPER", remain: buffJump }] : []),
      ],
    });
  }
  function push() {
    onHud(hud());
  }
  function pop(kind: typeof popupKind, title: string, copy: string, jed: boolean) {
    popupKind = kind;
    popupTitle = title;
    popupCopy = copy;
    popupJed = jed;
    popupT = 2.1;
  }
  function burst(x: number, y: number, n: number, color: string) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 160;
      sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.35 + Math.random() * 0.2, color });
    }
    if (sparks.length > 80) sparks.splice(0, sparks.length - 80);
  }
  function reset() {
    const unit = lo();
    rooms = makeRooms();
    roomI = 0;
    room = rooms[0];
    px = 80;
    py = FLOOR - PH;
    vx = 0;
    vy = 0;
    facing = 1;
    grounded = true;
    coyote = 0;
    buffer = 0;
    air = unit.survAir;
    maxHp = 3 + unit.survArmor + unit.armor;
    hp = maxHp;
    weapon = "clip";
    slashCd = 0;
    slashT = 0;
    invuln = 1.1;
    clock = 0;
    score = 0;
    keys = 0;
    grazed = unit.firstHazFree;
    sparks = [];
    buffSpeed = buffStar = buffPhase = buffJump = buffMagnet = 0;
    jumpCut = false;
    screen = "play";
    banner = "CELL 1 · MALABON FLOOR";
    bannerT = 1.8;
    pop("line", "REPLEVIN CELLS", `${unit.year} ${unit.name}. Clipboard out. Eight cells. Permadeath.`, true);
    sfx.unlock();
    push();
  }
  function enterRoom(i: number) {
    roomI = i;
    room = rooms[i];
    px = 64;
    py = FLOOR - PH;
    vx = 0;
    vy = 0;
    grounded = true;
    air = lo().survAir;
    invuln = Math.max(invuln, 0.6);
    cam = 0;
    banner = `CELL ${i + 1} · ${room.name.toUpperCase()}`;
    bannerT = 1.6;
    pop("line", room.name, i === 7 ? "Hangar close. Last door. Slash everything." : "Loot. Slash. Hit the door.", true);
  }
  function finish(won: boolean) {
    if (screen === "win") return;
    screen = "win";
    const bonus = won ? 800 + hp * 200 + roomI * 200 : roomI * 250;
    score += bonus;
    if (score > save.cellsBest) {
      save.cellsBest = score;
      record = true;
    }
    save.careerPesos += Math.round(score * 4);
    save.careerKeys += Math.floor(keys / 2);
    awardMissions(save);
    writeCareer(save);
    const fresh = freshUnlocks(save);
    for (const c of fresh) if (!save.cars.includes(c.id)) save.cars.push(c.id);
    if (fresh.length) writeCareer(save);
    pop(
      fresh.length ? "car" : "line",
      won ? (record ? "RUN CLOSED" : "SAME-DAY REPO") : "REPLEVIN FAILED",
      won
        ? `${score} pts · ${keys} keys · cell ${roomI + 1}/8.${record ? " New best." : ""}`
        : `${score} pts. Cell ${roomI + 1}. The walk-ins still come.`,
      true,
    );
    if (won) sfx.win();
    else sfx.death();
    input.clearTouch();
    push();
  }
  function hurt() {
    if (invuln > 0 || buffPhase > 0 || screen !== "play") return;
    if (grazed) {
      grazed = false;
      invuln = 1.1;
      sfx.power();
      pop("car", "CLEAN", "First tag. Still on the lot.", true);
      return;
    }
    hp -= 1;
    invuln = 1.15;
    burst(px + PW / 2, py + PH / 2, 10, "#e10600");
    if (hp <= 0) {
      finish(false);
      return;
    }
    sfx.death();
    pop("line", "HIT", `${hp} HP left. Don't drop the clipboard.`, true);
  }
  function slashBox(): Rect {
    const w = WEAPONS[weapon].range;
    return {
      x: facing > 0 ? px + PW - 4 : px - w,
      y: py + 8,
      w,
      h: 28,
    };
  }
  function grab(l: Loot) {
    if (l.got) return;
    l.got = true;
    if (l.kind === "key") {
      keys += 1;
      score += 100;
      sfx.coin();
    } else if (l.kind === "peso") {
      score += 180;
      sfx.peso();
    } else if (l.kind === "flask") {
      hp = Math.min(maxHp, hp + 1);
      sfx.power();
      pop("warranty", "FLASK", "One heart back. Keep closing.", false);
    } else if (l.kind === "scroll" && l.power) {
      const meta = POWER_META[l.power];
      if (l.power === "release") buffStar = 6.5;
      else if (l.power === "approved") buffSpeed = 6.5;
      else if (l.power === "cmap") buffPhase = 6.5;
      else if (l.power === "nationwide") buffMagnet = 8;
      else if (l.power === "elite") buffJump = 7;
      else if (l.power === "musicbox") buffMagnet = 8;
      else if (l.power === "replevin") buffStar = 4;
      else buffSpeed = 5;
      score += 220;
      sfx.power();
      pop(l.power, meta.title, meta.copy, false);
    } else if (l.kind === "weapon" && l.weapon) {
      weapon = l.weapon;
      sfx.unlockChime();
      pop("car", WEAPONS[weapon].name, "New steel. Same quota.", true);
    }
    burst(l.x, l.y, 8, "#d4a017");
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
    slashCd = Math.max(0, slashCd - dt);
    slashT = Math.max(0, slashT - dt);
    buffSpeed = Math.max(0, buffSpeed - dt);
    buffStar = Math.max(0, buffStar - dt);
    buffPhase = Math.max(0, buffPhase - dt);
    buffJump = Math.max(0, buffJump - dt);
    buffMagnet = Math.max(0, buffMagnet - dt);
    if (buffStar > 0) invuln = Math.max(invuln, 0.05);
    hudAcc += dt;
    if (hudAcc >= 0.12) {
      hudAcc = 0;
      push();
    }
    for (const s of sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 520 * dt;
      s.life -= dt;
    }
    sparks = sparks.filter((s) => s.life > 0);

    const speedMul = unit.survSpeed * (buffSpeed > 0 ? 1.28 : 1);
    const cap = 320 * speedMul;
    if (input.moveX !== 0) {
      vx += input.moveX * 3200 * speedMul * dt;
      facing = input.moveX < 0 ? -1 : 1;
    } else if (grounded) vx *= Math.max(0, 1 - 14 * dt);
    else vx *= Math.max(0, 1 - 1.6 * dt);
    vx = Math.max(-cap, Math.min(cap, vx));

    if (input.jumpPressed) buffer = 0.14;
    buffer = Math.max(0, buffer - dt);
    coyote = grounded ? 0.12 : Math.max(0, coyote - dt);
    const canJump = grounded || coyote > 0 || air > 0;
    if (buffer > 0 && canJump) {
      const fromGround = grounded || coyote > 0;
      if (!fromGround && unit.blinkDash) {
        vx = facing * 640;
        vy = Math.min(vy, -220);
        invuln = Math.max(invuln, 0.2);
        air -= 1;
      } else {
        vy = (fromGround ? -860 : -720) * unit.survJump * (buffJump > 0 ? 1.12 : 1);
        if (!fromGround) air -= 1;
      }
      grounded = false;
      coyote = 0;
      buffer = 0;
      jumpCut = false;
      sfx.jump();
    }
    if (!input.jumpHeld && vy < -80 && !jumpCut) {
      vy *= 0.55;
      jumpCut = true;
    }
    vy += (vy < 0 ? 1780 : 2680) * unit.floatMul * dt;
    if (vy > 980) vy = 980;

    px += vx * dt;
    let box: Rect = { x: px, y: py, w: PW, h: PH };
    for (const s of room.solids) {
      if (s.oneWay) continue;
      if (!aabb(box, s)) continue;
      if (vx > 0) px = s.x - PW;
      else if (vx < 0) px = s.x + s.w;
      vx = 0;
      box.x = px;
    }
    if (px < 8) { px = 8; vx = 0; }
    if (px > room.width - 20) px = room.width - 20;

    const prevBottom = py + PH;
    py += vy * dt;
    box = { x: px, y: py, w: PW, h: PH };
    grounded = false;
    for (const s of room.solids) {
      if (!aabb(box, s)) continue;
      if (s.oneWay) {
        if (vy < 0 || prevBottom > s.y + 10) continue;
        py = s.y - PH;
        vy = 0;
        grounded = true;
        air = unit.survAir;
        jumpCut = false;
        continue;
      }
      if (vy >= 0 && prevBottom <= s.y + 12) {
        py = s.y - PH;
        vy = 0;
        grounded = true;
        air = unit.survAir;
        jumpCut = false;
      } else if (vy < 0) {
        py = s.y + s.h;
        vy = 0;
      }
      box.y = py;
    }
    if (py > FLOOR + 80) {
      hurt();
      px = 64;
      py = FLOOR - PH;
      vx = 0;
      vy = 0;
      grounded = true;
    }

    if (input.slashPressed && slashCd <= 0) {
      slashCd = WEAPONS[weapon].cool;
      slashT = 0.12;
      sfx.slash();
      if (weapon === "star") invuln = Math.max(invuln, 0.16);
    }
    if (slashT > 0) {
      const sb = slashBox();
      for (const f of room.foes) {
        if (f.hp <= 0 || f.hurt > 0) continue;
        if (!aabb(sb, { x: f.x, y: f.y, w: f.w, h: f.h })) continue;
        f.hp -= WEAPONS[weapon].dmg;
        f.hurt = 0.18;
        f.vx = facing * WEAPONS[weapon].knock;
        burst(f.x + f.w / 2, f.y + f.h / 2, 8, "#f4f4f5");
        sfx.stomp();
        if (f.hp <= 0) {
          f.hp = 0;
          score += f.kind === "elite" ? 220 : f.kind === "cone" ? 60 : 110;
        }
      }
    }

    const magnet = (unit.magnet || 0) + (buffMagnet > 0 ? 90 : 0);
    for (const l of room.loot) {
      if (l.got) continue;
      const dx = px + PW / 2 - l.x;
      const dy = py + PH / 2 - l.y;
      const d = Math.hypot(dx, dy);
      if (magnet > 0 && d < magnet + 40) {
        l.x += dx * Math.min(1, 8 * dt);
        l.y += dy * Math.min(1, 8 * dt);
      }
      if (d < 42) grab(l);
    }

    const pHit: Rect = {
      x: px + 4,
      y: py + 6,
      w: unit.survHitW,
      h: unit.survHitH,
    };
    for (const f of room.foes) {
      if (f.hp <= 0) continue;
      f.hurt = Math.max(0, f.hurt - dt);
      if (f.kind !== "cone") {
        f.x += f.vx * dt;
        if (f.x < f.min) { f.x = f.min; f.vx = Math.abs(f.vx); }
        if (f.x > f.maxX) { f.x = f.maxX; f.vx = -Math.abs(f.vx); }
        const foot: Rect = { x: f.x, y: f.y + f.h - 4, w: f.w, h: 8 };
        let onFloor = false;
        for (const s of room.solids) {
          if (s.oneWay) continue;
          if (aabb(foot, s)) { onFloor = true; break; }
        }
        if (!onFloor) f.vx *= -1;
      }
      if (invuln > 0 || buffPhase > 0) continue;
      if (!aabb(pHit, { x: f.x, y: f.y, w: f.w, h: f.h })) continue;
      if (vy > 90 && py + PH < f.y + 18) {
        f.hp -= 1;
        f.hurt = 0.2;
        vy = -520;
        sfx.stomp();
        if (f.hp <= 0) score += 80;
        continue;
      }
      if (unit.survRam && Math.abs(vx) > 200) {
        f.hp = 0;
        score += 90;
        sfx.stomp();
        continue;
      }
      hurt();
      if (screen !== "play") return;
    }

    if (px + PW > room.doorX && py + PH >= FLOOR - 8) {
      if (roomI >= rooms.length - 1) finish(true);
      else {
        score += 300 + room.foes.filter((f) => f.hp <= 0).length * 40;
        enterRoom(roomI + 1);
      }
    }
  }
  function present() {
    const unit = lo();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const look = facing * 70;
    cam += (px - vw * 0.38 + look - cam) * 0.12;
    cam = Math.max(0, Math.min(Math.max(0, room.width - vw), cam));
    ctx.clearRect(0, 0, vw, vh);
    ctx.fillStyle = "#14141a";
    ctx.fillRect(0, 0, vw, vh);
    drawSkyline(ctx, bgs[room.biome], vw, vh, cam * 0.14, FLOOR, 0.58);
    ctx.save();
    ctx.translate(-Math.round(cam), 0);
    for (const s of room.solids) {
      if (s.y >= FLOOR) {
        ctx.fillStyle = "#2c2e38";
        ctx.fillRect(s.x, s.y, s.w, s.h + 40);
        ctx.fillStyle = "#e10600";
        ctx.fillRect(s.x, s.y, s.w, 4);
        ctx.fillStyle = "#d8dae4";
        ctx.fillRect(s.x, s.y + 4, s.w, 3);
      } else {
        ctx.fillStyle = s.oneWay ? "rgba(212,160,23,0.85)" : "#3a3d48";
        ctx.fillRect(s.x, s.y, s.w, s.h);
      }
    }
    if (!drawImg(ctx, goalImg, room.doorX - 8, FLOOR - 78, 36, 78)) {
      ctx.fillStyle = "#e10600";
      ctx.fillRect(room.doorX, FLOOR - 72, 10, 72);
      ctx.fillStyle = "#f4f4f5";
      ctx.fillRect(room.doorX + 10, FLOOR - 72, 28, 18);
    }
    for (const l of room.loot) {
      if (l.got) continue;
      const bob = Math.sin(clock * 6 + l.x * 0.02) * 4;
      if (l.kind === "key") {
        if (!drawImg(ctx, keyImg, l.x - 10, l.y - 10 + bob, 20, 20)) {
          ctx.fillStyle = "#d4a017";
          ctx.fillRect(l.x - 6, l.y - 6 + bob, 12, 12);
        }
      } else if (l.kind === "peso") {
        if (!drawImg(ctx, pesoImg, l.x - 10, l.y - 10 + bob, 20, 20)) {
          ctx.fillStyle = "#d4a017";
          ctx.beginPath();
          ctx.arc(l.x, l.y + bob, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (l.kind === "flask") {
        ctx.fillStyle = "#4ade80";
        ctx.beginPath();
        ctx.moveTo(l.x - 7, l.y - 4 + bob);
        ctx.lineTo(l.x + 7, l.y - 4 + bob);
        ctx.lineTo(l.x + 5, l.y + 10 + bob);
        ctx.lineTo(l.x - 5, l.y + 10 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#f4f4f5";
        ctx.fillRect(l.x - 4, l.y - 10 + bob, 8, 6);
      } else if (l.kind === "weapon") {
        if (!drawImg(ctx, starImg, l.x - 12, l.y - 12 + bob, 24, 24)) {
          ctx.fillStyle = "#f5d76e";
          ctx.fillRect(l.x - 8, l.y - 8 + bob, 16, 16);
        }
      } else {
        ctx.fillStyle = "#60a5fa";
        ctx.fillRect(l.x - 9, l.y - 12 + bob, 18, 22);
        ctx.fillStyle = "#f4f4f5";
        ctx.fillRect(l.x - 6, l.y - 8 + bob, 12, 3);
      }
    }
    for (const f of room.foes) {
      if (f.hp <= 0) continue;
      const flash = f.hurt > 0 && Math.floor(clock * 24) % 2 === 0;
      if (flash) ctx.globalAlpha = 0.45;
      if (f.kind === "cone") {
        if (!drawImg(ctx, cone, f.x - 2, f.y - 4, 26, 34)) {
          ctx.fillStyle = "#c45c12";
          ctx.fillRect(f.x, f.y, f.w, f.h);
        }
      } else {
        const img = walkin;
        if (!drawImg(ctx, img, f.x - 6, f.y - 4, f.w + 12, f.h + 8, f.vx < 0)) {
          ctx.fillStyle = f.kind === "elite" ? "#e10600" : "#c45c12";
          ctx.fillRect(f.x, f.y, f.w, f.h);
        }
        if (f.kind === "elite") {
          ctx.fillStyle = "#d4a017";
          ctx.fillRect(f.x, f.y - 8, f.w * (f.hp / f.max), 3);
        }
      }
      ctx.globalAlpha = 1;
    }
    const ghost = invuln > 0 && Math.floor(clock * 16) % 2 === 0;
    const carImg = unit.kind === "suv" ? suv : sedan;
    const sz = unitSideSize(unit);
    const carX = px + 13 - sz.w * 0.45;
    const carY = py + PH - sz.h;
    drawUnitSide(ctx, carImg, carX, carY, unit, facing, { ghost });
    if (!ghost) drawJedLite(ctx, px + 13, carY + 10, facing, clock, 1, save.equippedOutfit, { pose: grounded ? (Math.abs(vx) > 40 ? "run" : "idle") : "air" });
    if (slashT > 0) {
      const sb = slashBox();
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = weapon === "star" ? "#f5d76e" : "#e10600";
      ctx.beginPath();
      ctx.ellipse(sb.x + sb.w / 2, sb.y + sb.h / 2, sb.w / 2, 10, facing * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (const s of sparks) {
      ctx.globalAlpha = Math.max(0, s.life * 3);
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, 3, 3);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.fillStyle = "#f4f4f5";
    ctx.font = "700 22px 'Barlow Condensed', sans-serif";
    ctx.fillText(`CELL ${roomI + 1}/8`, 16, 32);
    ctx.fillStyle = "#d4a017";
    ctx.font = "600 13px 'DM Sans', sans-serif";
    ctx.fillText(`${WEAPONS[weapon].name} · ${score}`, 16, 52);
    for (let i = 0; i < maxHp; i++) {
      ctx.fillStyle = i < hp ? "#e10600" : "#2a2a32";
      ctx.beginPath();
      ctx.arc(vw - 18 - i * 18, 24, 7, 0, Math.PI * 2);
      ctx.fill();
    }
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
      coins: keys,
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
