import type { EnemyDef } from "./units";

export const GAME_VERSION = "1.0.0";
export const VIEW_W = 960;
export const VIEW_H = 540;
export const LOT_COUNT = 12;

export type Rect = { x: number; y: number; w: number; h: number };

export type HazardKind = "cone" | "oil" | "spikes";
export type DecoKind = "sedan" | "suv";
export type TrafficKind = "sedan" | "suv" | "jeepney";
export type GameMode = "lots" | "rush" | "survival" | "invaders" | "deal" | "cells";
export type BgKind =
  | "showroom"
  | "edsa"
  | "ortigas"
  | "bgc"
  | "nlex"
  | "timog"
  | "cubao"
  | "makati"
  | "clark"
  | "cebu"
  | "davao"
  | "alabang";
export type PowerKind =
  | "discount"
  | "release"
  | "tank"
  | "approved"
  | "commission"
  | "warranty"
  | "upgrade"
  | "oneday"
  | "tradein"
  | "rentown"
  | "cmap"
  | "quota"
  | "pasalo"
  | "nationwide"
  | "replevin"
  | "musicbox"
  | "elite"
  | "john"
  | "fidelity";

export type MoverDef = {
  x: number;
  y: number;
  w: number;
  h: number;
  axis: "x" | "y";
  amp: number;
  speed: number;
  phase?: number;
};

export type PowerDef = { x: number; y: number; kind: PowerKind };

export type TrafficDef = {
  x: number;
  kind: TrafficKind;
  vx: number;
  min: number;
  max: number;
  ride?: boolean;
};

export type LevelDef = {
  id: string;
  name: string;
  kicker: string;
  bg: BgKind;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  solids: Rect[];
  oneWays: Rect[];
  movers: MoverDef[];
  coins: { x: number; y: number }[];
  pesos: { x: number; y: number }[];
  hazards: { x: number; y: number; w: number; h: number; kind: HazardKind }[];
  checkpoints: { x: number; y: number }[];
  goal: { x: number; y: number };
  deco: { x: number; y: number; kind: DecoKind; flip?: boolean }[];
  powerups: PowerDef[];
  traffic?: TrafficDef[];
  enemies?: EnemyDef[];
};

export type Screen = "title" | "select" | "garage" | "missions" | "wardrobe" | "play" | "pause" | "win";

export type HudBuff = { kind: PowerKind; label: string; remain: number };

export type PopupKind = PowerKind | "line" | "car" | "rank" | "keys" | "mission";

export type HudPopup = {
  id: number;
  title: string;
  copy: string;
  kind: PopupKind;
  jed: boolean;
};

export type HudMission = {
  id: string;
  title: string;
  copy: string;
  progress: number;
  target: number;
  done: boolean;
  reward: string;
};

export type HudState = {
  screen: Screen;
  levelIndex: number;
  levelName: string;
  kicker: string;
  coins: number;
  totalCoins: number;
  pesoCoins: number;
  totalPesoCoins: number;
  deaths: number;
  hasCheckpoint: boolean;
  unlocked: number;
  best: number[];
  bestTime: number[];
  banner: string;
  progress: number;
  clock: number;
  record: boolean;
  pesos: number;
  warranty: boolean;
  grow: boolean;
  buffs: HudBuff[];
  popup: HudPopup | null;
  cars: string[];
  equipped: string;
  rank: string;
  careerKeys: number;
  careerPesos: number;
  missions: HudMission[];
  missionsDone: number;
  missionsTotal: number;
  missionHint: string;
  stompLot: number;
  mode: GameMode;
  stars: number[];
  rushBest: number;
  survivalBest: number;
  invadersBest: number;
  dealBest: number;
  cellsBest: number;
  score: number;
  wave: number;
  padAction: "Jump" | "Hop" | "Fire" | "Pick" | "Slash";
  padExtra: "Slash" | null;
  outfits: string[];
  equippedOutfit: string;
  combo: number;
  comboMax: number;
  comboHeat: number;
  dealName: string;
  dealBuy: number;
  dealSell: number;
  dealProfit: number;
};

export type GameHandle = {
  startLevel: (i: number) => void;
  setScreen: (s: Screen) => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  destroy: () => void;
  setTouch: (t: { left?: boolean; right?: boolean; jump?: boolean; slash?: boolean; up?: boolean; down?: boolean; analogX?: number }) => void;
  equipCar: (id: string) => void;
  equipOutfit: (id: string) => void;
  back: () => void;
  hud: () => HudState;
};

export const SAVE_KEY = "mcars-ph-sdr-v1";

export const POWER_META: Record<
  PowerKind,
  { title: string; copy: string; tag: string; color: string; dur: number; pesos: number; short: string }
> = {
  discount: {
    title: "₱50,000 DISCOUNT",
    copy: "Limited time only. Keys fly to you.",
    tag: "MAGNET",
    color: "#d4a017",
    dur: 8,
    pesos: 50000,
    short: "₱50K",
  },
  release: {
    title: "SAME-DAY RELEASE",
    copy: "Iuwi mo na 'yan. Star-mode. Nothing stops the line.",
    tag: "STAR",
    color: "#f5d76e",
    dur: 7.5,
    pesos: 0,
    short: "SDR",
  },
  tank: {
    title: "FREE FULL TANK",
    copy: "May kasama pang free full tank 'yan.",
    tag: "TRIPLE",
    color: "#4ade80",
    dur: 9,
    pesos: 8000,
    short: "TANK",
  },
  approved: {
    title: "NO BANK APPROVAL",
    copy: "Hassle-free. 30 minutes to one hour. Floor it.",
    tag: "SPEED",
    color: "#60a5fa",
    dur: 6.5,
    pesos: 0,
    short: "NBA",
  },
  commission: {
    title: "₱100K COMMISSION",
    copy: "Elite Agent. Same-day payout. Zero capital.",
    tag: "PAYOUT",
    color: "#f59e0b",
    dur: 0,
    pesos: 100000,
    short: "₱100K",
  },
  warranty: {
    title: "LIFETIME WARRANTY",
    copy: "Drive home with confidence. One free save.",
    tag: "SAVE",
    color: "#f4f4f5",
    dur: 0,
    pesos: 0,
    short: "SAVE",
  },
  upgrade: {
    title: "UPGRADE UNIT",
    copy: "Trade up. Bigger Jed. Stomp cones. Dream car energy.",
    tag: "GROW",
    color: "#ef4444",
    dur: 0,
    pesos: 0,
    short: "UP",
  },
  oneday: {
    title: "1-DAY PROCESS",
    copy: "Apply. Approve. Release. Burst down the lot.",
    tag: "DASH",
    color: "#fb7185",
    dur: 5,
    pesos: 0,
    short: "1DAY",
  },
  tradein: {
    title: "TRADE-IN",
    copy: "Old unit out. New unit in. Stomp the cones.",
    tag: "STOMP",
    color: "#c4b5fd",
    dur: 10,
    pesos: 12000,
    short: "IN",
  },
  rentown: {
    title: "RENT-TO-OWN",
    copy: "Drive now. Own later. Float the payments.",
    tag: "FLOAT",
    color: "#4ade80",
    dur: 8,
    pesos: 0,
    short: "RTO",
  },
  cmap: {
    title: "CMAP ACCEPTED",
    copy: "May CMAP ka ba? Phase through cones. We got you.",
    tag: "PHASE",
    color: "#a78bfa",
    dur: 7,
    pesos: 0,
    short: "CMAP",
  },
  quota: {
    title: "QUOTA NIGHT",
    copy: "Double the deals. Elite Agent energy.",
    tag: "x2",
    color: "#fbbf24",
    dur: 9,
    pesos: 0,
    short: "x2",
  },
  pasalo: {
    title: "ASSUME PASALO",
    copy: "Balance in. Extra jump. Keys come to you.",
    tag: "ASSUME",
    color: "#fb923c",
    dur: 8,
    pesos: 0,
    short: "PASALO",
  },
  nationwide: {
    title: "NATIONWIDE DELIVERY",
    copy: "Door to door. Blink down the lot.",
    tag: "BLINK",
    color: "#38bdf8",
    dur: 6.5,
    pesos: 0,
    short: "NATION",
  },
  replevin: {
    title: "REPLEVIN ACCEPTED",
    copy: "Repo energy. Bounce the cones. Bounce the oil.",
    tag: "BOUNCE",
    color: "#c084fc",
    dur: 8,
    pesos: 0,
    short: "REPO",
  },
  musicbox: {
    title: "MUSIC BOX TIMOG",
    copy: "Quota night anthem. Keys and piso fly in.",
    tag: "JAM",
    color: "#f472b6",
    dur: 8.5,
    pesos: 0,
    short: "JAM",
  },
  elite: {
    title: "ELITE AGENT",
    copy: "Same-day payout. Super jump. Close like Jed.",
    tag: "SUPER",
    color: "#f5d76e",
    dur: 8,
    pesos: 0,
    short: "ELITE",
  },
  john: {
    title: "SUMMON BOSS JOHN",
    copy: "The closer walks in. He stomps the lot with you.",
    tag: "JOHN",
    color: "#d4a017",
    dur: 12,
    pesos: 0,
    short: "JOHN",
  },
  fidelity: {
    title: "FIDELITY SECURITY",
    copy: "Boss John's invincibility. Terracotta guards lock the ring.",
    tag: "SECURE",
    color: "#c9a227",
    dur: 9,
    pesos: 0,
    short: "FID",
  },
};

export const POWER_ICON: Record<PowerKind, string> = {
  discount: "/sprites/powers/discount.png",
  release: "/sprites/powers/release.png",
  tank: "/sprites/powers/tank.png",
  approved: "/sprites/powers/approved.png",
  commission: "/sprites/powers/commission.png",
  warranty: "/sprites/powers/warranty.png",
  upgrade: "/sprites/powers/upgrade.png",
  oneday: "/sprites/powers/oneday.png",
  tradein: "/sprites/powers/tradein.png",
  rentown: "/sprites/powers/rentown.png",
  cmap: "/sprites/powers/cmap.png",
  quota: "/sprites/powers/quota.png",
  pasalo: "/sprites/powers/pasalo.png",
  nationwide: "/sprites/powers/nationwide.png",
  replevin: "/sprites/powers/replevin.png",
  musicbox: "/sprites/powers/musicbox.png",
  elite: "/sprites/powers/elite.png",
  john: "/sprites/powers/john.jpg",
  fidelity: "/sprites/powers/fidelity.jpg",
};

export const JED_SHOT = {
  close: "/jed-face.png",
  point: "/jed/jed-point.png",
  stage: "/jed/jed-stage.png",
} as const;

export function isPowerKind(k: string): k is PowerKind {
  return Object.prototype.hasOwnProperty.call(POWER_ICON, k);
}

export function formatTime(sec: number, dashEmpty = false) {
  if (dashEmpty && (!Number.isFinite(sec) || sec <= 0)) return "—";
  const t = Math.max(0, Number.isFinite(sec) ? sec : 0);
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}

export function formatPesos(n: number) {
  const t = Math.max(0, Math.round(n));
  if (t >= 1000000) return `₱${(t / 1000000).toFixed(t % 1000000 ? 1 : 0)}M`;
  if (t >= 1000) return `₱${Math.round(t / 1000)}K`;
  return `₱${t}`;
}

export function formatKm(px: number) {
  const km = Math.max(0, px) / 1000;
  return `${km.toFixed(2)} km`;
}
