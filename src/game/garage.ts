import { LOT_COUNT, SAVE_KEY } from "./types";
import { syncOutfits } from "./outfits";

export type CarPerk = {
  tag: string;
  passive: string;
  lots: string;
  rush: string;
  survival: string;
  invaders: string;
  deal: string;
};

export type UsedCar = {
  id: string;
  year: string;
  name: string;
  kind: "sedan" | "suv";
  hint: string;
  jed: string;
  perk: CarPerk;
  hue: number;
};

export type CareerSave = {
  unlocked: number;
  best: number[];
  bestTime: number[];
  cars: string[];
  equipped: string;
  careerKeys: number;
  careerPesos: number;
  missions: string[];
  stompTotal: number;
  stars: number[];
  rushBest: number;
  survivalBest: number;
  invadersBest: number;
  dealBest: number;
  cellsBest: number;
  outfits: string[];
  equippedOutfit: string;
};

export const USED_CARS: UsedCar[] = [
  {
    id: "vios",
    year: "2018",
    name: "Toyota Vios",
    kind: "sedan",
    hint: "Starter unit. Walk in.",
    jed: "Starter unit. Walk in. Drive out.",
    perk: {
      tag: "STOCK",
      passive: "No extras. Learn the lot.",
      lots: "Stock jump. Stock run. The tutorial unit.",
      rush: "Stock lanes. One hop. No armor.",
      survival: "Jed on foot. Stomp or die.",
      invaders: "One shot. Three lives.",
      deal: "Banker plays you straight.",
    },
    hue: 0,
  },
  {
    id: "wigo",
    year: "2019",
    name: "Toyota Wigo",
    kind: "sedan",
    hint: "Collect 12 keys.",
    jed: "Wigo released. Pang-masa. Keep moving.",
    perk: {
      tag: "HATCH",
      passive: "Tiny hitbox. Snappy lanes.",
      lots: "Narrower Jed. Easier gaps.",
      rush: "Skinny unit. Instant lane snap.",
      survival: "Smaller car. Harder to tag.",
      invaders: "Moves faster on the floor.",
      deal: "Nothing extra. Just pace.",
    },
    hue: 42,
  },
  {
    id: "city",
    year: "2017",
    name: "Honda City",
    kind: "sedan",
    hint: "Collect 18 keys.",
    jed: "City unit released. Keep the line moving.",
    perk: {
      tag: "SPEED",
      passive: "Boots of Travel. Floor it.",
      lots: "+10% run. Close the lot faster.",
      rush: "Higher top speed. Outrun the crawl.",
      survival: "Faster strafe across the floor.",
      invaders: "Slide the turret quicker.",
      deal: "Banker feels the rush. +4% offer.",
    },
    hue: 28,
  },
  {
    id: "fortuner",
    year: "2016",
    name: "Toyota Fortuner",
    kind: "suv",
    hint: "Clear Malabon Showroom.",
    jed: "Fortuner is out. Dream car pa rin.",
    perk: {
      tag: "LIFT",
      passive: "Ride height. The lot is shorter.",
      lots: "+10% jump. Softer fall.",
      rush: "Longer hop. Clear the bumper.",
      survival: "High jump. Stomp from the sky.",
      invaders: "Shots fly faster.",
      deal: "Dream car tax. +6% offer.",
    },
    hue: 200,
  },
  {
    id: "civic",
    year: "2019",
    name: "Honda Civic",
    kind: "sedan",
    hint: "Bank ₱50K in deals.",
    jed: "Civic closed. Fast approval. Legit.",
    perk: {
      tag: "MAGNET",
      passive: "Greed. Keys and piso come to you.",
      lots: "Wide magnet. Keys fly in.",
      rush: "Coins from adjacent lanes.",
      survival: "Walk-in pesos pull farther.",
      invaders: "Kills bank extra quota.",
      deal: "Scout 1 case after you pick yours.",
    },
    hue: 330,
  },
  {
    id: "montero",
    year: "2015",
    name: "Montero Sport",
    kind: "suv",
    hint: "Grab 12 keys on one lot.",
    jed: "Montero Sport. Used, inspected, ready.",
    perk: {
      tag: "GRIP",
      passive: "Oil does nothing. Extra coyote.",
      lots: "Oil immune. Longer edge hang.",
      rush: "Lanes stick. No overshoot.",
      survival: "Plants on landings.",
      invaders: "Tighter tracking.",
      deal: "Steady closer. +5% offer.",
    },
    hue: 48,
  },
  {
    id: "hilux",
    year: "2018",
    name: "Toyota Hilux",
    kind: "suv",
    hint: "Clear EDSA Gauntlet.",
    jed: "Hilux released. Same-day. No bank hassle.",
    perk: {
      tag: "TRIPLE",
      passive: "Three jumps. Pickup hop.",
      lots: "Triple jump. The Hilux doesn't come down.",
      rush: "Long hop. Extra i-frames.",
      survival: "Triple jump over the horde.",
      invaders: "Faster fire. Two in the tube.",
      deal: "Workhorse respect. +5% offer.",
    },
    hue: 160,
  },
  {
    id: "innova",
    year: "2017",
    name: "Toyota Innova",
    kind: "suv",
    hint: "Clear C5 Ortigas.",
    jed: "Innova. Family unit. Nationwide ready.",
    perk: {
      tag: "FAMILY",
      passive: "One free death. Heart of Tarrasque energy.",
      lots: "Unit armor ×1. Soft jump.",
      rush: "Survive one bumper.",
      survival: "Survive one walk-in.",
      invaders: "+1 life.",
      deal: "Family closer. +8% offer.",
    },
    hue: 18,
  },
  {
    id: "ranger",
    year: "2017",
    name: "Ford Ranger",
    kind: "suv",
    hint: "Set a personal-best time.",
    jed: "Ranger on the lot. Elite Agent pace.",
    perk: {
      tag: "ARMOR",
      passive: "Vanguard. Eat one hit.",
      lots: "Unit armor ×1. Spawn invuln.",
      rush: "Survive one crash.",
      survival: "Survive one hit.",
      invaders: "Start with a shield pulse.",
      deal: "Tough unit. +6% offer.",
    },
    hue: 12,
  },
  {
    id: "everest",
    year: "2018",
    name: "Ford Everest",
    kind: "suv",
    hint: "Clear BGC High Line.",
    jed: "Everest. BGC nights. Boss energy.",
    perk: {
      tag: "BGC",
      passive: "Yasha. Speed, lift, gold.",
      lots: "+10% run, +4% jump. Piso pays more.",
      rush: "Coins worth double.",
      survival: "Faster, higher, richer stomps.",
      invaders: "Kills pay more.",
      deal: "BGC nights. +10% offer.",
    },
    hue: 210,
  },
  {
    id: "almera",
    year: "2016",
    name: "Nissan Almera",
    kind: "sedan",
    hint: "Hold 28 career keys.",
    jed: "Almera. Clean unit. Ready to release.",
    perk: {
      tag: "CLEAN",
      passive: "Ghost Scepter. First hazard is a slip.",
      lots: "First cone/oil is free. Modest magnet.",
      rush: "First graze is a warning.",
      survival: "First tag is a shove.",
      invaders: "First bullet is a graze.",
      deal: "Clean books. Scout 1 case.",
    },
    hue: 190,
  },
  {
    id: "adventure",
    year: "2015",
    name: "Nissan Adventure",
    kind: "suv",
    hint: "Clear Cubao Gateway.",
    jed: "Adventure. Cubao nights. Jeepney soul.",
    perk: {
      tag: "GRIT",
      passive: "Battle Fury. Stomp and ram.",
      lots: "Always stomp cones. Extra coyote + air.",
      rush: "Ram 1 car off the road.",
      survival: "Bumper ram walk-ins.",
      invaders: "Shots pierce one walk-in.",
      deal: "Jeepney soul. +6% offer.",
    },
    hue: 80,
  },
  {
    id: "cruiser",
    year: "2014",
    name: "Land Cruiser",
    kind: "suv",
    hint: "Clear Timog Elite Agent.",
    jed: "Land Cruiser. That's a movement.",
    perk: {
      tag: "BOSS",
      passive: "Assault. Presence. You are the traffic.",
      lots: "Speed, jump, magnet. Bigger Jed.",
      rush: "Ram 2 cars. Wide body.",
      survival: "Ram. Big cabin. Armor ×1.",
      invaders: "Dual shot.",
      deal: "That's a movement. +12% offer.",
    },
    hue: 0,
  },
  {
    id: "alphard",
    year: "2017",
    name: "Toyota Alphard",
    kind: "suv",
    hint: "Clear Clark Freeport.",
    jed: "Alphard. Nationwide. Boss Jed's pick.",
    perk: {
      tag: "ELITE",
      passive: "Butterfly. Speed, air, magnet, armor.",
      lots: "Full kit. Triple jump. Armor ×1.",
      rush: "Armor, ram 1, long hop.",
      survival: "Armor. Triple. Ram.",
      invaders: "Pierce + dual shot. +1 life.",
      deal: "Boss Jed's pick. +15% offer. Scout 1.",
    },
    hue: 270,
  },
  {
    id: "avanza",
    year: "2018",
    name: "Toyota Avanza",
    kind: "suv",
    hint: "Hold 40 career keys.",
    jed: "Avanza. Family closer. Keys in, unit out.",
    perk: {
      tag: "FAMILY+",
      passive: "Family plus magnet. Two looks at the board.",
      lots: "Armor ×1. Strong magnet. Extra coyote.",
      rush: "Armor. Adjacent coins.",
      survival: "Armor. Magnet stomps.",
      invaders: "+1 life. Extra quota on kills.",
      deal: "Scout 2 cases after you pick.",
    },
    hue: 24,
  },
  {
    id: "xpander",
    year: "2019",
    name: "Mitsubishi Xpander",
    kind: "suv",
    hint: "Clear Cebu IT Park.",
    jed: "Xpander. Cebu nights. Nationwide delivery.",
    perk: {
      tag: "BLINK",
      passive: "Blink Dagger. Air jump is a dash.",
      lots: "Air jump blinks you forward. Extra air.",
      rush: "Hop is a nitro jump.",
      survival: "Air dash. Extra jump.",
      invaders: "Fast slide. Fast fire.",
      deal: "Nationwide drop. +8% offer.",
    },
    hue: 175,
  },
  {
    id: "crv",
    year: "2017",
    name: "Honda CR-V",
    kind: "suv",
    hint: "Bank ₱150K in deals.",
    jed: "CR-V closed. Quota night paid out.",
    perk: {
      tag: "QUOTA",
      passive: "Hand of Midas. Everything pays more.",
      lots: "Jump + magnet. Piso and keys pay ×1.5.",
      rush: "Coins ×1.5. Distance pesos ×1.5.",
      survival: "Stomps pay ×1.5.",
      invaders: "Closes pay ×1.5.",
      deal: "Quota night. +20% banker offer.",
    },
    hue: 300,
  },
  {
    id: "lexus",
    year: "2016",
    name: "Lexus RX",
    kind: "suv",
    hint: "Clear Alabang Filinvest.",
    jed: "Lexus RX. South lot. Boss Jed's last unit.",
    perk: {
      tag: "NATION",
      passive: "Divine Rapier. The last unit. Slightly wide.",
      lots: "Best stats. Blink. Armor ×2. Wide Jed.",
      rush: "Armor ×2. Ram 2. Fast. Wide body.",
      survival: "Armor ×2. Ram. Triple. Blink.",
      invaders: "Pierce, dual, +1 life, fast fire.",
      deal: "Last unit. +22% offer. Scout 1.",
    },
    hue: 48,
  },
];

export const RANKS = [
  { min: 0, name: "Walk-in" },
  { min: 3, name: "Closer" },
  { min: 6, name: "Elite Agent" },
  { min: 10, name: "Unit Mover" },
  { min: 14, name: "Boss Jed's Pick" },
  { min: 18, name: "Nationwide" },
] as const;

export function carById(id: string): UsedCar | undefined {
  return USED_CARS.find((c) => c.id === id);
}

export function rankFor(save: Pick<CareerSave, "cars">): string {
  const n = save.cars.length;
  let name: string = RANKS[0].name;
  for (const r of RANKS) if (n >= r.min) name = r.name;
  return name;
}

export function emptyCareer(): CareerSave {
  return {
    unlocked: 0,
    best: Array.from({ length: LOT_COUNT }, () => 0),
    bestTime: Array.from({ length: LOT_COUNT }, () => 0),
    cars: ["vios"],
    equipped: "vios",
    careerKeys: 0,
    careerPesos: 0,
    missions: [],
    stompTotal: 0,
    stars: Array.from({ length: LOT_COUNT }, () => 0),
    rushBest: 0,
    survivalBest: 0,
    invadersBest: 0,
    dealBest: 0,
    cellsBest: 0,
    outfits: ["jacket"],
    equippedOutfit: "jacket",
  };
}

export function padLots(arr: number[] | undefined): number[] {
  const out = Array.from({ length: LOT_COUNT }, () => 0);
  if (Array.isArray(arr)) {
    for (let i = 0; i < Math.min(LOT_COUNT, arr.length); i++) out[i] = arr[i] ?? 0;
  }
  return out;
}

export function loadCareer(): CareerSave {
  const base = emptyCareer();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return base;
    const p = JSON.parse(raw) as Partial<CareerSave> & { cars?: string[] };
    const cars = Array.isArray(p.cars) && p.cars.length ? p.cars : ["vios"];
    if (!cars.includes("vios")) cars.unshift("vios");
    const loaded: CareerSave = {
      unlocked: Math.max(0, p.unlocked ?? 0),
      best: padLots(p.best),
      bestTime: padLots(p.bestTime),
      cars,
      equipped: cars.includes(p.equipped ?? "") ? (p.equipped as string) : "vios",
      careerKeys: Math.max(0, p.careerKeys ?? 0),
      careerPesos: Math.max(0, p.careerPesos ?? 0),
      missions: Array.isArray(p.missions) ? p.missions.filter((id) => typeof id === "string") : [],
      stompTotal: Math.max(0, p.stompTotal ?? 0),
      stars: padLots(p.stars),
      rushBest: Math.max(0, p.rushBest ?? 0),
      survivalBest: Math.max(0, p.survivalBest ?? 0),
      invadersBest: Math.max(0, p.invadersBest ?? 0),
      dealBest: Math.max(0, p.dealBest ?? 0),
      cellsBest: Math.max(0, (p as { cellsBest?: number }).cellsBest ?? 0),
      outfits: Array.isArray((p as { outfits?: string[] }).outfits) && (p as { outfits: string[] }).outfits.length
        ? (p as { outfits: string[] }).outfits.filter((id) => typeof id === "string")
        : ["jacket"],
      equippedOutfit: typeof (p as { equippedOutfit?: string }).equippedOutfit === "string"
        ? (p as { equippedOutfit: string }).equippedOutfit
        : "jacket",
    };
    syncOutfits(loaded);
    return loaded;
  } catch {
    return base;
  }
}

export function writeCareer(s: CareerSave) {
  try {
    syncOutfits(s);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 7, ...s }));
  } catch {
    /* ignore */
  }
}

export function isUnlocked(car: UsedCar, s: CareerSave): boolean {
  switch (car.id) {
    case "vios":
      return true;
    case "wigo":
      return s.careerKeys >= 12;
    case "city":
      return s.careerKeys >= 18;
    case "fortuner":
      return s.unlocked >= 1;
    case "civic":
      return s.careerPesos >= 50000;
    case "montero":
      return s.best.some((n) => n >= 12);
    case "hilux":
      return s.unlocked >= 2;
    case "innova":
      return s.unlocked >= 3;
    case "ranger":
      return s.bestTime.some((t) => t > 0);
    case "everest":
      return s.unlocked >= 4;
    case "almera":
      return s.careerKeys >= 28;
    case "adventure":
      return s.unlocked >= 7;
    case "cruiser":
      return s.unlocked >= 6 && (s.bestTime[5] ?? 0) > 0;
    case "alphard":
      return s.unlocked >= 8 && (s.bestTime[8] ?? 0) > 0;
    case "avanza":
      return s.careerKeys >= 40;
    case "xpander":
      return s.unlocked >= 10 && (s.bestTime[9] ?? 0) > 0;
    case "crv":
      return s.careerPesos >= 150000;
    case "lexus":
      return s.unlocked >= 11 && (s.bestTime[11] ?? 0) > 0;
    default:
      return false;
  }
}

export function freshUnlocks(s: CareerSave): UsedCar[] {
  return USED_CARS.filter((c) => !s.cars.includes(c.id) && isUnlocked(c, s));
}
