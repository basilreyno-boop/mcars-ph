import type { CareerSave } from "./garage";
import { LEVELS } from "./levels";
import { formatPesos, type HudMission } from "./types";

export type MissionKind =
  | "win"
  | "clean"
  | "keys"
  | "coins"
  | "time"
  | "stomp"
  | "powers"
  | "bank"
  | "careerKeys"
  | "cars"
  | "lots"
  | "star"
  | "grow"
  | "blink"
  | "bounce"
  | "jam"
  | "elite"
  | "john"
  | "fidelity"
  | "rush"
  | "survive"
  | "invaders"
  | "deal"
  | "cells"
  | "combo";

export type MissionDef = {
  id: string;
  title: string;
  copy: string;
  kind: MissionKind;
  target: number;
  lot?: number;
  rewardPesos: number;
  rewardKeys?: number;
};

export type MissionSnap = {
  levelIndex: number;
  keys: number;
  totalKeys: number;
  coins: number;
  totalCoins: number;
  deaths: number;
  clock: number;
  stomps: number;
  powers: number;
  won: boolean;
  grabbedStar: boolean;
  grabbedGrow: boolean;
  grabbedNation: boolean;
  grabbedReplevin: boolean;
  grabbedMusic: boolean;
  grabbedElite: boolean;
  grabbedJohn?: boolean;
  grabbedFidelity?: boolean;
  comboMax?: number;
  save: CareerSave;
};

function lot(i: number, kind: MissionKind, title: string, copy: string, target: number, pesos: number): MissionDef {
  return { id: `${LEVELS[i]?.id ?? i}-${kind}`, title, copy, kind, target, lot: i, rewardPesos: pesos };
}

export const MISSIONS: MissionDef[] = [
  { id: "first-release", title: "Walk in. Drive out.", copy: "Clear any lot. First unit of the quarter.", kind: "win", target: 1, rewardPesos: 20000, rewardKeys: 1 },
  { id: "clean-any", title: "No-fall closer", copy: "Clear any lot without a fall.", kind: "clean", target: 1, rewardPesos: 25000 },
  { id: "speed-any", title: "Same-day pace", copy: "Clear any lot under 80 seconds.", kind: "time", target: 80, rewardPesos: 20000 },
  { id: "combo-4", title: "×4 close", copy: "Chain four keys into units on one lot.", kind: "combo", target: 4, rewardPesos: 18000 },
  { id: "combo-8", title: "×8 quota chain", copy: "Hold an eight-key combo. Don't drop the line.", kind: "combo", target: 8, rewardPesos: 35000, rewardKeys: 2 },
  { id: "coin-hog", title: "Piso rain", copy: "Bank 14 peso coins on one lot.", kind: "coins", target: 14, rewardPesos: 12000 },
  { id: "power-tour", title: "Full menu", copy: "Grab 5 power-ups on one lot.", kind: "powers", target: 5, rewardPesos: 15000 },
  { id: "star-grab", title: "Iuwi mo na 'yan", copy: "Pick up Same-Day Release.", kind: "star", target: 1, rewardPesos: 8000 },
  { id: "grow-grab", title: "Upgrade unit", copy: "Grab the toadstool and grow.", kind: "grow", target: 1, rewardPesos: 8000 },
  { id: "blink-grab", title: "Nationwide blink", copy: "Grab Nationwide Delivery.", kind: "blink", target: 1, rewardPesos: 10000 },
  { id: "bounce-grab", title: "Replevin bounce", copy: "Grab Replevin Accepted.", kind: "bounce", target: 1, rewardPesos: 10000 },
  { id: "jam-grab", title: "Music Box jam", copy: "Grab the Timog Music Box.", kind: "jam", target: 1, rewardPesos: 10000 },
  { id: "elite-grab", title: "Elite Agent badge", copy: "Grab the Elite Agent super jump.", kind: "elite", target: 1, rewardPesos: 12000 },
  { id: "john-grab", title: "Summon Boss John", copy: "Call the closer. Let him walk the lot.", kind: "john", target: 1, rewardPesos: 18000 },
  { id: "fidelity-grab", title: "Fidelity Security", copy: "Take Boss John's invincibility ring.", kind: "fidelity", target: 1, rewardPesos: 18000 },
  { id: "stomp-6", title: "Trade-in six", copy: "Stomp 6 cones in your career.", kind: "stomp", target: 6, rewardPesos: 12000 },
  { id: "stomp-16", title: "Lot sweeper", copy: "Stomp 16 cones career-wide.", kind: "stomp", target: 16, rewardPesos: 20000 },
  { id: "stomp-30", title: "Repo thirty", copy: "Stomp 30 cones career-wide.", kind: "stomp", target: 30, rewardPesos: 35000 },
  { id: "bank-100", title: "₱100K closer", copy: "Bank ₱100K in career deals.", kind: "bank", target: 100000, rewardPesos: 15000 },
  { id: "bank-250", title: "Quota night", copy: "Bank ₱250K in career deals.", kind: "bank", target: 250000, rewardPesos: 30000 },
  { id: "bank-500", title: "Half-million", copy: "Bank ₱500K in career deals.", kind: "bank", target: 500000, rewardPesos: 50000, rewardKeys: 3 },
  { id: "keys-16", title: "Sixteen keys", copy: "Hold 16 career keys.", kind: "careerKeys", target: 16, rewardPesos: 10000 },
  { id: "keys-32", title: "Key vault", copy: "Hold 32 career keys.", kind: "careerKeys", target: 32, rewardPesos: 20000 },
  { id: "keys-48", title: "Forty-eight keys", copy: "Hold 48 career keys.", kind: "careerKeys", target: 48, rewardPesos: 28000 },
  { id: "cars-4", title: "Four units", copy: "Unlock 4 used cars.", kind: "cars", target: 4, rewardPesos: 15000 },
  { id: "cars-8", title: "Elite garage", copy: "Unlock 8 used cars.", kind: "cars", target: 8, rewardPesos: 25000 },
  { id: "cars-14", title: "Fourteen units", copy: "Unlock 14 used cars.", kind: "cars", target: 14, rewardPesos: 40000 },
  { id: "cars-18", title: "Full used lot", copy: "Unlock every used car.", kind: "cars", target: 18, rewardPesos: 80000, rewardKeys: 5 },
  { id: "lots-3", title: "Three lots", copy: "Clear 3 different lots.", kind: "lots", target: 3, rewardPesos: 20000 },
  { id: "lots-6", title: "Metro sweep", copy: "Clear 6 lots.", kind: "lots", target: 6, rewardPesos: 35000 },
  { id: "lots-9", title: "North to Clark", copy: "Clear 9 lots.", kind: "lots", target: 9, rewardPesos: 50000 },
  { id: "lots-all", title: "Nationwide", copy: "Clear every lot on the board.", kind: "lots", target: 12, rewardPesos: 100000, rewardKeys: 8 },
  lot(0, "keys", "Malabon key hunt", "Grab 10 keys in the showroom.", 10, 12000),
  lot(0, "clean", "Malabon clean", "Clear Malabon with zero falls.", 1, 18000),
  lot(1, "keys", "EDSA key hunt", "Grab 10 keys on the gauntlet.", 10, 14000),
  lot(1, "time", "Beat the rush", "Clear EDSA under 95 seconds.", 95, 18000),
  lot(2, "keys", "C5 key hunt", "Grab 12 keys over Ortigas.", 12, 14000),
  lot(2, "clean", "C5 clean", "Clear C5 with zero falls.", 1, 20000),
  lot(3, "coins", "BGC piso night", "Bank 16 peso coins on High Line.", 16, 14000),
  lot(3, "time", "BGC flyer", "Clear BGC under 100 seconds.", 100, 20000),
  lot(4, "keys", "NLEX key hunt", "Grab 12 keys on nationwide.", 12, 15000),
  lot(4, "stomp", "Highway trade-ins", "Stomp 4 cones on NLEX.", 4, 12000),
  lot(5, "powers", "Timog full menu", "Grab 6 power-ups on quota night.", 6, 18000),
  lot(5, "clean", "Music Box clean", "Clear Timog with zero falls.", 1, 25000),
  lot(6, "keys", "Cubao key hunt", "Grab 12 keys in Cubao.", 12, 15000),
  lot(6, "coins", "Gateway piso", "Bank 16 peso coins in Cubao.", 16, 14000),
  lot(7, "clean", "Makati clean", "Clear Ayala with zero falls.", 1, 25000),
  lot(7, "time", "Ayala flyer", "Clear Makati under 110 seconds.", 110, 22000),
  lot(8, "keys", "Clark key hunt", "Grab 14 keys at Clark.", 14, 18000),
  lot(8, "clean", "Freeport clean", "Clear Clark with zero falls.", 1, 30000),
  lot(9, "keys", "Cebu key hunt", "Grab 14 keys at IT Park.", 14, 18000),
  lot(9, "time", "Cebu flyer", "Clear Cebu under 115 seconds.", 115, 22000),
  lot(9, "clean", "IT Park clean", "Clear Cebu with zero falls.", 1, 30000),
  lot(10, "keys", "Davao key hunt", "Grab 14 keys on Roxas.", 14, 18000),
  lot(10, "coins", "Davao piso", "Bank 18 peso coins in Davao.", 18, 16000),
  lot(10, "clean", "Roxas clean", "Clear Davao with zero falls.", 1, 32000),
  lot(11, "powers", "Alabang full menu", "Grab 7 power-ups in Filinvest.", 7, 22000),
  lot(11, "time", "South flyer", "Clear Alabang under 120 seconds.", 120, 25000),
  lot(11, "clean", "Filinvest clean", "Clear Alabang with zero falls.", 1, 35000),
  { id: "rush-2k", title: "EDSA 2km", copy: "Drive 2km in EDSA Rush.", kind: "rush", target: 2000, rewardPesos: 20000 },
  { id: "survive-45", title: "Last 45", copy: "Survive 45 seconds on the lot.", kind: "survive", target: 45, rewardPesos: 20000 },
  { id: "invaders-800", title: "800 closes", copy: "Score 800 in Quota Invaders.", kind: "invaders", target: 800, rewardPesos: 20000 },
  { id: "deal-250", title: "Banker's 250", copy: "Walk out of Jed's Deal with ₱250K.", kind: "deal", target: 250000, rewardPesos: 25000 },
  { id: "cells-800", title: "First replevin", copy: "Score 800 in Replevin Cells.", kind: "cells", target: 800, rewardPesos: 20000 },
  { id: "cells-2k", title: "Repo two-K", copy: "Score 2,000 in one Replevin Cells run.", kind: "cells", target: 2000, rewardPesos: 35000, rewardKeys: 2 },
];

export function missionCur(m: MissionDef, snap: MissionSnap): number {
  const lotOk = m.lot === undefined || m.lot === snap.levelIndex;
  switch (m.kind) {
    case "win":
      return snap.save.bestTime.filter((t) => t > 0).length;
    case "clean":
      if (m.lot !== undefined) return snap.won && snap.deaths === 0 && lotOk ? 1 : 0;
      return snap.won && snap.deaths === 0 ? 1 : 0;
    case "keys":
      if (!lotOk) return 0;
      return m.target === 99 ? (snap.keys >= snap.totalKeys && snap.totalKeys > 0 ? snap.totalKeys : snap.keys) : snap.keys;
    case "coins":
      return lotOk ? snap.coins : 0;
    case "time":
      if (!snap.won || !lotOk) return 0;
      return snap.clock <= m.target ? m.target : 0;
    case "stomp":
      if (m.lot !== undefined) return lotOk ? snap.stomps : 0;
      return snap.save.stompTotal;
    case "powers":
      return lotOk ? snap.powers : 0;
    case "bank":
      return snap.save.careerPesos;
    case "careerKeys":
      return snap.save.careerKeys;
    case "cars":
      return snap.save.cars.length;
    case "lots":
      return snap.save.bestTime.filter((t) => t > 0).length;
    case "star":
      return snap.grabbedStar ? 1 : 0;
    case "grow":
      return snap.grabbedGrow ? 1 : 0;
    case "blink":
      return snap.grabbedNation ? 1 : 0;
    case "bounce":
      return snap.grabbedReplevin ? 1 : 0;
    case "jam":
      return snap.grabbedMusic ? 1 : 0;
    case "elite":
      return snap.grabbedElite ? 1 : 0;
    case "john":
      return snap.grabbedJohn ? 1 : 0;
    case "fidelity":
      return snap.grabbedFidelity ? 1 : 0;
    case "rush":
      return snap.save.rushBest;
    case "survive":
      return snap.save.survivalBest;
    case "invaders":
      return snap.save.invadersBest;
    case "deal":
      return snap.save.dealBest;
    case "cells":
      return snap.save.cellsBest;
    case "combo":
      return snap.comboMax ?? 0;
    default:
      return 0;
  }
}

export function missionMet(m: MissionDef, snap: MissionSnap): boolean {
  if (m.lot !== undefined && m.lot !== snap.levelIndex) return false;
  if ((m.kind === "win" || m.kind === "clean" || m.kind === "time") && !snap.won) return false;
  if (m.kind === "keys" && m.target === 99) return snap.won && snap.keys >= snap.totalKeys && snap.totalKeys > 0;
  if (m.kind === "time") return snap.won && snap.clock > 0 && snap.clock <= m.target;
  return missionCur(m, snap) >= m.target;
}

export function rewardLabel(m: MissionDef): string {
  const extra = m.rewardKeys ? ` · +${m.rewardKeys} keys` : "";
  return `${formatPesos(m.rewardPesos)}${extra}`;
}

export function toHudMission(m: MissionDef, snap: MissionSnap, done: boolean): HudMission {
  const target = m.kind === "keys" && m.target === 99 ? Math.max(1, snap.totalKeys) : m.target;
  const progress = done ? target : Math.min(target, missionCur(m, snap));
  return {
    id: m.id,
    title: m.title,
    copy: m.copy,
    progress,
    target,
    done,
    reward: rewardLabel(m),
  };
}

export function listMissions(snap: MissionSnap): HudMission[] {
  const done = new Set(snap.save.missions);
  return MISSIONS.map((m) => toHudMission(m, snap, done.has(m.id)));
}

export function missionHint(snap: MissionSnap): string {
  const done = new Set(snap.save.missions);
  const local = MISSIONS.find((m) => m.lot === snap.levelIndex && !done.has(m.id));
  if (local) {
    const h = toHudMission(local, snap, false);
    return `${h.title} · ${h.progress}/${h.target}`;
  }
  const next = MISSIONS.find((m) => !done.has(m.id));
  if (!next) return "Quota closed. Nationwide.";
  const h = toHudMission(next, snap, false);
  return `${h.title} · ${h.progress}/${h.target}`;
}

export function featuredMission(): MissionDef {
  const d = new Date();
  const i = (d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate()) % MISSIONS.length;
  return MISSIONS[i];
}

export const MISSION_COUNT = MISSIONS.length;

export function awardMissions(save: CareerSave) {
  const snap: MissionSnap = {
    levelIndex: 0,
    keys: 0,
    totalKeys: 1,
    coins: 0,
    totalCoins: 1,
    deaths: 0,
    clock: 0,
    stomps: 0,
    powers: 0,
    won: false,
    grabbedStar: false,
    grabbedGrow: false,
    grabbedNation: false,
    grabbedReplevin: false,
    grabbedMusic: false,
    grabbedElite: false,
    save,
  };
  let n = 0;
  for (const m of MISSIONS) {
    if (save.missions.includes(m.id)) continue;
    if (!missionMet(m, snap)) continue;
    save.missions.push(m.id);
    save.careerPesos += m.rewardPesos;
    if (m.rewardKeys) save.careerKeys += m.rewardKeys;
    n += 1;
  }
  return n;
}
