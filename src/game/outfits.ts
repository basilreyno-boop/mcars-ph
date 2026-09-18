import type { CareerSave } from "./garage";
import { JED_SHOT } from "./types";

export type OutfitId =
  | "jacket"
  | "polo"
  | "stage"
  | "closer"
  | "stealth"
  | "elite"
  | "sunday"
  | "night";

export type OutfitPal = {
  jacket: string;
  jacketDark: string;
  stripe: string;
  pants: string;
  shoes: string;
  shoeMark: string;
  skin: string;
  skinDeep: string;
  hair: string;
  chain: boolean;
  shades: boolean;
  letter: string;
};

export type Outfit = {
  id: OutfitId;
  name: string;
  tag: string;
  hint: string;
  jed: string;
  shot: keyof typeof JED_SHOT;
  filter: string;
  pal: OutfitPal;
};

const SKIN = "#c48a5c";
const SKIN_DEEP = "#a56c44";
const HAIR = "#121214";

export const OUTFITS: Outfit[] = [
  {
    id: "jacket",
    name: "Red Jacket",
    tag: "STOCK",
    hint: "Walk in wearing this.",
    jed: "Red jacket. Silver chain. Same-day energy.",
    shot: "close",
    filter: "",
    pal: {
      jacket: "#e10600",
      jacketDark: "#b01210",
      stripe: "#f4f4f5",
      pants: "#16161c",
      shoes: "#f4f4f5",
      shoeMark: "#e10600",
      skin: SKIN,
      skinDeep: SKIN_DEEP,
      hair: HAIR,
      chain: true,
      shades: false,
      letter: "M",
    },
  },
  {
    id: "polo",
    name: "Docuseries Polo",
    tag: "POLO",
    hint: "Clear 1 lot.",
    jed: "White polo. Pointing at the board. That's the close.",
    shot: "point",
    filter: "",
    pal: {
      jacket: "#f4f4f5",
      jacketDark: "#d4d4d8",
      stripe: "#e10600",
      pants: "#1c2740",
      shoes: "#111114",
      shoeMark: "#d4a017",
      skin: SKIN,
      skinDeep: SKIN_DEEP,
      hair: HAIR,
      chain: false,
      shades: false,
      letter: "",
    },
  },
  {
    id: "stage",
    name: "Music Box Black",
    tag: "STAGE",
    hint: "Clear 3 lots.",
    jed: "Black shirt. Music Box Timog. Quota night.",
    shot: "stage",
    filter: "contrast(1.08) saturate(0.92)",
    pal: {
      jacket: "#1a1a1e",
      jacketDark: "#0c0c0e",
      stripe: "#d4a017",
      pants: "#111114",
      shoes: "#d4a017",
      shoeMark: "#1a1a1e",
      skin: SKIN,
      skinDeep: SKIN_DEEP,
      hair: HAIR,
      chain: true,
      shades: false,
      letter: "",
    },
  },
  {
    id: "closer",
    name: "Closer Fit",
    tag: "CLOSE",
    hint: "Bank ₱100K.",
    jed: "Shades on. Chain out. If they sit, we close.",
    shot: "close",
    filter: "contrast(1.12) saturate(1.15)",
    pal: {
      jacket: "#c01410",
      jacketDark: "#7a0c0c",
      stripe: "#d4a017",
      pants: "#111114",
      shoes: "#f4f4f5",
      shoeMark: "#d4a017",
      skin: SKIN,
      skinDeep: SKIN_DEEP,
      hair: HAIR,
      chain: true,
      shades: true,
      letter: "M",
    },
  },
  {
    id: "stealth",
    name: "Night Repo",
    tag: "REPO",
    hint: "Clear 4 lots.",
    jed: "Replevin hours. Dark lot. Don't get seen.",
    shot: "stage",
    filter: "hue-rotate(250deg) saturate(0.7) brightness(0.92)",
    pal: {
      jacket: "#1c1524",
      jacketDark: "#120e18",
      stripe: "#a78bfa",
      pants: "#121018",
      shoes: "#a78bfa",
      shoeMark: "#1c1524",
      skin: SKIN,
      skinDeep: SKIN_DEEP,
      hair: HAIR,
      chain: false,
      shades: true,
      letter: "R",
    },
  },
  {
    id: "elite",
    name: "Elite Gold",
    tag: "ELITE",
    hint: "Unlock 8 units.",
    jed: "Elite Agent. Same-day payout. Gold on the lot.",
    shot: "close",
    filter: "sepia(0.45) saturate(1.35) hue-rotate(-8deg)",
    pal: {
      jacket: "#d4a017",
      jacketDark: "#9a7510",
      stripe: "#f4f4f5",
      pants: "#1a1408",
      shoes: "#f4f4f5",
      shoeMark: "#d4a017",
      skin: SKIN,
      skinDeep: SKIN_DEEP,
      hair: HAIR,
      chain: true,
      shades: false,
      letter: "E",
    },
  },
  {
    id: "sunday",
    name: "Sunday Barong",
    tag: "FORMAL",
    hint: "Clear 6 lots.",
    jed: "Barong energy. Formal close. Nationwide delivery.",
    shot: "point",
    filter: "saturate(0.85) brightness(1.08)",
    pal: {
      jacket: "#efe6d4",
      jacketDark: "#d4c4a8",
      stripe: "#d4a017",
      pants: "#2a2418",
      shoes: "#1a140c",
      shoeMark: "#efe6d4",
      skin: SKIN,
      skinDeep: SKIN_DEEP,
      hair: HAIR,
      chain: false,
      shades: false,
      letter: "",
    },
  },
  {
    id: "night",
    name: "Quota Night",
    tag: "Q4",
    hint: "Score 500 in Replevin Cells, or clear 2 lots.",
    jed: "Last quarter. Neon. Don't drop the clipboard.",
    shot: "stage",
    filter: "contrast(1.2) saturate(1.25)",
    pal: {
      jacket: "#0c0c10",
      jacketDark: "#050506",
      stripe: "#e10600",
      pants: "#e10600",
      shoes: "#f4f4f5",
      shoeMark: "#e10600",
      skin: SKIN,
      skinDeep: SKIN_DEEP,
      hair: HAIR,
      chain: true,
      shades: true,
      letter: "Q",
    },
  },
];

export function outfitById(id: string | undefined): Outfit {
  return OUTFITS.find((o) => o.id === id) ?? OUTFITS[0];
}

export function isOutfitUnlocked(o: Outfit, s: CareerSave): boolean {
  const lots = s.bestTime.filter((t) => t > 0).length;
  switch (o.id) {
    case "jacket":
      return true;
    case "polo":
      return lots >= 1 || s.careerKeys >= 12;
    case "stage":
      return lots >= 3;
    case "closer":
      return s.careerPesos >= 100000;
    case "stealth":
      return lots >= 4;
    case "elite":
      return s.cars.length >= 8;
    case "sunday":
      return lots >= 6;
    case "night":
      return s.cellsBest >= 500 || lots >= 2;
    default:
      return false;
  }
}

export function syncOutfits(s: CareerSave) {
  if (!Array.isArray(s.outfits) || !s.outfits.length) s.outfits = ["jacket"];
  if (!s.outfits.includes("jacket")) s.outfits.unshift("jacket");
  for (const o of OUTFITS) {
    if (!s.outfits.includes(o.id) && isOutfitUnlocked(o, s)) s.outfits.push(o.id);
  }
  if (!s.outfits.includes(s.equippedOutfit)) s.equippedOutfit = "jacket";
}

export function freshOutfitUnlocks(s: CareerSave): Outfit[] {
  return OUTFITS.filter((o) => !s.outfits.includes(o.id) && isOutfitUnlocked(o, s));
}

export function portraitFor(o: Outfit): string {
  return JED_SHOT[o.shot];
}
