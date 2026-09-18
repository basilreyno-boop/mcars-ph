import { Input, applyTouch } from "./input";
import { Sfx } from "./audio";
import { LEVELS } from "./levels";
import {
  POWER_META,
  formatPesos,
  type HudState,
  type LevelDef,
  type PowerKind,
  type PopupKind,
  type Rect,
  type Screen,
  type GameHandle,
  type TrafficKind,
} from "./types";
import { drawImg, drawSheet, loadAssets, bgFor, emptyAssets, ensureBg, prefetchMaps, type GameAssets } from "./assets";
import { drawSkyline, fitView } from "./view";
import {
  freshUnlocks,
  loadCareer,
  rankFor,
  writeCareer,
  type CareerSave,
} from "./garage";
import { resolveLoadout } from "./loadout";
import { freshOutfitUnlocks } from "./outfits";
import { drawJedLite } from "./jedLite";
import { COMBO_WINDOW, flipAt, flipProfit, type FlipDeal } from "./flip";
import { tintSprite } from "./drawCar";
import { listMissions, missionHint, missionMet, MISSIONS, type MissionSnap } from "./missions";
import {
  bootEnemies,
  drawBossJohn,
  drawFoe,
  drawGuard,
  foeTag,
  GUARD_COUNT,
  guardOrbit,
  seedEnemies,
  type LotEnemy,
} from "./units";

export type { GameHandle } from "./types";

type Particle = {
  x: number; y: number; vx: number; vy: number; life: number; max: number;
  size: number; color: string; g: number; kind: "box" | "dust" | "confetti" | "sparkle";
  rot: number; vr: number;
};
type Floater = { x: number; y: number; text: string; life: number };
type Flyer = { x: number; y: number; life: number; max: number; hue: number; suv: boolean };
type Ghost = { x: number; y: number; facing: number; squash: number; spin: number; life: number; max: number };
type Ring = { x: number; y: number; life: number; max: number; r: number; grow: number; color: string; w: number };
type Mover = Rect & { ox: number; oy: number; axis: "x" | "y"; amp: number; speed: number; phase: number; px: number; py: number };
type TrafficCar = Rect & { vx: number; kind: TrafficKind; min: number; max: number; ride: boolean; px: number };
type Player = {
  x: number; y: number; w: number; h: number; vx: number; vy: number; facing: number; grounded: boolean;
  coyote: number; buffer: number; airJumps: number; cut: boolean; holdT: number;
  invuln: number; anim: number; squash: number; squashT: number; lean: number;
  riding: number; dropT: number; footUp: boolean; spin: number; blink: number; grow: number;
};

const STEP = 1 / 60;
const PW = 26;
const PH = 40;
const MAX_RUN = 318;
const ACCEL_G = 3400;
const ACCEL_A = 2200;
const FRICTION = 3400;
const AIR_DRAG = 480;
const GRAV_UP = 1780;
const GRAV_DOWN = 2680;
const GRAV_APEX = 820;
const JUMP_V = -860;
const DJUMP_V = -720;
const MAX_FALL = 980;
const COYOTE = .12;
const BUFFER = .16;
const APEX = 56;
const MIN_HOLD = .08;
const KILL_LOCK = .55;
const HUD_HZ = .12;
type Buffs = {
	discount: number; release: number; tank: number; approved: number; oneday: number;
	tradein: number; rentown: number; cmap: number; quota: number; pasalo: number;
	nationwide: number; replevin: number; musicbox: number; elite: number;
	john: number; fidelity: number;
};
function emptyBuff(): Buffs {
	return {
		discount: 0, release: 0, tank: 0, approved: 0, oneday: 0, tradein: 0,
		rentown: 0, cmap: 0, quota: 0, pasalo: 0, nationwide: 0, replevin: 0,
		musicbox: 0, elite: 0, john: 0, fidelity: 0,
	};
}
function aabb(a: Rect, b: Rect) {
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function approach(v: number, t: number, d: number) {
	if (v < t) return Math.min(v + d, t);
	return Math.max(v - d, t);
}
function loadSave(): CareerSave {
	return loadCareer();
}
function writeSave(s: CareerSave) {
	writeCareer(s);
}
export async function createGame(
  canvas: HTMLCanvasElement,
  onHud: (h: HudState) => void,
  onProgress?: (p: number) => void,
): Promise<GameHandle> {

	const rawCtx = canvas.getContext("2d");
	if (!rawCtx) throw new Error("Canvas 2D unavailable");
	const ctx: CanvasRenderingContext2D = rawCtx;
	const assets: GameAssets = emptyAssets();
	void loadAssets((p) => {
		if (running) onProgress?.(p);
	}).then((loaded) => {
		if (!running) return;
		Object.assign(assets, loaded);
		onProgress?.(1);
	});
	const input = new Input();
	const sfx = new Sfx();
	input.attach();
	canvas.tabIndex = 0;
	canvas.setAttribute("aria-label", "MCARS PH game");
	const save = loadSave();
	let screen: Screen = "title";
	let levelIndex = 0;
	let level: LevelDef = LEVELS[0];
	let player: Player = makePlayer(level.spawn.x, level.spawn.y);
	let spawn = {
		x: level.spawn.x,
		y: level.spawn.y
	};
	let coinsGot = new Set<number>();
	let pesosGot = new Set<number>();
	let smashed = new Set<number>();
	let cpOn = new Set<number>();
	let powersGot = new Set<number>();
	let buff = emptyBuff();
	let warranty = false;
	let carArmor = 0;
	let hazFree = false;
	let grabbedStar = false;
	let grabbedGrow = false;
	let grabbedNation = false;
	let grabbedReplevin = false;
	let grabbedMusic = false;
	let grabbedElite = false;
	let menuReturn: Screen = "title";
	let pesos = 0;
	let popupTitle = "";
	let popupCopy = "";
	let popupKind: PopupKind = "line";
	let popupId = 0;
	let popupT = 0;
	let lastPopAt = -99;
	let saveDirty = false;
	let saveAcc = 0;
	let lite = false;
	let movers: Mover[] = [];
	let traffic: TrafficCar[] = [];
	let ridingTraffic = -1;
	let particles: Particle[] = [];
	let floaters: Floater[] = [];
	let flyers: Flyer[] = [];
	let ghosts: Ghost[] = [];
	let rings: Ring[] = [];
	let foes: LotEnemy[] = [];
	let johnX = 0;
	let johnY = 0;
	let johnFace = 1;
	let grabbedJohn = false;
	let grabbedFidelity = false;
	let motes: { x: number; y: number; vx: number; vy: number; a: number }[] = [];
	let cam = {
		x: 0,
		y: 0
	};
	let trauma = 0;
	let camKick = 0;
	let flash = 0;
	let deaths = 0;
	let banner = "";
	let bannerT = 0;
	let combo = 0;
	let comboT = 0;
	let comboMax = 0;
	let dealName = "";
	let dealBuy = 0;
	let dealSell = 0;
	let dealProfit = 0;
	let time = 0;
	let clock = 0;
	let hudAcc = 0;
	let ghostT = 0;
	let record = false;
	let acc = 0;
	let last = performance.now();
	let raf = 0;
	let running = true;
	let dpr = 1;
	let vw = 960;
	let vh = 540;
	let killLock = 0;
	let hitstop = 0;
	let reduced =
		typeof window !== "undefined" &&
		!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
	function loadout() {
		return resolveLoadout(save.equipped);
	}
	function missionSnap(won: boolean): MissionSnap {
		return {
			levelIndex,
			keys: coinsGot.size,
			totalKeys: level.coins.length,
			coins: pesosGot.size,
			totalCoins: level.pesos.length,
			deaths,
			clock,
			stomps: smashed.size,
			powers: powersGot.size,
			won,
			grabbedStar,
			grabbedGrow,
			grabbedNation,
			grabbedReplevin,
			grabbedMusic,
			grabbedElite,
			grabbedJohn,
			grabbedFidelity,
			comboMax,
			save,
		};
	}
	function tryMissions(won: boolean) {
		const snap = missionSnap(won);
		let got = 0;
		for (const m of MISSIONS) {
			if (save.missions.includes(m.id)) continue;
			if (!missionMet(m, snap)) continue;
			save.missions.push(m.id);
			save.careerPesos += m.rewardPesos;
			if (m.rewardKeys) save.careerKeys += m.rewardKeys;
			got += 1;
			if (got === 1) {
				firePopup("mission", m.title, `${m.copy} · ${m.rewardPesos >= 1000 ? "₱" + Math.round(m.rewardPesos / 1000) + "K" : "₱" + m.rewardPesos}`, true);
				sfx.unlockChime();
			}
		}
		if (got) {
			flushSave(true);
			grantCars();
			grantLooks();
		}
		return got;
	}
	function markSave() {
		saveDirty = true;
	}
	function flushSave(force = false) {
		if (!saveDirty && !force) return;
		writeSave(save);
		saveDirty = false;
		saveAcc = 0;
	}
	function hud(): HudState {
		const buffs: HudState["buffs"] = [];
		if (buff.discount > 0) buffs.push({ kind: "discount", label: "MAGNET", remain: buff.discount });
		if (buff.release > 0) buffs.push({ kind: "release", label: "STAR", remain: buff.release });
		if (buff.tank > 0) buffs.push({ kind: "tank", label: "FULL TANK", remain: buff.tank });
		if (buff.approved > 0) buffs.push({ kind: "approved", label: "SPEED", remain: buff.approved });
		if (buff.oneday > 0) buffs.push({ kind: "oneday", label: "1-DAY", remain: buff.oneday });
		if (buff.tradein > 0) buffs.push({ kind: "tradein", label: "STOMP", remain: buff.tradein });
		if (buff.rentown > 0) buffs.push({ kind: "rentown", label: "FLOAT", remain: buff.rentown });
		if (buff.cmap > 0) buffs.push({ kind: "cmap", label: "PHASE", remain: buff.cmap });
		if (buff.quota > 0) buffs.push({ kind: "quota", label: "x2", remain: buff.quota });
		if (buff.pasalo > 0) buffs.push({ kind: "pasalo", label: "PASALO", remain: buff.pasalo });
		if (buff.nationwide > 0) buffs.push({ kind: "nationwide", label: "BLINK", remain: buff.nationwide });
		if (buff.replevin > 0) buffs.push({ kind: "replevin", label: "BOUNCE", remain: buff.replevin });
		if (buff.musicbox > 0) buffs.push({ kind: "musicbox", label: "JAM", remain: buff.musicbox });
		if (buff.elite > 0) buffs.push({ kind: "elite", label: "SUPER", remain: buff.elite });
		if (buff.john > 0) buffs.push({ kind: "john", label: "JOHN", remain: buff.john });
		if (buff.fidelity > 0) buffs.push({ kind: "fidelity", label: "SECURE", remain: buff.fidelity });
		if (player.grow > 0) buffs.push({ kind: "upgrade", label: "GROW", remain: 99 });
		if (warranty) buffs.push({ kind: "warranty", label: "WARRANTY", remain: 99 });
		else if (carArmor > 0) buffs.push({ kind: "warranty", label: carArmor > 1 ? `ARMOR x${carArmor}` : "ARMOR", remain: 99 });
		const snap = missionSnap(false);
		const missions = listMissions(snap);
		const doneN = save.missions.length;
		return {
			screen,
			levelIndex,
			levelName: level.name,
			kicker: level.kicker,
			coins: coinsGot.size,
			totalCoins: level.coins.length,
			pesoCoins: pesosGot.size,
			totalPesoCoins: level.pesos.length,
			deaths,
			hasCheckpoint: cpOn.size > 0,
			unlocked: save.unlocked,
			best: save.best,
			bestTime: save.bestTime,
			banner,
			progress: Math.max(0, Math.min(1, player.x / Math.max(1, level.width - 80))),
			clock,
			record,
			pesos,
			warranty,
			grow: player.grow > 0,
			buffs,
			popup: popupT > 0
				? {
					id: popupId,
					title: popupTitle,
					copy: popupCopy,
					kind: popupKind,
					jed:
						popupKind === "line" ||
						popupKind === "car" ||
						popupKind === "rank" ||
						popupKind === "keys" ||
						popupKind === "mission",
				}
				: null,
			cars: save.cars,
			equipped: save.equipped,
			rank: rankFor(save),
			careerKeys: save.careerKeys,
			careerPesos: save.careerPesos,
			missions,
			missionsDone: doneN,
			missionsTotal: MISSIONS.length,
			missionHint: missionHint(snap),
			stompLot: smashed.size,
			mode: "lots",
			stars: save.stars,
			rushBest: save.rushBest,
			survivalBest: save.survivalBest,
			invadersBest: save.invadersBest,
			dealBest: save.dealBest,
			cellsBest: save.cellsBest,
			score: coinsGot.size + pesosGot.size,
			wave: 0,
			padAction: "Jump",
			padExtra: null,
			outfits: save.outfits,
			equippedOutfit: save.equippedOutfit,
			combo,
			comboMax,
			comboHeat: comboT > 0 ? comboT / COMBO_WINDOW : 0,
			dealName,
			dealBuy,
			dealSell,
			dealProfit,
		};
	}
	function pushHud() {
		onHud(hud());
	}
	function makePlayer(x: number, y: number): Player {
		return {
			x,
			y,
			w: PW,
			h: PH,
			vx: 0,
			vy: 0,
			facing: 1,
			grounded: false,
			coyote: 0,
			buffer: 0,
			airJumps: 1,
			cut: false,
			holdT: 0,
			invuln: 0,
			anim: 0,
			squash: 0,
			squashT: 0,
			lean: 0,
			riding: -1,
			dropT: 0,
			footUp: false,
			spin: 0,
			blink: 2.2,
			grow: 0,
		};
	}
	function bootMovers() {
		movers = level.movers.map((m: (typeof LEVELS)[number]["movers"][number]) => ({
			x: m.x,
			y: m.y,
			w: m.w,
			h: m.h,
			ox: m.x,
			oy: m.y,
			axis: m.axis,
			amp: m.amp,
			speed: m.speed,
			phase: m.phase ?? 0,
			px: m.x,
			py: m.y
		}));
	}
	function sizeFor(kind: TrafficKind) {
		if (kind === "jeepney") return { w: 156, h: 56 };
		if (kind === "suv") return { w: 124, h: 50 };
		return { w: 120, h: 44 };
	}
	function bootTraffic() {
		traffic = (level.traffic ?? []).map((t) => {
			const sz = sizeFor(t.kind);
			return {
				x: t.x,
				y: 500 - sz.h + 4,
				w: sz.w,
				h: sz.h,
				vx: t.vx,
				kind: t.kind,
				min: t.min,
				max: t.max,
				ride: t.ride !== false,
				px: t.x,
			};
		});
		ridingTraffic = -1;
	}
	function startLevel(i: number) {
		levelIndex = Math.max(0, Math.min(LEVELS.length - 1, i));
		level = LEVELS[levelIndex];
		spawn = {
			x: level.spawn.x,
			y: level.spawn.y
		};
		player = makePlayer(spawn.x, spawn.y);
		const lo = loadout();
		player.invuln = Math.max(0.55, lo.spawnInvuln);
		player.airJumps = 1 + lo.extraAir;
		player.w = Math.max(18, PW - lo.hitTrim);
		if (lo.growJed > 1) {
			player.w = Math.round(player.w * lo.growJed);
			player.h = Math.round(PH * lo.growJed);
		}
		coinsGot = /* @__PURE__ */ new Set();
		pesosGot = /* @__PURE__ */ new Set();
		smashed = /* @__PURE__ */ new Set();
		cpOn = /* @__PURE__ */ new Set();
		powersGot = /* @__PURE__ */ new Set();
		buff = emptyBuff();
		warranty = false;
		carArmor = lo.armor;
		hazFree = lo.firstHazFree;
		grabbedStar = false;
		grabbedGrow = false;
		grabbedNation = false;
		grabbedReplevin = false;
		grabbedMusic = false;
		grabbedElite = false;
		grabbedJohn = false;
		grabbedFidelity = false;
		pesos = 0;
		deaths = 0;
		time = 0;
		clock = 0;
		hudAcc = 0;
		lastPopAt = -99;
		saveAcc = 0;
		record = false;
		killLock = 0;
		hitstop = 0;
		camKick = 0;
		flash = 0;
		combo = 0;
		comboT = 0;
		comboMax = 0;
		dealName = "";
		dealBuy = 0;
		dealSell = 0;
		dealProfit = 0;
		bootMovers();
		bootTraffic();
		foes = bootEnemies(seedEnemies(level.width, 500, level.enemies));
		johnX = spawn.x - 48;
		johnY = spawn.y + PH;
		johnFace = 1;
		void ensureBg(level.bg, assets);
		prefetchMaps(assets, [level.bg]);
		particles = [];
		floaters = [];
		flyers = [];
		ghosts = [];
		rings = [];
		screen = "play";
		banner = "TARA NA SA MCARS PH";
		bannerT = 2.1;
		if (lo.id !== "vios") {
			firePopup("car", `${lo.year} ${lo.name}`, lo.passive, true);
		} else {
			firePopup("line", "TARA NA SA MCARS PH", "One day process. Same-day release. No bank approval.");
		}
		cam.x = Math.max(0, player.x - vw * .3);
		cam.y = Math.max(0, player.y - vh * .62);
		input.clearTouch();
		sfx.unlock();
		canvas.focus({ preventScroll: true });
		pushHud();
	}
	function firePopup(kind: PopupKind, title: string, copy: string, force = false) {
		if (!force && kind !== "car" && kind !== "rank" && time - lastPopAt < 2.4 && popupT > 0.4) return;
		popupKind = kind;
		popupTitle = title;
		popupCopy = copy;
		popupId += 1;
		popupT = kind === "car" || kind === "rank" ? 2.8 : kind === "line" ? 1.8 : 2.2;
		lastPopAt = time;
		pushHud();
	}
	function grantCars() {
		const fresh = freshUnlocks(save);
		if (!fresh.length) return false;
		for (const c of fresh) {
			if (!save.cars.includes(c.id)) save.cars.push(c.id);
		}
		writeSave(save);
		sfx.unlockChime();
		if (fresh.length === 1) {
			firePopup("car", `${fresh[0].year} ${fresh[0].name}`, fresh[0].jed, true);
		} else {
			firePopup("car", `${fresh.length} UNITS RELEASED`, fresh.map((c) => c.name).join(" · "), true);
		}
		return true;
	}
	function grantLooks() {
		const fresh = freshOutfitUnlocks(save);
		if (!fresh.length) return false;
		for (const o of fresh) {
			if (!save.outfits.includes(o.id)) save.outfits.push(o.id);
		}
		writeSave(save);
		sfx.unlockChime();
		firePopup("line", fresh[0].name.toUpperCase(), fresh[0].jed, true);
		return true;
	}
	function peekDeal(): FlipDeal {
		return flipAt(comboT > 0 ? combo + 1 : 1);
	}
	function closeDeal(x: number, y: number) {
		const pk = loadout();
		if (comboT > 0) combo += 1;
		else combo = 1;
		comboT = COMBO_WINDOW + (buff.musicbox > 0 ? 0.4 : 0) + (buff.discount > 0 ? 0.18 : 0);
		comboMax = Math.max(comboMax, combo);
		const deal = flipAt(combo);
		const mul = pk.pesoMul * (buff.quota > 0 ? 2 : 1) * (buff.musicbox > 0 ? 1.15 : 1);
		const profit = flipProfit(deal, combo, mul);
		pesos += profit;
		save.careerPesos += profit;
		dealName = `${deal.year} ${deal.name}`;
		dealBuy = deal.buy;
		dealSell = deal.sell;
		dealProfit = profit;
		sfx.combo(combo);
		burst(x, y, 8, "#d4a017", 150);
		if (!lite) sparkle(x, y, 7, "#ffe08a");
		ring(x, y, "rgba(212,160,23,0.9)", 5, 90);
		floaters.push({
			x,
			y: y - 8,
			text: `×${combo} ${deal.name.toUpperCase()}  +${formatPesos(profit)}`,
			life: 0.95,
		});
		flyers.push({
			x,
			y,
			life: 0.72,
			max: 0.72,
			hue: deal.hue,
			suv: deal.kind === "suv",
		});
		if (combo === 4 || combo === 8 || combo === 12) {
			firePopup(
				"line",
				`${combo}× CLOSE`,
				`${deal.year} ${deal.name}. Buy ${formatPesos(deal.buy)}. Sell ${formatPesos(deal.sell)}. Profit ${formatPesos(profit)}.`,
				true,
			);
		}
	}
	function paintDealCar(x: number, y: number, deal: FlipDeal, scale: number, alpha = 1) {
		const img = deal.kind === "suv" ? assets.suv : assets.sedan;
		const w = (deal.kind === "suv" ? 44 : 38) * scale;
		const h = (deal.kind === "suv" ? 26 : 22) * scale;
		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.imageSmoothingEnabled = false;
		if (img) {
			try {
				ctx.drawImage(tintSprite(img, deal.hue, `flip-${deal.id}-${deal.hue}`), x - w / 2, y - h, w, h);
			} catch {
				ctx.fillStyle = "#e10600";
				ctx.fillRect(x - w / 2, y - h, w, h);
			}
		} else {
			ctx.fillStyle = "#e10600";
			ctx.fillRect(x - w / 2, y - h, w, h);
			ctx.fillStyle = "#f4f4f5";
			ctx.fillRect(x - w * 0.3, y - h + 4, w * 0.6, 4);
		}
		ctx.restore();
	}
	function setGrow(on: boolean) {
		if (on && player.grow <= 0) {
			const oldH = player.h;
			player.grow = 1;
			player.w = 34;
			player.h = 50;
			player.y -= player.h - oldH;
		} else if (!on && player.grow > 0) {
			const oldH = player.h;
			player.grow = 0;
			player.w = PW;
			player.h = PH;
			player.y += oldH - player.h;
		}
	}
	function grabPower(kind: PowerKind, x: number, y: number) {
		const meta = POWER_META[kind];
		pesos += meta.pesos;
		if (kind === "discount") buff.discount = meta.dur;
		if (kind === "release") {
			buff.release = meta.dur;
			player.invuln = Math.max(player.invuln, meta.dur);
		}
		if (kind === "tank") {
			buff.tank = meta.dur;
			player.airJumps = Math.max(player.airJumps, 2);
		}
		if (kind === "approved") buff.approved = meta.dur;
		if (kind === "warranty") warranty = true;
		if (kind === "upgrade") setGrow(true);
		if (kind === "oneday") buff.oneday = meta.dur;
		if (kind === "tradein") buff.tradein = meta.dur;
		if (kind === "rentown") buff.rentown = meta.dur;
		if (kind === "cmap") buff.cmap = meta.dur;
		if (kind === "quota") buff.quota = meta.dur;
		if (kind === "pasalo") {
			buff.pasalo = meta.dur;
			player.airJumps = Math.max(player.airJumps, 2);
		}
		if (kind === "nationwide") {
			buff.nationwide = meta.dur;
			player.vx = player.facing * 720;
			player.x += player.facing * 168;
			player.x = Math.max(0, Math.min(level.width - player.w, player.x));
			collideAxis("x");
			player.invuln = Math.max(player.invuln, 0.5);
			player.spin = Math.PI * 2;
			camKick = Math.min(14, camKick + 8);
		}
		if (kind === "replevin") buff.replevin = meta.dur;
		if (kind === "musicbox") buff.musicbox = meta.dur;
		if (kind === "elite") buff.elite = meta.dur;
		if (kind === "john") {
			buff.john = meta.dur;
			johnX = x;
			johnY = y + 20;
			if (buff.fidelity <= 0) buff.fidelity = 3.2;
			sfx.summon();
			banner = "BOSS JOHN ON THE LOT";
			bannerT = 1.8;
			confetti(x, y, 18);
		}
		if (kind === "fidelity") {
			buff.fidelity = meta.dur;
			player.invuln = Math.max(player.invuln, meta.dur);
			if (buff.john <= 0) {
				buff.john = 4;
				johnX = player.x - 40;
				johnY = player.y + player.h;
			}
			sfx.shield();
			banner = "FIDELITY SECURITY";
			bannerT = 1.8;
		}
		if (kind === "release") grabbedStar = true;
		if (kind === "upgrade") grabbedGrow = true;
		if (kind === "nationwide") grabbedNation = true;
		if (kind === "replevin") grabbedReplevin = true;
		if (kind === "musicbox") grabbedMusic = true;
		if (kind === "elite") grabbedElite = true;
		if (kind === "john") grabbedJohn = true;
		if (kind === "fidelity") grabbedFidelity = true;
		if (kind === "commission") {
			let grabbed = 0;
			for (let i = 0; i < level.coins.length && grabbed < 2; i++) {
				if (coinsGot.has(i)) continue;
				coinsGot.add(i);
				save.careerKeys += 1;
				grabbed += 1;
				closeDeal(level.coins[i].x, level.coins[i].y);
			}
		}
		if (kind !== "john" && kind !== "fidelity") sfx.power();
		if (meta.pesos > 0 || kind === "commission" || kind === "upgrade") flushSave(true);
		else markSave();
		if (!grantCars()) firePopup(kind, meta.title, meta.copy, true);
		tryMissions(false);
		burst(x, y, lite ? 6 : 12, meta.color, 180);
		if (!lite) sparkle(x, y, 10, meta.color);
		ring(x, y, "rgba(225,6,0,0.85)", 8, 120);
		floaters.push({
			x,
			y,
			text: meta.tag,
			life: .9
		});
	}
	function burst(x: number, y: number, n: number, color: string, speed = 160) {
		for (let i = 0; i < n; i++) {
			const a = Math.random() * Math.PI * 2;
			const s = speed * (.4 + Math.random());
			particles.push({
				x,
				y,
				vx: Math.cos(a) * s,
				vy: Math.sin(a) * s - 40,
				life: .35 + Math.random() * .35,
				max: .7,
				size: 2 + Math.random() * 3,
				color,
				g: 520,
				kind: "box",
				rot: 0,
				vr: 0
			});
		}
		trimParticles();
	}
	function dust(x: number, y: number, n = 4, dir = 0) {
		if (reduced) return;
		for (let i = 0; i < n; i++) particles.push({
			x: x + (Math.random() - .5) * 12,
			y: y + (Math.random() - .5) * 3,
			vx: dir * (50 + Math.random() * 90) + (Math.random() - .5) * 40,
			vy: -30 - Math.random() * 70,
			life: .32 + Math.random() * .32,
			max: .64,
			size: 4 + Math.random() * 7,
			color: "rgba(232,220,196,0.82)",
			g: 160,
			kind: "dust",
			rot: 0,
			vr: 0
		});
		trimParticles();
	}
	function sparkle(x: number, y: number, n = 4, color = "#f5e6a3") {
		if (reduced) return;
		for (let i = 0; i < n; i++) {
			const a = Math.random() * Math.PI * 2;
			const s = 30 + Math.random() * 80;
			particles.push({
				x,
				y,
				vx: Math.cos(a) * s,
				vy: Math.sin(a) * s - 40,
				life: .28 + Math.random() * .28,
				max: .56,
				size: 2 + Math.random() * 2.5,
				color,
				g: 40,
				kind: "sparkle",
				rot: Math.random() * Math.PI,
				vr: (Math.random() - .5) * 8
			});
		}
		trimParticles();
	}
	function ring(x: number, y: number, color: string, r = 6, grow = 70) {
		if (reduced) return;
		rings.push({
			x,
			y,
			life: .38,
			max: .38,
			r,
			grow,
			color,
			w: 2.4
		});
		if (rings.length > 12) rings.shift();
	}
	function confetti(x: number, y: number, n = 22) {
		const colors = [
			"#e10600",
			"#d4a017",
			"#f4f4f5",
			"#ff6b4a"
		];
		for (let i = 0; i < n; i++) {
			const a = -Math.PI / 2 + (Math.random() - .5) * 1.8;
			const s = 140 + Math.random() * 220;
			particles.push({
				x,
				y,
				vx: Math.cos(a) * s,
				vy: Math.sin(a) * s,
				life: .7 + Math.random() * .6,
				max: 1.2,
				size: 3 + Math.random() * 4,
				color: colors[i % colors.length],
				g: 620,
				kind: "confetti",
				rot: Math.random() * Math.PI,
				vr: (Math.random() - .5) * 12
			});
		}
		trimParticles();
	}
	function trimParticles() {
		const cap = lite ? 48 : 90;
		if (particles.length > cap) particles.splice(0, particles.length - cap);
	}
	function kill() {
		if (player.invuln > 0 || killLock > 0 || screen !== "play") return;
		if (buff.release > 0 || buff.fidelity > 0) {
			player.invuln = Math.max(player.invuln, .4);
			return;
		}
		if (player.grow > 0) {
			setGrow(false);
			player.invuln = 1.4;
			flash = .28;
			trauma = Math.min(1, trauma + .2);
			burst(player.x + player.w / 2, player.y + player.h / 2, 12, "#ef4444", 180);
			sfx.power();
			pushHud();
			return;
		}
		if (warranty) {
			warranty = false;
			player.invuln = 1.6;
			flash = .35;
			trauma = Math.min(1, trauma + .25);
			burst(player.x + player.w / 2, player.y + player.h / 2, 14, "#f4f4f5", 180);
			firePopup("warranty", "LIFETIME WARRANTY", "Claimed. You're still on the lot.", true);
			sfx.power();
			pushHud();
			return;
		}
		if (carArmor > 0) {
			carArmor -= 1;
			player.invuln = 1.5;
			flash = .3;
			trauma = Math.min(1, trauma + .22);
			burst(player.x + player.w / 2, player.y + player.h / 2, 12, "#d4a017", 180);
			const lo = loadout();
			firePopup("car", lo.tag, "Unit armor. Still closing.", true);
			sfx.power();
			pushHud();
			return;
		}
		sfx.death();
		trauma = Math.min(1, trauma + .45);
		flash = .32;
		burst(player.x + player.w / 2, player.y + player.h / 2, lite ? 10 : 18, "#e10600", 240);
		dust(player.x + player.w / 2, player.y + player.h, 6, -player.facing);
		ring(player.x + player.w / 2, player.y + player.h / 2, "rgba(225,6,0,0.85)", 10, 140);
		deaths += 1;
		killLock = KILL_LOCK;
		hitstop = lite ? 0 : .05;
		if (combo > 1) {
			floaters.push({
				x: player.x + player.w / 2,
				y: player.y,
				text: `COMBO DROP ×${combo}`,
				life: 0.9,
			});
		}
		combo = 0;
		comboT = 0;
		player = makePlayer(spawn.x, spawn.y);
		player.invuln = 1.15;
		input.clearTouch();
		banner = cpOn.size > 0 ? "CHECKPOINT" : "DENIED";
		bannerT = 0.85;
		buff = emptyBuff();
		pushHud();
	}
	function solids() {
		return [...level.solids, ...movers];
	}
	function stepMovers(dt: number) {
		for (const m of movers) {
			m.px = m.x;
			m.py = m.y;
			const t = time * m.speed + m.phase;
			if (m.axis === "x") m.x = m.ox + Math.sin(t) * m.amp;
			else m.y = m.oy + Math.sin(t) * m.amp;
		}
		if (player.riding >= 0 && player.riding < movers.length) {
			const m = movers[player.riding];
			player.x += m.x - m.px;
			player.y += m.y - m.py;
		}
	}
	function stepTraffic(dt: number) {
		for (const t of traffic) {
			t.px = t.x;
			t.x += t.vx * dt;
			if (t.x < t.min) {
				t.x = t.min;
				t.vx = Math.abs(t.vx);
			}
			if (t.x + t.w > t.max) {
				t.x = t.max - t.w;
				t.vx = -Math.abs(t.vx);
			}
		}
		if (ridingTraffic >= 0 && ridingTraffic < traffic.length) {
			const t = traffic[ridingTraffic];
			player.x += t.x - t.px;
		}
	}
	function collideAxis(axis: "x" | "y", prevY = player.y) {
		const box = {
			x: player.x,
			y: player.y,
			w: player.w,
			h: player.h
		};
		const list = solids();
		if (axis === "y") {
			if (!(player.dropT > 0 || player.vy < 0)) {
				for (const p of level.oneWays) if (player.vy >= 0 && prevY + player.h <= p.y + 8) list.push(p);
			}
			if (player.vy >= 0) {
				for (const t of traffic) {
					if (!t.ride) continue;
					list.push({ x: t.x + 10, y: t.y, w: t.w - 20, h: 12 });
				}
			}
		}
		let bestY = player.y;
		let hitFloor = false;
		let ride = -1;
		for (let i = 0; i < list.length; i++) {
			const s = list[i];
			if (!aabb(box, s)) continue;
			if (axis === "x") {
				if (player.vx > 0) player.x = s.x - player.w;
				else if (player.vx < 0) player.x = s.x + s.w;
				else {
					const leftPen = player.x + player.w - s.x;
					const rightPen = s.x + s.w - player.x;
					player.x = leftPen < rightPen ? s.x - player.w : s.x + s.w;
				}
				player.vx = 0;
				box.x = player.x;
			} else if (player.vy > 0 || player.y + player.h / 2 <= s.y + s.h / 2) {
				const ny = s.y - player.h;
				if (!hitFloor || ny < bestY) {
					bestY = ny;
					hitFloor = true;
					ride = movers.indexOf(s as Mover);
				}
			} else {
				player.y = s.y + s.h;
				player.vy = 0;
				box.y = player.y;
			}
		}
		if (hitFloor) {
			player.y = bestY;
			player.vy = 0;
			player.grounded = true;
			if (ride >= 0) player.riding = ride;
			ridingTraffic = -1;
			for (let ti = 0; ti < traffic.length; ti++) {
				const t = traffic[ti];
				if (!t.ride) continue;
				if (player.x + player.w > t.x + 8 && player.x < t.x + t.w - 8 && Math.abs(player.y + player.h - t.y) < 12) {
					ridingTraffic = ti;
					break;
				}
			}
		}
	}

	function smashFoe(e: LotEnemy, tag: string, color: string) {
		if (!e.alive) return;
		e.hp -= 1;
		if (e.hp > 0) {
			e.x += (e.x < player.x ? -28 : 28);
			burst(e.x + e.w / 2, e.y + e.h / 2, 8, color, 140);
			sfx.stomp();
			return;
		}
		e.alive = false;
		save.stompTotal += 1;
		sfx.stomp();
		burst(e.x + e.w / 2, e.y + e.h / 2, 12, color, 180);
		floaters.push({ x: e.x, y: e.y, text: tag, life: 0.7 });
		const pay = Math.round((e.kind === "repo" ? 4000 : 2500) * loadout().pesoMul);
		pesos += pay;
		save.careerPesos += pay;
		markSave();
		tryMissions(false);
		hitstop = lite ? 0 : 0.04;
		trauma = Math.min(1, trauma + 0.16);
	}
	function tickAllies(dt: number, hit: Rect): boolean {
		const cx = player.x + player.w / 2;
		const feet = player.y + player.h;
		if (buff.john > 0) {
			const tx = player.x - player.facing * 46;
			johnX += (tx - johnX) * Math.min(1, 7 * dt);
			johnY += (feet - johnY) * Math.min(1, 10 * dt);
			johnFace = player.facing;
		}
		if (buff.fidelity > 0) {
			for (let i = 0; i < GUARD_COUNT; i++) {
				const g = guardOrbit(cx, feet - 6, i, time, 58);
				for (const e of foes) {
					if (!e.alive) continue;
					if (Math.abs(g.x - (e.x + e.w / 2)) < 22 && Math.abs(g.y - (e.y + e.h)) < 28) {
						smashFoe(e, "SECURE", "#c9a227");
					}
				}
			}
		}
		if (buff.john > 0) {
			const jhit = { x: johnX - 16, y: johnY - 46, w: 32, h: 46 };
			for (const e of foes) {
				if (!e.alive) continue;
				if (aabb(jhit, e)) smashFoe(e, "JOHN", "#d4a017");
			}
		}
		for (const e of foes) {
			if (!e.alive) continue;
			e.anim += dt;
			const amp = e.patrol ?? 70;
			const spd = e.speed ?? 70;
			if (e.kind === "repo" && Math.abs(e.x - player.x) < 260) {
				e.facing = player.x >= e.x ? 1 : -1;
				e.x += e.facing * spd * 1.15 * dt;
			} else {
				const t = Math.sin(time * (spd / 90) + e.ox * 0.01);
				e.x = e.ox + t * amp;
				e.facing = t >= 0 ? 1 : -1;
			}
			if (!aabb(hit, e)) continue;
			const stomp = player.vy > 70 && player.y + player.h - 10 <= e.y + 16;
			if (stomp || player.grow > 0 || buff.tradein > 0 || buff.john > 0 || buff.fidelity > 0) {
				player.vy = JUMP_V * 0.55;
				player.grounded = false;
				smashFoe(e, e.kind === "repo" ? "REPO" : "CLOSE", "#e10600");
				continue;
			}
			kill();
			return false;
		}
		return true;
	}
	function physics(dt: number) {
		input.sample();
		killLock = Math.max(0, killLock - dt);
		if (hitstop > 0) {
			hitstop = Math.max(0, hitstop - dt);
			return;
		}
		if (screen === "play" && input.pausePressed) {
			screen = "pause";
			input.clearTouch();
			pushHud();
			return;
		}
		if (screen === "pause") {
			if (input.pausePressed) {
				screen = "play";
				pushHud();
			}
			return;
		}
		if (screen === "win") return;
		if (screen !== "play") return;
		clock += dt;
		const hadPop = popupT > 0;
		popupT = Math.max(0, popupT - dt);
		if (hadPop && popupT === 0) pushHud();
		buff.discount = Math.max(0, buff.discount - dt);
		buff.release = Math.max(0, buff.release - dt);
		buff.tank = Math.max(0, buff.tank - dt);
		buff.approved = Math.max(0, buff.approved - dt);
		buff.oneday = Math.max(0, buff.oneday - dt);
		buff.tradein = Math.max(0, buff.tradein - dt);
		buff.rentown = Math.max(0, buff.rentown - dt);
		buff.cmap = Math.max(0, buff.cmap - dt);
		buff.quota = Math.max(0, buff.quota - dt);
		buff.pasalo = Math.max(0, buff.pasalo - dt);
		buff.nationwide = Math.max(0, buff.nationwide - dt);
		buff.replevin = Math.max(0, buff.replevin - dt);
		buff.musicbox = Math.max(0, buff.musicbox - dt);
		buff.elite = Math.max(0, buff.elite - dt);
		buff.john = Math.max(0, buff.john - dt);
		buff.fidelity = Math.max(0, buff.fidelity - dt);
		if (comboT > 0) {
			comboT = Math.max(0, comboT - dt);
			if (comboT === 0 && combo > 0) {
				if (combo > 1) {
					banner = `COMBO DROP ×${combo}`;
					bannerT = 0.75;
				}
				combo = 0;
				pushHud();
			}
		}
		if (buff.release > 0) player.invuln = Math.max(player.invuln, 0.16);
		if (buff.nationwide > 0) player.invuln = Math.max(player.invuln, 0.08);
		if (buff.fidelity > 0) player.invuln = Math.max(player.invuln, 0.2);
		hudAcc += dt;
		if (hudAcc >= HUD_HZ) {
			hudAcc = 0;
			pushHud();
		}
		saveAcc += dt;
		if (saveAcc >= 0.9) flushSave();
		if (input.restartPressed) {
			startLevel(levelIndex);
			return;
		}
		stepMovers(dt);
		stepTraffic(dt);
		const wasGrounded = player.grounded;
		player.riding = -1;
		ridingTraffic = -1;
		player.invuln = Math.max(0, player.invuln - dt);
		player.dropT = Math.max(0, player.dropT - dt);
		player.holdT = Math.max(0, player.holdT - dt);
		player.squashT += (0 - player.squashT) * (1 - Math.exp(-7 * dt));
		player.squash += (player.squashT - player.squash) * (1 - Math.exp(-18 * dt));
		if (player.spin > 0) {
			const spinRate = player.grounded ? 28 : 18;
			player.spin = Math.max(0, player.spin - spinRate * dt);
		}
		player.blink += dt;
		if (player.blink > 3.1) player.blink = 0;
		const leanT = Math.max(-1, Math.min(1, player.vx / MAX_RUN)) * .32;
		player.lean += (leanT - player.lean) * (1 - Math.exp(-10 * dt));
		if (input.downHeld) player.dropT = .22;
		const ax = wasGrounded ? ACCEL_G : ACCEL_A;
		const pk = loadout();
		const speedMul = (buff.approved > 0 ? 1.52 : 1) * (buff.oneday > 0 ? 1.38 : 1) * pk.speedMul;
		const runCap = MAX_RUN * speedMul;
		const jumpPow = JUMP_V * (buff.tank > 0 ? 1.12 : 1) * (buff.elite > 0 ? 1.42 : 1) * (player.grow > 0 ? 1.06 : 1) * pk.jumpMul;
		const djumpPow = DJUMP_V * (buff.tank > 0 ? 1.1 : 1) * (buff.elite > 0 ? 1.22 : 1) * pk.jumpMul;
		const airMul = wasGrounded ? 1 : buff.rentown > 0 ? 1.35 : 1;
		if (input.moveX !== 0) {
			player.vx += input.moveX * ax * airMul * dt;
			player.facing = input.moveX < 0 ? -1 : 1;
		} else if (wasGrounded) player.vx = approach(player.vx, 0, FRICTION * dt);
		else player.vx = approach(player.vx, 0, AIR_DRAG * dt);
		player.vx = Math.max(-runCap, Math.min(runCap, player.vx));
		if (wasGrounded) player.coyote = COYOTE + pk.coyoteAdd + (buff.elite > 0 ? 0.08 : 0);
		else player.coyote = Math.max(0, player.coyote - dt);
		if (input.jumpPressed) player.buffer = BUFFER;
		else player.buffer = Math.max(0, player.buffer - dt);
		if (player.buffer > 0 && player.coyote > 0) {
			player.vy = jumpPow;
			player.buffer = 0;
			player.coyote = 0;
			player.cut = false;
			player.holdT = MIN_HOLD;
			player.grounded = false;
			player.squashT = -.4;
			sfx.jump();
			burst(player.x + player.w / 2, player.y + player.h, 4, "#c4c4cc", 90);
			dust(player.x + player.w / 2, player.y + player.h, lite ? 4 : 7, -player.facing);
			ring(player.x + player.w / 2, player.y + player.h, "rgba(244,244,245,0.55)", 4, 90);
		} else if (input.jumpPressed && !wasGrounded && player.airJumps > 0) {
			if (buff.nationwide > 0 || pk.blinkDash) {
				player.vx = player.facing * 740;
				player.vy = Math.min(player.vy, -160);
				player.invuln = Math.max(player.invuln, 0.32);
			} else {
				player.vy = djumpPow;
			}
			player.cut = false;
			player.holdT = MIN_HOLD;
			player.airJumps -= 1;
			player.squashT = -.34;
			if (!reduced) player.spin = Math.PI * 2;
			camKick = Math.min(12, camKick + 5);
			trauma = Math.min(1, trauma + .1);
			sfx.doubleJump();
			burst(player.x + player.w / 2, player.y + player.h / 2, lite ? 6 : 10, "#e10600", 150);
			if (!lite) sparkle(player.x + player.w / 2, player.y + player.h / 2, 6, "#ff8a72");
			ring(player.x + player.w / 2, player.y + player.h / 2, "rgba(225,6,0,0.75)", 8, 110);
		}
		if (!input.jumpHeld && player.vy < 0 && !player.cut && player.holdT <= 0) {
			player.vy *= .5;
			player.cut = true;
		}
		let grav = GRAV_DOWN;
		if (player.vy < 0) grav = Math.abs(player.vy) < APEX ? GRAV_APEX : GRAV_UP;
		if (buff.rentown > 0) grav *= 0.42;
		else grav *= pk.floatMul;
		player.vy += grav * dt;
		const fallCap = buff.rentown > 0 ? 520 : MAX_FALL;
		if (player.vy > fallCap) player.vy = fallCap;
		player.grounded = false;
		const speed = Math.hypot(player.vx, player.vy);
		const steps = Math.max(1, Math.ceil(speed * dt / 5));
		const sdt = dt / steps;
		for (let i = 0; i < steps; i++) {
			player.x += player.vx * sdt;
			collideAxis("x");
			const py = player.y;
			player.y += player.vy * sdt;
			collideAxis("y", py);
		}
		if (player.grounded) {
			if (!wasGrounded) {
				player.squashT = .52;
				camKick = Math.min(16, 7 + Math.abs(player.vy) * .01);
				trauma = Math.min(1, trauma + .14);
				sfx.land();
				burst(player.x + player.w / 2, player.y + player.h, 5, "#8a8a96", 80);
				dust(player.x + player.w / 2, player.y + player.h, lite ? 5 : 8, -player.facing);
				ring(player.x + player.w / 2, player.y + player.h, "rgba(196,196,204,0.7)", 5, 100);
			}
			player.airJumps = (buff.tank > 0 ? 2 : 1) + pk.extraAir + (buff.pasalo > 0 ? 1 : 0);
			if (Math.abs(player.vx) > 40) {
				const up = Math.sin(player.anim * 2.4) > 0;
				if (up !== player.footUp) {
					player.footUp = up;
					dust(player.x + player.w / 2 - player.facing * 6, player.y + player.h, 1, -player.facing);
					if (!reduced) sfx.step();
				}
			}
		}
		if (player.x < 0) {
			player.x = 0;
			if (player.vx < 0) player.vx = 0;
		}
		if (player.x + player.w > level.width) {
			player.x = level.width - player.w;
			if (player.vx > 0) player.vx = 0;
		}
		if (player.y > level.height + 48) {
			kill();
			return;
		}
		const hit = {
			x: player.x + 3,
			y: player.y + 6,
			w: player.w - 6,
			h: player.h - 8
		};
		for (let hi = 0; hi < level.hazards.length; hi++) {
			if (smashed.has(hi)) continue;
			const h = level.hazards[hi];
			if (!aabb(hit, h)) continue;
			const canStomp = (h.kind === "cone" || h.kind === "oil") && player.vy > 70 && (player.grow > 0 || buff.tradein > 0 || buff.replevin > 0 || pk.stompCones);
			if (canStomp && (h.kind === "cone" || buff.replevin > 0 || pk.stompCones)) {
				smashed.add(hi);
				save.stompTotal += 1;
				player.vy = JUMP_V * (buff.replevin > 0 ? 0.78 : 0.52);
				player.grounded = false;
				sfx.stomp();
				burst(h.x + h.w / 2, h.y, 10, buff.replevin > 0 ? "#c084fc" : "#e24a16", 160);
				floaters.push({ x: h.x, y: h.y, text: buff.replevin > 0 ? "REPO" : "TRADE-IN", life: 0.7 });
				pesos += Math.round(2000 * pk.pesoMul);
				save.careerPesos += Math.round(2000 * pk.pesoMul);
				markSave();
				tryMissions(false);
				continue;
			}
			if (h.kind === "oil") {
				if (buff.cmap > 0 || pk.oilImmune) continue;
				if (hazFree) {
					hazFree = false;
					player.invuln = Math.max(player.invuln, 0.45);
					floaters.push({ x: h.x, y: h.y, text: "CLEAN", life: 0.6 });
					continue;
				}
				const cap = MAX_RUN * 1.22;
				player.vx += player.facing * 90 * dt;
				player.vx = Math.max(-cap, Math.min(cap, player.vx));
				continue;
			}
			if ((buff.cmap > 0 || pk.phaseCones) && h.kind === "cone") continue;
			if (hazFree && (h.kind === "cone" || h.kind === "spikes")) {
				hazFree = false;
				player.invuln = 0.8;
				floaters.push({ x: h.x, y: h.y, text: "CLEAN", life: 0.7 });
				sfx.power();
				continue;
			}
			kill();
			return;
		}
		for (let ti = 0; ti < traffic.length; ti++) {
			if (ti === ridingTraffic) continue;
			const t = traffic[ti];
			const body = { x: t.x + 12, y: t.y + 16, w: t.w - 24, h: t.h - 16 };
			if (!aabb(hit, body)) continue;
			if (player.vy > 90 && player.y + player.h - 8 <= t.y + 18 && t.ride) {
				ridingTraffic = ti;
				player.vy = JUMP_V * 0.42;
				player.grounded = true;
				player.y = t.y - player.h;
				sfx.stomp();
				burst(t.x + t.w / 2, t.y, 8, "#f4f4f5", 120);
				continue;
			}
			kill();
			return;
		}
		for (let i = 0; i < level.coins.length; i++) {
			if (coinsGot.has(i)) continue;
			const c = level.coins[i];
			const rad = (buff.discount > 0 ? 46 : 14) + pk.magnet + (buff.pasalo > 0 ? 18 : 0) + (buff.musicbox > 0 ? 72 : 0);
			if (aabb(hit, {
				x: c.x - rad,
				y: c.y - rad,
				w: rad * 2,
				h: rad * 2
			})) {
				coinsGot.add(i);
				save.careerKeys += 1;
				closeDeal(c.x, c.y);
				const bonus = Math.round(((buff.discount > 0 ? 5000 : 0) + (buff.quota > 0 ? 2000 : 0) + (buff.musicbox > 0 ? 1500 : 0)) * pk.pesoMul);
				if (bonus) {
					pesos += bonus;
					save.careerPesos += bonus;
				}
				markSave();
				if (!grantCars() && coinsGot.size > 0 && coinsGot.size % 8 === 0 && combo < 4) {
					firePopup("keys", `${coinsGot.size} UNITS`, "Keys turned into cars. Keep the chain.");
				}
				tryMissions(false);
			}
		}
		for (let i = 0; i < level.pesos.length; i++) {
			if (pesosGot.has(i)) continue;
			const c = level.pesos[i];
			const rad = (buff.discount > 0 ? 40 : 12) + pk.magnet + (buff.pasalo > 0 ? 16 : 0) + (buff.musicbox > 0 ? 64 : 0);
			if (aabb(hit, {
				x: c.x - rad,
				y: c.y - rad,
				w: rad * 2,
				h: rad * 2
			})) {
				pesosGot.add(i);
				const pay = Math.round(((buff.quota > 0 ? 2000 : 1000) + (buff.musicbox > 0 ? 500 : 0)) * pk.pesoMul);
				pesos += pay;
				save.careerPesos += pay;
				sfx.peso();
				burst(c.x, c.y, 5, "#f5d76e", 120);
				floaters.push({ x: c.x, y: c.y, text: pay >= 1000 ? `+₱${Math.round(pay / 1000)}K` : `+₱${pay}`, life: 0.55 });
				ring(c.x, c.y, "rgba(245,215,110,0.8)", 3, 70);
				markSave();
				tryMissions(false);
			}
		}
		for (let i = 0; i < level.powerups.length; i++) {
			if (powersGot.has(i)) continue;
			const p = level.powerups[i];
			if (aabb(hit, {
				x: p.x - 18,
				y: p.y - 18,
				w: 36,
				h: 36
			})) {
				powersGot.add(i);
				grabPower(p.kind, p.x, p.y);
				pushHud();
			}
		}
		if (tickAllies(dt, hit) === false) return;
		for (let i = 0; i < level.checkpoints.length; i++) {
			const c = level.checkpoints[i];
			const box = {
				x: c.x - 10,
				y: c.y - 78,
				w: 36,
				h: 78
			};
			if (!cpOn.has(i) && aabb(hit, box)) {
				cpOn.add(i);
				spawn = {
					x: c.x,
					y: c.y - player.h - 2
				};
				sfx.checkpoint();
				banner = "ANOTHER DAY, ANOTHER SOLD";
				bannerT = 1.35;
				burst(c.x + 8, c.y - 40, 8, "#e10600", 120);
				if (!lite) sparkle(c.x + 12, c.y - 50, 6, "#ff8a72");
				ring(c.x + 12, c.y - 50, "rgba(225,6,0,0.8)", 10, 90);
				if (!grantCars() && cpOn.size === 1) {
					firePopup("line", "ANOTHER DAY, ANOTHER SOLD", "Checkpoint stamped. Dream car pa rin.");
				}
			}
		}
		if (aabb(hit, {
			x: level.goal.x - 8,
			y: level.goal.y - 86,
			w: 40,
			h: 86
		})) {
			screen = "win";
			sfx.win();
			trauma = .4;
			flash = .28;
			burst(level.goal.x, level.goal.y - 40, 24, "#d4a017", 200);
			confetti(level.goal.x, level.goal.y - 50, 36);
			sparkle(level.goal.x, level.goal.y - 50, 12, "#ffe08a");
			ring(level.goal.x + 18, level.goal.y - 48, "rgba(212,160,23,0.9)", 12, 130);
			if (levelIndex + 1 > save.unlocked) save.unlocked = Math.min(LEVELS.length - 1, levelIndex + 1);
			save.best[levelIndex] = Math.max(save.best[levelIndex] ?? 0, coinsGot.size);
			const prev = save.bestTime[levelIndex] ?? 0;
			if (prev <= 0 || clock < prev) {
				save.bestTime[levelIndex] = clock;
				record = true;
			}
			writeSave(save);
			saveDirty = false;
			input.clearTouch();
			const par = level.width / 78;
			let star = 1;
			if (deaths === 0) star = 2;
			if (deaths === 0 && clock > 0 && clock <= par) star = 3;
			save.stars[levelIndex] = Math.max(save.stars[levelIndex] ?? 0, star);
			writeSave(save);
			const missionHit = tryMissions(true);
			const gotCar = grantCars();
			const gotLook = grantLooks();
			if (!missionHit && !gotCar && !gotLook) {
				firePopup(
					"line",
					record ? "NEW BEST" : "SAME-DAY RELEASE",
					pesos > 0
						? `Max combo ×${comboMax}. Banked ${formatPesos(pesos)} in flips.`
						: "Dream car mo, sagot ni Boss Jed.",
					true,
				);
			}
			pushHud();
		}
		const runF = 6 + Math.min(9, Math.abs(player.vx) / 32);
		player.anim += dt * (player.grounded && Math.abs(player.vx) > 20 ? runF : 5.4);
	}
	function drawSolid(s: Rect, oneWay: boolean) {
		const top = oneWay ? "#9aa0b4" : "#d8dae4";
		ctx.fillStyle = oneWay ? "#32343e" : "#2c2e38";
		ctx.fillRect(s.x, s.y, s.w, Math.min(s.h, 90));
		if (s.h > 90) {
			ctx.fillStyle = "#1c1e26";
			ctx.fillRect(s.x, s.y + 18, s.w, s.h - 18);
			ctx.fillStyle = "rgba(255,255,255,0.04)";
			for (let x = s.x + 18; x < s.x + s.w - 8; x += 52) ctx.fillRect(x, s.y + 34, 28, 3);
		}
		ctx.fillStyle = "#e10600";
		ctx.fillRect(s.x, s.y, s.w, 4);
		ctx.fillStyle = top;
		ctx.fillRect(s.x, s.y + 4, s.w, 4);
		if (!oneWay && s.w > 70) {
			ctx.fillStyle = "rgba(212,160,23,0.38)";
			for (let x = s.x + 12; x < s.x + s.w - 18; x += 32) ctx.fillRect(x, s.y + 9, 18, 3);
		}
		ctx.fillStyle = "rgba(0,0,0,0.28)";
		ctx.fillRect(s.x, s.y + Math.min(s.h, 90) - 5, s.w, 5);
	}
	function drawJed(ghost?: Ghost, alpha = 1) {
		if (!ghost && player.invuln > 0 && Math.floor(time * 16) % 2 === 0) return;
		const x = (ghost ? ghost.x : player.x) + (ghost ? PW : player.w) / 2;
		const y = (ghost ? ghost.y : player.y) + (ghost ? PH : player.h);
		const run = !ghost && player.grounded && Math.abs(player.vx) > 28;
		const air = !ghost && !player.grounded;
		let squash = ghost ? ghost.squash : player.squash;
		if (air && !ghost) squash += Math.max(-0.2, Math.min(0.12, -player.vy / 2400));
		const sx = 1 + squash * 0.5;
		const sy = 1 - squash * 0.5;
		const facing = ghost ? ghost.facing : player.facing;
		const lean = ghost ? 0 : player.lean;
		const spin = ghost ? ghost.spin : player.spin;
		const pose = run ? "run" : air ? "air" : "idle";

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.imageSmoothingEnabled = false;
		ctx.translate(Math.round(x), Math.round(y));
		ctx.rotate(lean * 0.42);
		const growS = !ghost && player.grow > 0 ? 1.22 : 1;
		ctx.scale(facing < 0 ? -sx * growS : sx * growS, sy * growS);
		if (spin > 0.02) {
			ctx.translate(0, -20);
			ctx.rotate(spin);
			ctx.translate(0, 20);
		}

		if (!ghost && (buff.release > 0 || buff.fidelity > 0 || warranty || carArmor > 0 || buff.cmap > 0 || buff.rentown > 0 || buff.nationwide > 0 || buff.elite > 0 || buff.musicbox > 0 || buff.replevin > 0)) {
			ctx.strokeStyle = buff.fidelity > 0
				? "rgba(201,162,39,0.95)"
				: buff.release > 0
				? "rgba(245,215,110,0.85)"
				: buff.nationwide > 0
					? "rgba(56,189,248,0.9)"
					: buff.elite > 0
						? "rgba(250,204,21,0.9)"
						: buff.musicbox > 0
							? "rgba(244,114,182,0.85)"
							: buff.replevin > 0
								? "rgba(192,132,252,0.85)"
				: buff.cmap > 0
					? "rgba(167,139,250,0.85)"
					: buff.rentown > 0
						? "rgba(74,222,128,0.8)"
						: carArmor > 0
							? "rgba(212,160,23,0.85)"
						: "rgba(244,244,245,0.6)";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.ellipse(0, -22, 17 + Math.sin(time * 8) * 1.5, 26, 0, 0, Math.PI * 2);
			ctx.stroke();
		}

		if (!reduced && !ghost && !lite) {
			ctx.shadowColor = "rgba(255, 72, 56, 0.28)";
			ctx.shadowBlur = 0;
		}
		drawJedLite(ctx, 0, 0, 1, ghost ? 0 : time, 1.35, save.equippedOutfit, { pose, bob: !ghost });
		ctx.shadowBlur = 0;
		ctx.restore();
	}

	function present(dt: number) {
		time += dt;
		bannerT = Math.max(0, bannerT - dt);
		trauma = Math.max(0, trauma - dt * 2.2);
		flash = Math.max(0, flash - dt * 3.2);
		camKick += (0 - camKick) * (1 - Math.exp(-10 * dt));
		for (const p of particles) {
			p.life -= dt;
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.vy += p.g * dt;
			p.rot += p.vr * dt;
		}
		particles = particles.filter((p) => p.life > 0);
		for (const r of rings) {
			r.life -= dt;
			r.r += r.grow * dt;
		}
		rings = rings.filter((r) => r.life > 0);
		for (const f of floaters) {
			f.life -= dt;
			f.y -= 36 * dt;
		}
		floaters = floaters.filter((f) => f.life > 0);
		for (const f of flyers) {
			f.life -= dt;
			const u = 1 - Math.max(0, f.life) / f.max;
			const e = 1 - (1 - u) * (1 - u);
			const tx = cam.x + vw - 90;
			const ty = cam.y + 52;
			f.x += (tx - f.x) * e * .2;
			f.y += (ty - f.y) * e * .2;
		}
		flyers = flyers.filter((f) => f.life > 0);
		for (const g of ghosts) g.life -= dt;
		ghosts = ghosts.filter((g) => g.life > 0);
		if (!reduced && screen === "play" && Math.abs(player.vx) > 80 && !lite) {
			ghostT -= dt;
			if (ghostT <= 0) {
				ghostT = .038;
				ghosts.push({
					x: player.x,
					y: player.y,
					facing: player.facing,
					squash: player.squash,
					spin: player.spin,
					life: .2,
					max: .2
				});
				if (ghosts.length > 7) ghosts.shift();
			}
		}
		if (!reduced && !lite && motes.length < 12) motes.push({
			x: cam.x + Math.random() * vw,
			y: cam.y + Math.random() * vh,
			vx: (Math.random() - .5) * 12,
			vy: -8 - Math.random() * 16,
			a: .12 + Math.random() * .2
		});
		for (const m of motes) {
			m.x += m.vx * dt;
			m.y += m.vy * dt;
			if (m.y < cam.y - 20) {
				m.y = cam.y + vh + 10;
				m.x = cam.x + Math.random() * vw;
			}
		}
		const look = player.facing * 78 + player.vx * .2;
		const tx = player.x + player.w / 2 - vw * .42 + look;
		const ty = player.y + player.h / 2 - vh * .58 + camKick;
		const k = 1 - Math.exp(-5.5 * dt);
		cam.x += (tx - cam.x) * k;
		cam.y += (ty - cam.y) * k;
		cam.x = Math.max(0, Math.min(Math.max(0, level.width - vw), cam.x));
		cam.y = Math.max(0, Math.min(Math.max(0, level.height - vh), cam.y));
		const shake = reduced ? 0 : trauma * trauma;
		const ox = shake * 11 * Math.sin(time * 47);
		const oy = shake * 9 * Math.cos(time * 41);
		const rot = reduced ? 0 : shake * .012 * Math.sin(time * 29);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = lite ? "low" : "medium";
		ctx.clearRect(0, 0, vw, vh);
		const sky = ctx.createLinearGradient(0, 0, 0, vh);
		if (level.bg === "edsa") {
			sky.addColorStop(0, "#1c2748");
			sky.addColorStop(.5, "#3a2744");
			sky.addColorStop(1, "#1a1424");
		} else if (level.bg === "ortigas") {
			sky.addColorStop(0, "#122038");
			sky.addColorStop(.55, "#1c2c44");
			sky.addColorStop(1, "#101820");
		} else if (level.bg === "bgc") {
			sky.addColorStop(0, "#0e1a2c");
			sky.addColorStop(.55, "#1a2438");
			sky.addColorStop(1, "#10141c");
		} else if (level.bg === "nlex") {
			sky.addColorStop(0, "#3a2a38");
			sky.addColorStop(.5, "#6a4030");
			sky.addColorStop(1, "#1c1414");
		} else if (level.bg === "timog") {
			sky.addColorStop(0, "#1a1024");
			sky.addColorStop(.5, "#3a1830");
			sky.addColorStop(1, "#140c14");
		} else if (level.bg === "cubao") {
			sky.addColorStop(0, "#1a1430");
			sky.addColorStop(.5, "#3a2040");
			sky.addColorStop(1, "#141018");
		} else if (level.bg === "makati") {
			sky.addColorStop(0, "#101828");
			sky.addColorStop(.55, "#1c2838");
			sky.addColorStop(1, "#101418");
		} else if (level.bg === "clark") {
			sky.addColorStop(0, "#3a2430");
			sky.addColorStop(.45, "#c47848");
			sky.addColorStop(1, "#1c1418");
		} else if (level.bg === "cebu") {
			sky.addColorStop(0, "#2a1838");
			sky.addColorStop(.45, "#c45a38");
			sky.addColorStop(1, "#18141c");
		} else if (level.bg === "davao") {
			sky.addColorStop(0, "#243848");
			sky.addColorStop(.5, "#c47840");
			sky.addColorStop(1, "#1c1814");
		} else if (level.bg === "alabang") {
			sky.addColorStop(0, "#102030");
			sky.addColorStop(.55, "#1a3048");
			sky.addColorStop(1, "#0c141c");
		} else {
			sky.addColorStop(0, "#22202c");
			sky.addColorStop(.5, "#2c2834");
			sky.addColorStop(1, "#18161c");
		}
		ctx.fillStyle = sky;
		ctx.fillRect(0, 0, vw, vh);
		const grounds = level.solids.filter((s) => s.h > 80);
		const groundY = grounds.length ? Math.max(...grounds.map((s) => s.y)) : 500;
		const groundScreen = groundY - cam.y + oy;
		const bg = bgFor(level.bg, assets);
		if (bg) {
			drawSkyline(ctx, bg, vw, vh, cam.x * 0.07 + ox * 0.15, groundScreen + 6, 0.38);
			drawSkyline(ctx, bg, vw, vh, cam.x * 0.16 + ox * 0.25, groundScreen + 14, 0.62);
		}
		const dusk = ctx.createLinearGradient(0, 0, 0, Math.max(8, groundScreen));
		dusk.addColorStop(0, "rgba(8,10,16,0.08)");
		dusk.addColorStop(0.72, "rgba(8,10,16,0.12)");
		dusk.addColorStop(1, "rgba(8,10,16,0.38)");
		ctx.fillStyle = dusk;
		ctx.fillRect(0, 0, vw, Math.max(0, groundScreen + 8));
		ctx.save();
		ctx.translate(vw / 2, vh / 2);
		ctx.rotate(rot);
		ctx.translate(-vw / 2 - Math.round(cam.x) + ox, -vh / 2 - Math.round(cam.y) + oy);
		ctx.fillStyle = "#0a0c12";
		ctx.fillRect(-80, groundY + 6, level.width + 160, Math.max(level.height, 420));
		const spans = grounds
			.map((s) => ({ x: s.x, w: s.w }))
			.sort((a, b) => a.x - b.x);
		let pitX = -40;
		for (const s of spans) {
			if (s.x > pitX + 10) {
				const pit = ctx.createLinearGradient(0, groundY - 48, 0, groundY + 170);
				pit.addColorStop(0, "rgba(6,8,12,0)");
				pit.addColorStop(0.28, "rgba(6,8,12,0.62)");
				pit.addColorStop(1, "#07080c");
				ctx.fillStyle = pit;
				ctx.fillRect(pitX, groundY - 40, s.x - pitX, 260);
			}
			pitX = Math.max(pitX, s.x + s.w);
		}
		if (pitX < level.width + 40) {
			const pit = ctx.createLinearGradient(0, groundY - 48, 0, groundY + 170);
			pit.addColorStop(0, "rgba(6,8,12,0)");
			pit.addColorStop(0.28, "rgba(6,8,12,0.62)");
			pit.addColorStop(1, "#07080c");
			ctx.fillStyle = pit;
			ctx.fillRect(pitX, groundY - 40, level.width + 80 - pitX, 260);
		}
		ctx.fillStyle = "rgba(225,6,0,0.1)";
		ctx.fillRect(-40, groundY, level.width + 80, 3);
		for (const d of level.deco) {
			const img = d.kind === "suv" ? assets.suv : assets.sedan;
			const w = d.kind === "suv" ? 118 : 128;
			const h = d.kind === "suv" ? 52 : 46;
			ctx.globalAlpha = .92;
			if (!drawImg(ctx, img, d.x, d.y - h + 4, w, h, d.flip)) {
				ctx.fillStyle = "#2a2c34";
				ctx.fillRect(d.x, d.y - h + 4, w, h);
				ctx.fillStyle = "#e10600";
				ctx.fillRect(d.x + 8, d.y - h + 18, w - 16, 6);
			}
			ctx.globalAlpha = 1;
		}
		for (const t of traffic) {
			const img = t.kind === "jeepney" ? assets.jeepney : t.kind === "suv" ? assets.suv : assets.sedan;
			const flip = t.vx < 0;
			ctx.save();
			if (!lite) {
				ctx.shadowColor = "rgba(255, 210, 80, 0.45)";
				ctx.shadowBlur = 10;
			}
			if (!drawImg(ctx, img, t.x, t.y, t.w, t.h, flip)) {
				ctx.fillStyle = t.kind === "jeepney" ? "#c45c12" : "#2a2c34";
				ctx.fillRect(t.x, t.y, t.w, t.h);
				ctx.fillStyle = "#e10600";
				ctx.fillRect(t.x + 10, t.y + 16, t.w - 20, 6);
			}
			ctx.shadowBlur = 0;
			const hx = flip ? t.x + 8 : t.x + t.w - 8;
			ctx.fillStyle = "rgba(255, 220, 120, 0.35)";
			ctx.beginPath();
			ctx.moveTo(hx, t.y + t.h * 0.45);
			ctx.lineTo(hx + (flip ? -70 : 70), t.y + t.h * 0.2);
			ctx.lineTo(hx + (flip ? -70 : 70), t.y + t.h * 0.85);
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		}
		for (const s of level.solids) drawSolid(s, false);
		for (const s of level.oneWays) drawSolid(s, true);
		for (const m of movers) {
			ctx.save();
			if (!lite) {
				ctx.shadowColor = "rgba(225,6,0,0.45)";
				ctx.shadowBlur = 12;
			}
			if (!drawImg(ctx, assets.lift, m.x - 6, m.y - 8, m.w + 12, m.h + 22)) drawSolid(m, false);
			else {
				ctx.fillStyle = "#e10600";
				ctx.fillRect(m.x, m.y, m.w, 4);
				ctx.fillStyle = "#f4f4f5";
				ctx.fillRect(m.x, m.y + 4, m.w, 3);
			}
			ctx.restore();
			const moving = m.axis === "x" ? Math.cos(time * m.speed + m.phase) : Math.cos(time * m.speed + m.phase);
			const chev = time * 40 % 16;
			ctx.globalAlpha = .45;
			ctx.fillStyle = "#f4f4f5";
			if (m.axis === "x") {
				const dir = moving >= 0 ? 1 : -1;
				for (let i = 0; i < 3; i++) {
					const cx = m.x + m.w / 2 + dir * (chev + i * 10 - 16);
					const cy = m.y + 14;
					ctx.beginPath();
					ctx.moveTo(cx, cy);
					ctx.lineTo(cx - dir * 5, cy - 4);
					ctx.lineTo(cx - dir * 5, cy + 4);
					ctx.closePath();
					ctx.fill();
				}
			} else {
				const dir = moving >= 0 ? 1 : -1;
				for (let i = 0; i < 2; i++) {
					const cx = m.x + m.w / 2;
					const cy = m.y + 18 + dir * (chev * .4 + i * 8 - 8);
					ctx.beginPath();
					ctx.moveTo(cx, cy + dir * 4);
					ctx.lineTo(cx - 4, cy);
					ctx.lineTo(cx + 4, cy);
					ctx.closePath();
					ctx.fill();
				}
			}
			ctx.globalAlpha = 1;
		}
		for (let i = 0; i < level.checkpoints.length; i++) {
			const c = level.checkpoints[i];
			const on = cpOn.has(i);
			const wave = Math.sin(time * 7 + i) * .18;
			ctx.save();
			ctx.translate(c.x + 12, c.y - 40);
			ctx.rotate(wave);
			ctx.translate(-(c.x + 12), -(c.y - 40));
			if (!drawImg(ctx, assets.checkpoint, c.x - 6, c.y - 86, 40, 88)) {
				ctx.fillStyle = "#111";
				ctx.fillRect(c.x + 6, c.y - 80, 3, 80);
				ctx.fillStyle = on ? "#e10600" : "#3a3a44";
				ctx.beginPath();
				ctx.moveTo(c.x + 9, c.y - 80);
				ctx.quadraticCurveTo(c.x + 28 + Math.sin(time * 8 + i) * 6, c.y - 72, c.x + 34, c.y - 62);
				ctx.quadraticCurveTo(c.x + 22, c.y - 64, c.x + 9, c.y - 62);
				ctx.closePath();
				ctx.fill();
			}
			ctx.restore();
			if (on) {
				ctx.strokeStyle = `rgba(225,6,0,${.4 + Math.sin(time * 5) * .2})`;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.arc(c.x + 12, c.y - 50, 18 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
				ctx.stroke();
			}
		}
		const gl = level.goal;
		const gbob = Math.sin(time * 3.2) * 4;
		const nearGoal = Math.hypot(player.x - gl.x, player.y - gl.y) < 110;
		ctx.save();
		ctx.translate(gl.x + 18, gl.y - 48 + gbob);
		ctx.rotate(Math.sin(time * 6) * .1);
		ctx.scale(nearGoal ? 1.08 : 1, nearGoal ? 1.08 : 1);
		ctx.translate(-(gl.x + 18), -(gl.y - 48));
		if (!reduced && !lite) {
			ctx.shadowColor = "rgba(212,160,23,0.85)";
			ctx.shadowBlur = 18 + Math.sin(time * 5) * 6;
		}
		if (!drawImg(ctx, assets.goal, gl.x - 8, gl.y - 96, 52, 100)) {
			ctx.fillStyle = "#111";
			ctx.fillRect(gl.x + 8, gl.y - 90, 4, 90);
			ctx.fillStyle = "#f4f4f5";
			ctx.fillRect(gl.x + 12, gl.y - 90, 28, 22);
		}
		ctx.restore();
		if (nearGoal && !reduced) {
			const tick = Math.floor(time * 8);
			if (tick !== Math.floor((time - dt) * 8) && tick % 2 === 0) sparkle(gl.x + 18 + (Math.random() - .5) * 24, gl.y - 60 + gbob, 1, "#ffe08a");
		}
		for (let hi = 0; hi < level.hazards.length; hi++) {
			if (smashed.has(hi)) continue;
			const h = level.hazards[hi];
			if (h.kind === "oil") {
				const cx = h.x + h.w / 2;
				const cy = h.y + h.h / 2;
				ctx.save();
				ctx.fillStyle = "rgba(80, 40, 160, 0.35)";
				ctx.beginPath();
				ctx.ellipse(cx, cy, Math.max(1, h.w / 2), Math.max(1, h.h / 2), 0, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = "rgba(20, 10, 30, 0.85)";
				ctx.beginPath();
				ctx.ellipse(cx, cy, Math.max(1, h.w / 2 - 4), Math.max(1, h.h / 2 - 2), 0, 0, Math.PI * 2);
				ctx.fill();
				ctx.strokeStyle = `rgba(180,140,255,${.25 + Math.sin(time * 4 + h.x) * .15})`;
				ctx.lineWidth = 1.5;
				ctx.beginPath();
				ctx.ellipse(cx + Math.sin(time * 2) * 4, cy - 2, h.w / 3, h.h / 4, time, 0, Math.PI * 1.4);
				ctx.stroke();
				ctx.restore();
				continue;
			}
			ctx.save();
			const wobble = h.kind === "cone" ? Math.sin(time * 5 + h.x * .02) * .08 : 0;
			const bounce = h.kind === "cone" ? Math.abs(Math.sin(time * 3.2 + h.x * .03)) * 2.4 : 0;
			ctx.translate(h.x + h.w / 2, h.y + h.h);
			ctx.rotate(wobble);
			ctx.translate(-(h.x + h.w / 2), -(h.y + h.h) - bounce);
			ctx.shadowColor = h.kind === "cone" ? "rgba(255,120,40,0.7)" : "rgba(220,220,230,0.5)";
			ctx.shadowBlur = lite ? 0 : 12;
			const img = h.kind === "cone" ? assets.cone : assets.spikes;
			const pulse = h.kind === "spikes" ? 1 + Math.sin(time * 8) * .06 : 1;
			if (!drawImg(ctx, img, h.x - 4, h.y - 2, (h.w + 8) * pulse, (h.h + 12) * pulse)) {
				if (h.kind === "cone") {
					ctx.fillStyle = "#e24a16";
					ctx.beginPath();
					ctx.moveTo(h.x + h.w / 2, h.y);
					ctx.lineTo(h.x + h.w, h.y + h.h);
					ctx.lineTo(h.x, h.y + h.h);
					ctx.closePath();
					ctx.fill();
					ctx.fillStyle = "#f4f4f5";
					ctx.fillRect(h.x + 4, h.y + 10, h.w - 8, 3);
				} else {
					ctx.fillStyle = "#c8cad4";
					const n = Math.max(3, Math.floor(h.w / 10));
					for (let i = 0; i < n; i++) {
						const sx = h.x + (i + .5) * (h.w / n);
						ctx.beginPath();
						ctx.moveTo(sx - 5, h.y + h.h);
						ctx.lineTo(sx, h.y - Math.sin(time * 8 + i) * 2);
						ctx.lineTo(sx + 5, h.y + h.h);
						ctx.fill();
					}
				}
			}
			ctx.restore();
		}
		for (let i = 0; i < level.coins.length; i++) {
			if (coinsGot.has(i)) continue;
			const c = level.coins[i];
			const bob = Math.sin(time * 5.4 + i) * 6;
			const deal = peekDeal();
			const pulse = 0.86 + Math.abs(Math.sin(time * 4.6 + i)) * 0.18;
			ctx.save();
			ctx.translate(c.x, c.y + bob);
			if (!lite) {
				ctx.shadowColor = "rgba(212,160,23,0.85)";
				ctx.shadowBlur = 10;
			}
			paintDealCar(0, 8, deal, pulse);
			ctx.shadowBlur = 0;
			if (assets.key) drawSheet(ctx, assets.key, Math.floor(time * 10 + i) % 4, -8, -18, 16, 16);
			ctx.restore();
		}
		for (let i = 0; i < level.pesos.length; i++) {
			if (pesosGot.has(i)) continue;
			const c = level.pesos[i];
			const bob = Math.sin(time * 6.2 + i) * 5;
			const spin = Math.abs(Math.sin(time * 5.2 + i));
			ctx.save();
			ctx.translate(c.x, c.y + bob);
			ctx.scale(0.55 + spin * 0.45, 1);
			if (!lite) {
				ctx.shadowColor = "rgba(245,215,110,0.9)";
				ctx.shadowBlur = 10;
			}
			if (!drawImg(ctx, assets.peso, -11, -11, 22, 22)) {
				ctx.fillStyle = "#f5d76e";
				ctx.beginPath();
				ctx.arc(0, 0, 8, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = "#7a4a10";
				ctx.font = "700 9px 'Barlow Condensed', sans-serif";
				ctx.textAlign = "center";
				ctx.fillText("₱", 0, 3);
			}
			ctx.restore();
		}
		for (let i = 0; i < level.powerups.length; i++) {
			if (powersGot.has(i)) continue;
			const p = level.powerups[i];
			const meta = POWER_META[p.kind];
			const bob = Math.sin(time * 4.2 + i) * 5;
			ctx.save();
			ctx.translate(p.x, p.y + bob);
			ctx.rotate(Math.sin(time * 2 + i) * .08);
			ctx.shadowColor = meta.color;
			ctx.shadowBlur = lite ? 0 : 12;
			const icon =
				p.kind === "upgrade" ? assets.upgrade :
				p.kind === "release" ? assets.star :
				p.kind === "approved" ? assets.bolt :
				p.kind === "cmap" ? assets.ghost :
				p.kind === "rentown" ? assets.leaf :
				p.kind === "quota" ? assets.quota :
				p.kind === "pasalo" ? assets.pasalo :
				p.kind === "nationwide" ? assets.nationwide :
				p.kind === "replevin" ? assets.replevin :
				p.kind === "musicbox" ? assets.musicbox :
				p.kind === "elite" ? assets.elite :
				p.kind === "john" ? assets.john :
				p.kind === "fidelity" ? assets.fidelity :
				null;
			if (icon) {
				drawImg(ctx, icon, -18, -18, 36, 36);
			} else {
				ctx.fillStyle = "#141418";
				if (typeof ctx.roundRect === "function") {
					ctx.beginPath();
					ctx.roundRect(-22, -16, 44, 32, 6);
					ctx.fill();
				} else ctx.fillRect(-22, -16, 44, 32);
				ctx.strokeStyle = meta.color;
				ctx.lineWidth = 2;
				ctx.stroke();
				ctx.shadowBlur = 0;
				ctx.fillStyle = meta.color;
				ctx.font = "700 9px 'Barlow Condensed', sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(meta.tag, 0, -2);
				ctx.fillStyle = "#f4f4f5";
				ctx.font = "700 11px 'Barlow Condensed', sans-serif";
				ctx.fillText(meta.short, 0, 12);
				ctx.textAlign = "left";
			}
			ctx.restore();
		}
		for (const e of foes) {
			if (!e.alive) continue;
			drawFoe(ctx, e.kind, e.x + e.w / 2, e.y + e.h, e.facing, time + e.anim);
			ctx.fillStyle = e.kind === "repo" ? "#e10600" : e.kind === "rival" ? "#60a5fa" : "#d4a017";
			ctx.font = "700 9px 'Barlow Condensed', sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(foeTag(e.kind), e.x + e.w / 2, e.y - 4);
			ctx.textAlign = "left";
		}
		if (buff.fidelity > 0) {
			const cx = player.x + player.w / 2;
			const cy = player.y + player.h;
			ctx.save();
			ctx.strokeStyle = "rgba(201,162,39,0.7)";
			ctx.lineWidth = 2.5;
			ctx.beginPath();
			ctx.ellipse(cx, cy + 2, 62 + Math.sin(time * 6) * 3, 18, 0, 0, Math.PI * 2);
			ctx.stroke();
			ctx.strokeStyle = "rgba(30,48,90,0.55)";
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.ellipse(cx, cy + 2, 48, 13, 0, 0, Math.PI * 2);
			ctx.stroke();
			ctx.restore();
			for (let i = 0; i < GUARD_COUNT; i++) {
				const g = guardOrbit(cx, cy - 4, i, time, 58);
				drawGuard(ctx, g.x, g.y, g.facing, time);
			}
		}
		if (buff.john > 0) {
			drawBossJohn(ctx, johnX, johnY, johnFace, time, 1.18, Math.abs(player.vx) > 40);
			ctx.fillStyle = "#d4a017";
			ctx.font = "700 11px 'Barlow Condensed', sans-serif";
			ctx.textAlign = "center";
			ctx.fillText("BOSS JOHN", johnX, johnY - 54);
			ctx.textAlign = "left";
		}
		for (const m of motes) {
			ctx.globalAlpha = m.a;
			ctx.fillStyle = "#f4f4f5";
			ctx.fillRect(m.x, m.y, 2, 2);
			ctx.globalAlpha = 1;
		}
		for (const p of particles) {
			const a = Math.max(0, p.life / p.max);
			ctx.globalAlpha = a;
			ctx.fillStyle = p.color;
			if (p.kind === "dust") {
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
				ctx.fill();
			} else if (p.kind === "confetti") {
				ctx.save();
				ctx.translate(p.x, p.y);
				ctx.rotate(p.rot);
				ctx.fillRect(-p.size * .4, -p.size, p.size * .8, p.size * 1.6);
				ctx.restore();
			} else if (p.kind === "sparkle") {
				ctx.save();
				ctx.translate(p.x, p.y);
				ctx.rotate(p.rot);
				const s = p.size * (.6 + a);
				ctx.beginPath();
				ctx.moveTo(0, -s);
				ctx.lineTo(s * .28, 0);
				ctx.lineTo(0, s);
				ctx.lineTo(-s * .28, 0);
				ctx.closePath();
				ctx.fill();
				ctx.restore();
			} else ctx.fillRect(p.x, p.y, p.size, p.size);
			ctx.globalAlpha = 1;
		}
		for (const f of floaters) {
			const pop = Math.min(1, f.life * 3);
			ctx.globalAlpha = Math.min(1, f.life * 2);
			ctx.fillStyle = "#d4a017";
			ctx.font = `700 ${14 + pop * 4}px 'Barlow Condensed', sans-serif`;
			ctx.fillText(f.text, f.x - 8, f.y);
			ctx.globalAlpha = 1;
		}
		for (const r of rings) {
			const a = Math.max(0, r.life / r.max);
			ctx.strokeStyle = r.color.replace(/[\d.]+\)$/, `${a})`);
			if (!r.color.endsWith(")")) ctx.globalAlpha = a;
			ctx.lineWidth = r.w * a;
			ctx.beginPath();
			ctx.ellipse(r.x, r.y, r.r, r.r * .42, 0, 0, Math.PI * 2);
			ctx.stroke();
			ctx.globalAlpha = 1;
		}
		if (!reduced && Math.abs(player.vx) > 180 && player.grounded) {
			ctx.strokeStyle = "rgba(244,244,245,0.32)";
			ctx.lineWidth = 2;
			for (let i = 0; i < 6; i++) {
				const sx = player.x - player.facing * (14 + i * 14 + time * 80 % 12);
				const sy = player.y + 6 + i % 3 * 11;
				ctx.beginPath();
				ctx.moveTo(sx, sy);
				ctx.lineTo(sx - player.facing * 22, sy);
				ctx.stroke();
			}
		}
		for (const g of ghosts) drawJed(g, .36 * (g.life / g.max));
		drawJed();
		for (const f of flyers) {
			const a = Math.max(0, f.life / f.max);
			const grow = 0.7 + (1 - a) * 0.9;
			ctx.save();
			ctx.globalAlpha = a;
			paintDealCar(f.x, f.y + 10, { id: "fly", year: "", name: "", kind: f.suv ? "suv" : "sedan", hue: f.hue, buy: 0, sell: 0 }, grow, a);
			ctx.restore();
		}
		ctx.restore();
		if (flash > 0) {
			ctx.fillStyle = `rgba(255, 236, 230, ${Math.min(.45, flash)})`;
			ctx.fillRect(0, 0, vw, vh);
		}
		if (player.invuln > .8 && screen === "play") {
			const a = Math.min(.22, (player.invuln - .8) * .4);
			ctx.fillStyle = buff.release > 0 ? `rgba(245,215,110,${a})` : `rgba(225,6,0,${a})`;
			ctx.fillRect(0, 0, vw, vh);
		}
		if (bannerT > 0 && screen === "play") {
			const a = Math.min(1, bannerT, 1.8 - bannerT);
			ctx.globalAlpha = Math.max(0, a);
			ctx.fillStyle = "#f4f4f5";
			ctx.font = "700 28px 'Barlow Condensed', sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(banner, vw / 2, 96);
			ctx.font = "500 12px 'DM Sans', sans-serif";
			ctx.fillStyle = "#c4c4cc";
			ctx.fillText(level.kicker, vw / 2, 118);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
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
		const raw = Math.min(.05, (now - last) / 1e3);
		last = now;
		lite = reduced || raw > 0.028;
		acc += raw;
		try {
			let steps = 0;
			while (acc >= STEP && steps < 4) {
				physics(STEP);
				acc -= STEP;
				steps += 1;
			}
			if (acc >= STEP) acc = 0;
			present(STEP);
		} catch (err) {
			console.error(err);
			acc = 0;
		}
		raf = requestAnimationFrame(loop);
	}
	raf = requestAnimationFrame(loop);
	const handle: GameHandle = {
		startLevel,
		setScreen: (s: Screen) => {
			if ((s === "garage" || s === "missions" || s === "select" || s === "wardrobe") && screen !== s) {
				if (screen === "play") {
					screen = "pause";
					menuReturn = "pause";
				} else if (screen !== "garage" && screen !== "missions" && screen !== "wardrobe") {
					menuReturn = screen;
				}
			}
			screen = s;
			if (s !== "play") input.clearTouch();
			pushHud();
		},
		back: () => {
			screen = menuReturn || "title";
			input.clearTouch();
			pushHud();
		},
		pause: () => {
			if (screen === "play") {
				screen = "pause";
				input.clearTouch();
				pushHud();
			}
		},
		resume: () => {
			if (screen === "pause") {
				screen = "play";
				canvas.focus({ preventScroll: true });
				pushHud();
			}
		},
		restart: () => startLevel(levelIndex),
		destroy: () => {
			running = false;
			cancelAnimationFrame(raf);
			input.detach();
			ro.disconnect();
			if (window.__controlsTest) delete window.__controlsTest;
		},
		setTouch: (t) => applyTouch(input, t),
		equipCar: (id: string) => {
			if (!save.cars.includes(id)) return;
			save.equipped = id;
			writeSave(save);
			saveDirty = false;
			const lo = loadout();
			if (screen === "play" || screen === "pause") {
				player.airJumps = Math.max(player.airJumps, 1 + lo.extraAir);
				carArmor = Math.max(carArmor, lo.armor);
				hazFree = hazFree || lo.firstHazFree;
			}
			pushHud();
		},
		equipOutfit: (id: string) => {
			if (!save.outfits.includes(id)) return;
			save.equippedOutfit = id;
			writeSave(save);
			saveDirty = false;
			pushHud();
		},
		hud
	};
	window.__controlsTest = {
		getYaw: () => player.facing < 0 ? 1 : -1,
		getSpeed: () => Math.hypot(player.vx, player.vy),
		setKeys: (codes: string[]) => {
			input.injected = codes.length ? codes : null;
		},
		getState: () => ({
			x: player.x,
			y: player.y,
			vx: player.vx,
			vy: player.vy,
			grounded: player.grounded,
			invuln: player.invuln,
			deaths,
			screen,
			coins: coinsGot.size,
			pesos: pesosGot.size,
			clock,
			combo,
			comboMax,
		})
	};
	pushHud();
	return handle;
}


declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys?: (codes: string[]) => void;
      getState?: () => {
        x: number;
        y: number;
        vx: number;
        vy: number;
        grounded: boolean;
        invuln: number;
        deaths: number;
        screen: string;
        clock: number;
        coins: number;
        pesos?: number;
      };
    };
  }
}
