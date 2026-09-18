export type FlipDeal = {
  id: string;
  year: string;
  name: string;
  kind: "sedan" | "suv";
  hue: number;
  buy: number;
  sell: number;
};

/** Ladder of units that pop as the key combo climbs. */
export const FLIP_LADDER: FlipDeal[] = [
  { id: "wigo", year: "2019", name: "Wigo", kind: "sedan", hue: 42, buy: 185000, sell: 248000 },
  { id: "vios", year: "2018", name: "Vios", kind: "sedan", hue: 0, buy: 268000, sell: 348000 },
  { id: "almera", year: "2016", name: "Almera", kind: "sedan", hue: 190, buy: 295000, sell: 390000 },
  { id: "city", year: "2017", name: "City", kind: "sedan", hue: 28, buy: 385000, sell: 498000 },
  { id: "avanza", year: "2018", name: "Avanza", kind: "suv", hue: 24, buy: 480000, sell: 640000 },
  { id: "civic", year: "2019", name: "Civic", kind: "sedan", hue: 330, buy: 520000, sell: 680000 },
  { id: "innova", year: "2017", name: "Innova", kind: "suv", hue: 18, buy: 650000, sell: 860000 },
  { id: "xpander", year: "2019", name: "Xpander", kind: "suv", hue: 175, buy: 720000, sell: 980000 },
  { id: "fortuner", year: "2016", name: "Fortuner", kind: "suv", hue: 200, buy: 780000, sell: 1050000 },
  { id: "hilux", year: "2018", name: "Hilux", kind: "suv", hue: 160, buy: 820000, sell: 1120000 },
  { id: "montero", year: "2015", name: "Montero", kind: "suv", hue: 48, buy: 890000, sell: 1180000 },
  { id: "ranger", year: "2017", name: "Ranger", kind: "suv", hue: 12, buy: 920000, sell: 1250000 },
  { id: "everest", year: "2018", name: "Everest", kind: "suv", hue: 210, buy: 1050000, sell: 1420000 },
  { id: "crv", year: "2017", name: "CR-V", kind: "suv", hue: 300, buy: 980000, sell: 1350000 },
  { id: "adventure", year: "2015", name: "Adventure", kind: "suv", hue: 80, buy: 280000, sell: 410000 },
  { id: "alphard", year: "2017", name: "Alphard", kind: "suv", hue: 270, buy: 1600000, sell: 2200000 },
  { id: "cruiser", year: "2014", name: "Cruiser", kind: "suv", hue: 0, buy: 1800000, sell: 2500000 },
  { id: "lexus", year: "2016", name: "Lexus RX", kind: "suv", hue: 48, buy: 2100000, sell: 2950000 },
];

export const COMBO_WINDOW = 2.55;

export function flipAt(combo: number): FlipDeal {
  const i = Math.max(0, Math.min(FLIP_LADDER.length - 1, combo - 1));
  return FLIP_LADDER[i];
}

export function flipProfit(deal: FlipDeal, combo: number, mul = 1): number {
  const raw = Math.max(0, deal.sell - deal.buy);
  return Math.round(raw * Math.max(1, combo) * mul);
}
