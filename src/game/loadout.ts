import { carById, type UsedCar } from "./garage";

export type Loadout = {
  id: string;
  name: string;
  year: string;
  kind: "sedan" | "suv";
  hue: number;
  tag: string;
  passive: string;
  lotsLine: string;
  rushLine: string;
  survLine: string;
  invLine: string;
  dealLine: string;
  speedMul: number;
  jumpMul: number;
  coyoteAdd: number;
  extraAir: number;
  magnet: number;
  spawnInvuln: number;
  armor: number;
  oilImmune: boolean;
  phaseCones: boolean;
  stompCones: boolean;
  firstHazFree: boolean;
  blinkDash: boolean;
  floatMul: number;
  hitTrim: number;
  pesoMul: number;
  growJed: number;
  rushSpeed: number;
  rushHop: number;
  rushArmor: number;
  rushMagnet: boolean;
  rushRam: number;
  rushHitW: number;
  rushLaneK: number;
  rushCoin: number;
  rushWide: number;
  survSpeed: number;
  survJump: number;
  survAir: number;
  survArmor: number;
  survRam: boolean;
  survHitW: number;
  survHitH: number;
  invMove: number;
  invCool: number;
  invLives: number;
  invShots: number;
  invPierce: number;
  invShotVy: number;
  invPay: number;
  dealOfferMul: number;
  dealPeek: number;
};

type Spec = Partial<Omit<Loadout, "id" | "name" | "year" | "kind" | "hue" | "tag" | "passive" | "lotsLine" | "rushLine" | "survLine" | "invLine" | "dealLine">>;

const BASE: Spec = {
  speedMul: 1,
  jumpMul: 1,
  coyoteAdd: 0,
  extraAir: 0,
  magnet: 0,
  spawnInvuln: 0.55,
  armor: 0,
  oilImmune: false,
  phaseCones: false,
  stompCones: false,
  firstHazFree: false,
  blinkDash: false,
  floatMul: 1,
  hitTrim: 0,
  pesoMul: 1,
  growJed: 1,
  rushSpeed: 1,
  rushHop: 0.42,
  rushArmor: 0,
  rushMagnet: false,
  rushRam: 0,
  rushHitW: 16,
  rushLaneK: 14,
  rushCoin: 1,
  rushWide: 1,
  survSpeed: 1,
  survJump: 1,
  survAir: 1,
  survArmor: 0,
  survRam: false,
  survHitW: 20,
  survHitH: 34,
  invMove: 1,
  invCool: 0.28,
  invLives: 3,
  invShots: 1,
  invPierce: 0,
  invShotVy: 520,
  invPay: 1,
  dealOfferMul: 1,
  dealPeek: 0,
};

const SPECS: Record<string, Spec> = {
  vios: {},
  wigo: {
    speedMul: 1.06,
    hitTrim: 3,
    rushHitW: 11,
    rushLaneK: 22,
    rushHop: 0.36,
    rushWide: 0.82,
    survHitW: 16,
    survHitH: 30,
    survSpeed: 1.08,
    invMove: 1.2,
  },
  city: {
    speedMul: 1.1,
    rushSpeed: 1.18,
    rushLaneK: 16,
    survSpeed: 1.14,
    invMove: 1.16,
    dealOfferMul: 1.04,
  },
  fortuner: {
    jumpMul: 1.1,
    floatMul: 0.86,
    rushHop: 0.58,
    rushWide: 1.12,
    survJump: 1.16,
    survHitW: 28,
    survHitH: 38,
    invShotVy: 640,
    dealOfferMul: 1.06,
  },
  civic: {
    magnet: 26,
    rushMagnet: true,
    rushCoin: 1.15,
    invPay: 1.2,
    dealPeek: 1,
  },
  montero: {
    coyoteAdd: 0.08,
    oilImmune: true,
    rushLaneK: 18,
    survSpeed: 1.04,
    dealOfferMul: 1.05,
  },
  hilux: {
    extraAir: 1,
    rushHop: 0.62,
    survAir: 2,
    survJump: 1.08,
    invCool: 0.2,
    dealOfferMul: 1.05,
  },
  innova: {
    jumpMul: 1.06,
    coyoteAdd: 0.05,
    armor: 1,
    floatMul: 0.9,
    rushArmor: 1,
    survArmor: 1,
    invLives: 4,
    dealOfferMul: 1.08,
  },
  ranger: {
    spawnInvuln: 1.35,
    armor: 1,
    rushArmor: 1,
    survArmor: 1,
    dealOfferMul: 1.06,
  },
  everest: {
    speedMul: 1.1,
    jumpMul: 1.04,
    pesoMul: 1.25,
    rushSpeed: 1.1,
    rushCoin: 2,
    survSpeed: 1.1,
    survJump: 1.06,
    invPay: 1.35,
    dealOfferMul: 1.1,
  },
  almera: {
    magnet: 16,
    speedMul: 1.05,
    firstHazFree: true,
    rushArmor: 0,
    dealPeek: 1,
  },
  adventure: {
    coyoteAdd: 0.1,
    extraAir: 1,
    stompCones: true,
    rushRam: 1,
    survRam: true,
    survAir: 2,
    invPierce: 1,
    dealOfferMul: 1.06,
  },
  cruiser: {
    speedMul: 1.1,
    jumpMul: 1.05,
    magnet: 12,
    growJed: 1.08,
    armor: 1,
    rushRam: 2,
    rushWide: 1.22,
    rushHitW: 20,
    rushArmor: 1,
    survRam: true,
    survArmor: 1,
    survHitW: 34,
    survHitH: 40,
    invShots: 2,
    dealOfferMul: 1.12,
  },
  alphard: {
    speedMul: 1.14,
    jumpMul: 1.08,
    magnet: 18,
    extraAir: 1,
    spawnInvuln: 1.1,
    armor: 1,
    rushSpeed: 1.08,
    rushHop: 0.55,
    rushArmor: 1,
    rushRam: 1,
    rushMagnet: true,
    survSpeed: 1.12,
    survJump: 1.1,
    survAir: 2,
    survArmor: 1,
    survRam: true,
    invMove: 1.1,
    invCool: 0.18,
    invLives: 4,
    invShots: 2,
    invPierce: 1,
    dealOfferMul: 1.15,
    dealPeek: 1,
  },
  avanza: {
    magnet: 20,
    coyoteAdd: 0.06,
    armor: 1,
    rushArmor: 1,
    rushMagnet: true,
    survArmor: 1,
    invLives: 4,
    invPay: 1.2,
    dealPeek: 2,
  },
  xpander: {
    speedMul: 1.08,
    extraAir: 1,
    blinkDash: true,
    rushHop: 0.5,
    rushSpeed: 1.12,
    survAir: 2,
    survSpeed: 1.1,
    invMove: 1.22,
    invCool: 0.2,
    dealOfferMul: 1.08,
  },
  crv: {
    jumpMul: 1.12,
    magnet: 14,
    pesoMul: 1.5,
    rushCoin: 1.5,
    survJump: 1.12,
    invPay: 1.5,
    dealOfferMul: 1.2,
  },
  lexus: {
    speedMul: 1.16,
    jumpMul: 1.1,
    magnet: 22,
    extraAir: 1,
    spawnInvuln: 1.2,
    armor: 2,
    blinkDash: true,
    growJed: 1.12,
    hitTrim: -2,
    pesoMul: 1.35,
    rushSpeed: 1.16,
    rushHop: 0.56,
    rushArmor: 2,
    rushRam: 2,
    rushMagnet: true,
    rushWide: 1.18,
    rushHitW: 19,
    rushCoin: 1.4,
    survSpeed: 1.14,
    survJump: 1.12,
    survAir: 2,
    survArmor: 2,
    survRam: true,
    survHitW: 32,
    survHitH: 40,
    invMove: 1.18,
    invCool: 0.16,
    invLives: 4,
    invShots: 2,
    invPierce: 1,
    invShotVy: 640,
    invPay: 1.4,
    dealOfferMul: 1.22,
    dealPeek: 1,
  },
};

export function resolveLoadout(id: string): Loadout {
  const car: UsedCar = carById(id) ?? carById("vios")!;
  const spec = SPECS[car.id] ?? SPECS.vios;
  return {
    id: car.id,
    name: car.name,
    year: car.year,
    kind: car.kind,
    hue: car.hue,
    tag: car.perk.tag,
    passive: car.perk.passive,
    lotsLine: car.perk.lots,
    rushLine: car.perk.rush,
    survLine: car.perk.survival,
    invLine: car.perk.invaders,
    dealLine: car.perk.deal,
    speedMul: spec.speedMul ?? BASE.speedMul!,
    jumpMul: spec.jumpMul ?? BASE.jumpMul!,
    coyoteAdd: spec.coyoteAdd ?? BASE.coyoteAdd!,
    extraAir: spec.extraAir ?? BASE.extraAir!,
    magnet: spec.magnet ?? BASE.magnet!,
    spawnInvuln: spec.spawnInvuln ?? BASE.spawnInvuln!,
    armor: spec.armor ?? BASE.armor!,
    oilImmune: spec.oilImmune ?? BASE.oilImmune!,
    phaseCones: spec.phaseCones ?? BASE.phaseCones!,
    stompCones: spec.stompCones ?? BASE.stompCones!,
    firstHazFree: spec.firstHazFree ?? BASE.firstHazFree!,
    blinkDash: spec.blinkDash ?? BASE.blinkDash!,
    floatMul: spec.floatMul ?? BASE.floatMul!,
    hitTrim: spec.hitTrim ?? BASE.hitTrim!,
    pesoMul: spec.pesoMul ?? BASE.pesoMul!,
    growJed: spec.growJed ?? BASE.growJed!,
    rushSpeed: spec.rushSpeed ?? BASE.rushSpeed!,
    rushHop: spec.rushHop ?? BASE.rushHop!,
    rushArmor: spec.rushArmor ?? BASE.rushArmor!,
    rushMagnet: spec.rushMagnet ?? BASE.rushMagnet!,
    rushRam: spec.rushRam ?? BASE.rushRam!,
    rushHitW: spec.rushHitW ?? BASE.rushHitW!,
    rushLaneK: spec.rushLaneK ?? BASE.rushLaneK!,
    rushCoin: spec.rushCoin ?? BASE.rushCoin!,
    rushWide: spec.rushWide ?? BASE.rushWide!,
    survSpeed: spec.survSpeed ?? BASE.survSpeed!,
    survJump: spec.survJump ?? BASE.survJump!,
    survAir: spec.survAir ?? BASE.survAir!,
    survArmor: spec.survArmor ?? BASE.survArmor!,
    survRam: spec.survRam ?? BASE.survRam!,
    survHitW: spec.survHitW ?? BASE.survHitW!,
    survHitH: spec.survHitH ?? BASE.survHitH!,
    invMove: spec.invMove ?? BASE.invMove!,
    invCool: spec.invCool ?? BASE.invCool!,
    invLives: spec.invLives ?? BASE.invLives!,
    invShots: spec.invShots ?? BASE.invShots!,
    invPierce: spec.invPierce ?? BASE.invPierce!,
    invShotVy: spec.invShotVy ?? BASE.invShotVy!,
    invPay: spec.invPay ?? BASE.invPay!,
    dealOfferMul: spec.dealOfferMul ?? BASE.dealOfferMul!,
    dealPeek: spec.dealPeek ?? BASE.dealPeek!,
  };
}
