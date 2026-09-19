import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import {
  ChevronRight,
  Clock,
  Flag,
  KeyRound,
  Pause,
  Play,
  RotateCcw,
  Map as MapIcon,
  Percent,
  Zap,
  Fuel,
  BadgeCheck,
  Banknote,
  Car,
  Star,
  ArrowBigUp,
  Timer,
  Footprints,
  Coins,
  Ghost,
  Leaf,
  Handshake,
  Target,
  ClipboardList,
  Truck,
  Gavel,
  Music2,
  Crown,
  Shield,
  User,
  Gamepad2,
  Swords,
  Crosshair,
  ScrollText,
  Shirt,
  LogOut,
} from "lucide-react";
import { createGame, type GameHandle } from "@/game/engine";
import { createRush } from "@/game/rush";
import { createSurvival } from "@/game/survival";
import { createInvaders } from "@/game/invaders";
import { createDeal } from "@/game/deal";
import { createCells } from "@/game/cells";
import { LEVELS } from "@/game/levels";
import { LOT_COUNT, formatKm, formatPesos, formatTime, GAME_VERSION, type GameMode, type HudState, type PowerKind, type Screen } from "@/game/types";
import { LogoBadge } from "@/components/Logo";
import { BootScreen, ComicIntro, hasSeenComic, markComicSeen } from "@/components/Intro";
import { Garage } from "@/components/Garage";
import { Missions } from "@/components/Missions";
import { JedPop, JedFace } from "@/components/JedPop";
import { Press } from "@/components/Press";
import { Wardrobe } from "@/components/Wardrobe";
import { GamePad } from "@/components/GamePad";
import { carById, USED_CARS } from "@/game/garage";
import { featuredMission, MISSION_COUNT } from "@/game/missions";

const LOT_ART: Record<string, string> = {
  showroom: "/maps/showroom.jpg",
  edsa: "/maps/edsa.jpg",
  ortigas: "/maps/ortigas.jpg",
  bgc: "/maps/bgc.jpg",
  nlex: "/maps/nlex.jpg",
  timog: "/maps/timog.jpg",
  cubao: "/maps/cubao.jpg",
  makati: "/maps/makati.jpg",
  clark: "/maps/clark.jpg",
  cebu: "/maps/cebu.jpg",
  davao: "/maps/davao.jpg",
  alabang: "/maps/alabang.jpg",
};

const INITIAL: HudState = {
  screen: "title",
  levelIndex: 0,
  levelName: LEVELS[0].name,
  kicker: LEVELS[0].kicker,
  coins: 0,
  totalCoins: LEVELS[0].coins.length,
  pesoCoins: 0,
  totalPesoCoins: LEVELS[0].pesos.length,
  deaths: 0,
  hasCheckpoint: false,
  unlocked: 0,
  best: Array.from({ length: LOT_COUNT }, () => 0),
  bestTime: Array.from({ length: LOT_COUNT }, () => 0),
  banner: "",
  progress: 0,
  clock: 0,
  record: false,
  pesos: 0,
  warranty: false,
  grow: false,
  buffs: [],
  popup: null,
  cars: ["vios"],
  equipped: "vios",
  rank: "Walk-in",
  careerKeys: 0,
  careerPesos: 0,
  missions: [],
  missionsDone: 0,
  missionsTotal: MISSION_COUNT,
  missionHint: "",
  stompLot: 0,
  mode: "lots",
  stars: Array.from({ length: LOT_COUNT }, () => 0),
  rushBest: 0,
  survivalBest: 0,
  invadersBest: 0,
  dealBest: 0,
  cellsBest: 0,
  score: 0,
  wave: 0,
  padAction: "Jump",
  padExtra: null,
  outfits: ["jacket"],
  equippedOutfit: "jacket",
  combo: 0,
  comboMax: 0,
  comboHeat: 0,
  dealName: "",
  dealBuy: 0,
  dealSell: 0,
  dealProfit: 0,
};

function bindPress(fn: () => void) {
  return {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.dataset.pressed = "1";
      fn();
    },
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const el = e.currentTarget;
      if (el.dataset.pressed === "1") {
        delete el.dataset.pressed;
        return;
      }
      fn();
    },
  };
}

function buzz(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
}

const BUFF_ICON: Record<PowerKind, typeof Percent> = {
  discount: Percent,
  release: Star,
  tank: Fuel,
  approved: Zap,
  commission: Banknote,
  warranty: BadgeCheck,
  upgrade: ArrowBigUp,
  oneday: Timer,
  tradein: Footprints,
  rentown: Leaf,
  cmap: Ghost,
  quota: Target,
  pasalo: Handshake,
  nationwide: Truck,
  replevin: Gavel,
  musicbox: Music2,
  elite: Crown,
  john: User,
  fidelity: Shield,
};

type Intro = "boot" | "comic" | "ready";

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const pendingStart = useRef<number | null>(null);
  const [hud, setHud] = useState<HudState>(INITIAL);
  const [ready, setReady] = useState(false);
  const [loadP, setLoadP] = useState(0);
  const [intro, setIntro] = useState<Intro>("boot");
  const [mode, setMode] = useState<GameMode>("lots");
  const [letters, setLetters] = useState(false);
  const aliveRef = useRef(true);

  function factory(m: GameMode) {
    if (m === "rush") return createRush;
    if (m === "survival") return createSurvival;
    if (m === "invaders") return createInvaders;
    if (m === "deal") return createDeal;
    if (m === "cells") return createCells;
    return createGame;
  }

  function mountMode(m: GameMode, then?: (g: GameHandle) => void) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    gameRef.current?.destroy();
    gameRef.current = null;
    setReady(false);
    setMode(m);
    const make = factory(m);
    void make(canvas, (next) => {
      if (aliveRef.current) setHud(next);
    }, m === "lots" ? (p) => { if (aliveRef.current) setLoadP(p); } : undefined)
      .then((g) => {
        if (!aliveRef.current) {
          g.destroy();
          return;
        }
        gameRef.current = g;
        setHud(g.hud());
        setReady(true);
        then?.(g);
      })
      .catch((err) => console.error(err));
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let alive = true;
    aliveRef.current = true;
    const bootAt = performance.now();

    const boot = () => {
      void createGame(
        canvas,
        (next) => {
          if (alive) setHud(next);
        },
        (p) => {
          if (alive) setLoadP(p);
        },
      )
        .then((g) => {
          if (!alive) {
            g.destroy();
            return;
          }
          gameRef.current = g;
          setHud(g.hud());
          setReady(true);
          if (pendingStart.current !== null) {
            const i = pendingStart.current;
            pendingStart.current = null;
            g.startLevel(i);
          }
        })
        .catch((err) => {
          console.error(err);
          if (alive) window.setTimeout(boot, 500);
        });
    };
    boot();

    const minMs = hasSeenComic() ? 1200 : 2000;
    const t = window.setInterval(() => {
      if (!alive) return;
      if (gameRef.current && performance.now() - bootAt >= minMs) {
        window.clearInterval(t);
        setIntro((cur) => (cur === "boot" ? (hasSeenComic() ? "ready" : "comic") : cur));
      }
    }, 80);

    return () => {
      alive = false;
      aliveRef.current = false;
      window.clearInterval(t);
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, []);

  function start(i: number) {
    const game = gameRef.current;
    markComicSeen();
    setIntro("ready");
    setLetters(false);
    if (mode !== "lots") {
      pendingStart.current = i;
      mountMode("lots", (g) => g.startLevel(i));
      buzz(16);
      return;
    }
    if (!game) {
      pendingStart.current = i;
      return;
    }
    game.startLevel(i);
    setHud(game.hud());
    buzz(16);
  }

  function playArcade(m: GameMode) {
    markComicSeen();
    setIntro("ready");
    setLetters(false);
    setHud((h) => ({
      ...h,
      screen: "play",
      mode: m,
      popup: null,
      banner: "",
      padAction: m === "rush" ? "Hop" : m === "invaders" ? "Fire" : m === "deal" ? "Pick" : "Jump",
      padExtra: m === "cells" ? "Slash" : null,
      levelName:
        m === "rush"
          ? "EDSA Rush"
          : m === "survival"
            ? "Lot Survival"
            : m === "invaders"
              ? "Quota Invaders"
              : m === "deal"
                ? "Jed's Deal"
                : m === "cells"
                  ? "Replevin Cells"
                  : h.levelName,
    }));
    mountMode(m);
    buzz(16);
  }

  function goHub() {
    setLetters(false);
    setHud((h) => ({ ...h, screen: "title", mode: "lots", popup: null, banner: "" }));
    mountMode("lots");
  }

  function goTitle() {
    setLetters(false);
    if (mode !== "lots") {
      mountMode("lots");
      return;
    }
    gameRef.current?.setScreen("title");
  }

  function setScreen(s: Screen) {
    gameRef.current?.setScreen(s);
  }

  const padMove = useRef({ analogX: 0, stickDown: false, squareDown: false });
  const jumpHold = useRef(0);

  function flushPadMove() {
    const game = gameRef.current;
    if (!game) return;
    const p = padMove.current;
    game.setTouch({ analogX: p.analogX, down: p.stickDown || p.squareDown });
  }

  function holdJump(on: boolean) {
    if (on) {
      jumpHold.current += 1;
      touch("jump", true);
    } else {
      jumpHold.current = Math.max(0, jumpHold.current - 1);
      if (jumpHold.current === 0) touch("jump", false);
    }
  }

  function touch(side: "jump" | "slash" | "up", on: boolean) {
    const game = gameRef.current;
    if (!game) return;
    if (side === "slash") {
      game.setTouch({ slash: on });
      if (on) buzz(8);
    } else if (side === "up") {
      game.setTouch({ up: on });
      if (on) buzz(8);
    } else {
      game.setTouch({ jump: on });
      if (on) buzz(8);
    }
  }

  const inRun = hud.screen === "play" || hud.screen === "pause" || hud.screen === "win";
  const introActive = intro !== "ready";
  const showMenu = !introActive && (hud.screen === "title" || hud.screen === "select");
  const showPads = hud.screen === "play" && !introActive && ready;
  const padsLive = hud.screen === "play" && ready;

  return (
    <div className="game-shell relative flex h-dvh w-full flex-col overflow-hidden bg-bg text-fg font-sans touch-none select-none">
      {inRun && !introActive ? (
        <div className="pointer-events-none relative z-20 shrink-0 px-2 pb-1.5 sm:px-3 sm:pb-2">
          <div className="h-1 overflow-hidden rounded-full bg-elevated/80 sm:h-1.5">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.round(hud.progress * 100)}%` }}
            />
          </div>
          {hud.missionHint ? (
            <p className="mt-1 truncate rounded-md bg-elevated/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-gold sm:mt-1.5 sm:text-[11px]">
              {hud.missionHint}
            </p>
          ) : null}
          {hud.mode === "lots" && hud.dealName && hud.screen === "play" ? (
            <div className="mt-1 flex min-w-0 items-center gap-1.5 overflow-x-auto border-2 border-gold/40 bg-bg/45 px-2 py-1 sm:mt-1.5">
              <span className="font-pixel text-[10px] tracking-wide text-gold">×{Math.max(1, hud.combo)}</span>
              <span className="shrink-0 font-display text-sm font-semibold leading-none">{hud.dealName}</span>
              <span className="shrink-0 font-pixel text-[9px] text-muted">BUY -{formatPesos(hud.dealBuy)}</span>
              <span className="shrink-0 font-pixel text-[9px] text-fg">SELL {formatPesos(hud.dealSell)}</span>
              <span className="shrink-0 font-pixel text-[9px] text-gold">PROFIT {formatPesos(hud.dealProfit)}</span>
              <span className="ml-auto h-1.5 w-16 shrink-0 overflow-hidden bg-elevated">
                <span className="block h-full bg-gold" style={{ width: `${Math.round(hud.comboHeat * 100)}%` }} />
              </span>
            </div>
          ) : null}
          <div className="mt-1.5 flex items-center gap-1 sm:mt-2 sm:gap-1.5">
            <div className="hidden min-w-0 items-center gap-2 rounded-lg border border-border bg-surface/40 px-2.5 py-1.5 sm:flex">
              <LogoBadge className="size-7 shrink-0" />
              <div className="min-w-0 leading-tight">
                <p className="truncate font-display text-sm font-semibold tracking-wide text-fg">
                  {hud.levelName}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {hud.kicker}
                  {hud.deaths > 0 ? ` · Falls ${hud.deaths}` : ""}
                </p>
              </div>
            </div>
            <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:gap-1.5">
              <div className="flex shrink-0 items-center gap-1 border-2 border-border/70 bg-surface/40 px-1.5 py-1 sm:gap-1.5 sm:px-2.5 sm:py-1.5 hud-chip">
                <Clock className="size-3.5 text-gold sm:size-4" />
                <span className="leading-none">
                  <span
                    className={
                      "timer-digits block font-display text-sm font-semibold tracking-wide sm:text-base " +
                      ((hud.bestTime[hud.levelIndex] ?? 0) > 0 &&
                      hud.clock > 0 &&
                      hud.clock < hud.bestTime[hud.levelIndex]
                        ? "text-gold"
                        : "text-fg")
                    }
                  >
                    {formatTime(hud.clock)}
                  </span>
                  <span className="mt-0.5 hidden text-[10px] leading-none text-muted sm:block">
                    {(hud.bestTime[hud.levelIndex] ?? 0) > 0
                      ? `PB ${formatTime(hud.bestTime[hud.levelIndex])}`
                      : "Lot clock"}
                  </span>
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface/40 px-1.5 py-1 sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-1.5">
                {hud.mode === "lots" ? (
                  <>
                    <KeyRound className="size-3.5 text-gold sm:size-4" />
                    <span className="font-display text-sm font-semibold tabular-nums tracking-wide sm:text-base">
                      {hud.combo > 0 ? (
                        <>
                          ×{hud.combo}
                          <span className="text-muted">/{hud.totalCoins}</span>
                        </>
                      ) : (
                        <>
                          {hud.coins}
                          <span className="text-muted">/{hud.totalCoins}</span>
                        </>
                      )}
                    </span>
                  </>
                ) : hud.mode === "rush" ? (
                  <>
                    <Car className="size-3.5 text-gold sm:size-4" />
                    <span className="font-display text-sm font-semibold tabular-nums tracking-wide sm:text-base">
                      {formatKm(hud.score)}
                    </span>
                  </>
                ) : hud.mode === "survival" ? (
                  <>
                    <Swords className="size-3.5 text-gold sm:size-4" />
                    <span className="font-display text-sm font-semibold tabular-nums tracking-wide sm:text-base">
                      W{hud.wave}
                    </span>
                  </>
                ) : hud.mode === "cells" ? (
                  <>
                    <Gavel className="size-3.5 text-gold sm:size-4" />
                    <span className="font-display text-sm font-semibold tabular-nums tracking-wide sm:text-base">
                      {hud.wave}/8
                    </span>
                  </>
                ) : hud.mode === "deal" ? (
                  <>
                    <Handshake className="size-3.5 text-gold sm:size-4" />
                    <span className="font-display text-sm font-semibold tabular-nums tracking-wide sm:text-base">
                      {formatPesos(hud.score || hud.dealBest)}
                    </span>
                  </>
                ) : (
                  <>
                    <Crosshair className="size-3.5 text-gold sm:size-4" />
                    <span className="font-display text-sm font-semibold tabular-nums tracking-wide sm:text-base">
                      {hud.score}
                    </span>
                  </>
                )}
              </div>
              {hud.mode === "lots" ? (
                <div className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface/40 px-1.5 py-1 sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-1.5">
                  <Coins className="size-3.5 text-gold sm:size-4" />
                  <span className="font-display text-sm font-semibold tabular-nums tracking-wide text-gold sm:text-base">
                    {hud.pesoCoins}
                    <span className="text-muted">/{hud.totalPesoCoins}</span>
                  </span>
                </div>
              ) : hud.mode === "invaders" || hud.mode === "survival" || hud.mode === "cells" ? (
                <div className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface/40 px-1.5 py-1 sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-1.5">
                  <Star className="size-3.5 text-gold sm:size-4" />
                  <span className="font-display text-sm font-semibold tabular-nums tracking-wide text-gold sm:text-base">
                    {hud.score}
                  </span>
                </div>
              ) : null}
              {hud.pesos > 0 ? (
                <div className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface/40 px-1.5 py-1 sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-1.5">
                  <Banknote className="size-3.5 text-gold sm:size-4" />
                  <span className="font-display text-sm font-semibold tabular-nums tracking-wide text-gold sm:text-base">
                    {formatPesos(hud.pesos)}
                  </span>
                </div>
              ) : null}
              {(() => {
                const car = carById(hud.equipped);
                if (!car) return null;
                return (
                  <div className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface/40 px-1.5 py-1 sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-1.5">
                    <img
                      src={car.kind === "suv" ? "/sprites/suv.png" : "/sprites/sedan.png"}
                      alt=""
                      className="h-5 w-8 object-contain object-bottom sm:h-6 sm:w-10"
                      style={{ filter: `hue-rotate(${car.hue}deg) saturate(1.15)` }}
                      draggable={false}
                    />
                    <span className="font-display text-[11px] font-semibold tracking-wide text-gold sm:text-xs">
                      {car.perk.tag}
                    </span>
                  </div>
                );
              })()}
            </div>
            {hud.screen === "play" ? (
              <button
                type="button"
                aria-label="Pause"
                className="pointer-events-auto flex size-11 shrink-0 items-center justify-center border-2 border-border/70 bg-surface/40 text-fg sm:size-12"
                {...bindPress(() => gameRef.current?.pause())}
              >
                <Pause className="size-5" strokeWidth={2.4} />
              </button>
            ) : (
              <div className="size-11 shrink-0 sm:size-12" />
            )}
          </div>
          {hud.buffs.length > 0 ? (
            <div className="pointer-events-none mt-1 flex flex-wrap gap-1 sm:mt-1.5 sm:gap-1.5">
              {hud.buffs.map((b) => {
                const Icon = BUFF_ICON[b.kind];
                return (
                  <span
                    key={b.kind}
                    className="flex items-center gap-1 rounded-md border border-border bg-surface/40 px-1.5 py-0.5 font-display text-[11px] font-semibold tracking-wide text-fg sm:px-2 sm:py-1 sm:text-xs"
                  >
                    <Icon className="size-3 text-gold sm:size-3.5" />
                    {b.label}
                    {b.remain < 90 ? (
                      <span className="tabular-nums text-muted">{b.remain.toFixed(0)}s</span>
                    ) : null}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1 bg-bg">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-0 h-full w-full bg-bg touch-none pointer-events-none"
          style={{ imageRendering: "auto" }}
        />

        {hud.popup && (hud.screen === "play" || hud.screen === "win") && !introActive ? (
          <JedPop popup={hud.popup} />
        ) : null}

        {intro === "boot" ? (
          <BootScreen
            progress={loadP}
            ready={ready}
            onSkip={() => setIntro(hasSeenComic() ? "ready" : "comic")}
          />
        ) : null}
        {intro === "comic" ? (
          <ComicIntro onPlay={() => start(0)} onLots={() => { markComicSeen(); setIntro("ready"); gameRef.current?.setScreen("title"); }} />
        ) : null}

        {showMenu ? (
          <div className="pointer-events-auto absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-bg/80 p-2 backdrop-blur-[2px] sm:items-center sm:p-4">
            {hud.screen === "title" ? (
              <Title
                ready={ready}
                rank={hud.rank}
                cars={hud.cars.length}
                done={hud.missionsDone}
                total={hud.missionsTotal}
                onStart={() => start(0)}
                onSelect={() => setScreen("select")}
                onGarage={() => setScreen("garage")}
                onWardrobe={() => setScreen("wardrobe")}
                onMissions={() => setScreen("missions")}
                onStory={() => setIntro("comic")}
                onRush={() => playArcade("rush")}
                onSurvival={() => playArcade("survival")}
                onInvaders={() => playArcade("invaders")}
                onDeal={() => playArcade("deal")}
                onCells={() => playArcade("cells")}
                onLetters={() => setLetters(true)}
                rushBest={hud.rushBest}
                survivalBest={hud.survivalBest}
                invadersBest={hud.invadersBest}
                dealBest={hud.dealBest}
                cellsBest={hud.cellsBest}
              />
            ) : (
              <LevelSelect
                unlocked={hud.unlocked}
                best={hud.best}
                bestTime={hud.bestTime}
                stars={hud.stars}
                onBack={() => gameRef.current?.back()}
                onTitle={goTitle}
                onPick={start}
              />
            )}
          </div>
        ) : null}

        {hud.screen === "garage" && !introActive ? (
          <Garage
            save={{
              cars: hud.cars,
              equipped: hud.equipped,
              careerKeys: hud.careerKeys,
              careerPesos: hud.careerPesos,
            }}
            onBack={() => gameRef.current?.back()}
            onEquip={(id) => gameRef.current?.equipCar(id)}
          />
        ) : null}

        {hud.screen === "wardrobe" && !introActive ? (
          <Wardrobe
            save={{
              outfits: hud.outfits,
              equippedOutfit: hud.equippedOutfit,
              careerKeys: hud.careerKeys,
              careerPesos: hud.careerPesos,
              cars: hud.cars,
              bestTime: hud.bestTime,
              cellsBest: hud.cellsBest,
            }}
            onBack={() => gameRef.current?.back()}
            onEquip={(id) => gameRef.current?.equipOutfit(id)}
          />
        ) : null}

        {hud.screen === "missions" && !introActive ? (
          <Missions
            list={hud.missions}
            done={hud.missionsDone}
            total={hud.missionsTotal}
            onBack={() => gameRef.current?.back()}
          />
        ) : null}

        {letters && showMenu ? <Press onClose={() => setLetters(false)} /> : null}

        {hud.screen === "pause" && !introActive ? (
          <Modal
            title="Paused"
            copy={`${hud.levelName} · ${carById(hud.equipped)?.perk.tag ?? "STOCK"} · ${hud.missionHint}`}
            actions={[
              { label: "Resume", icon: Play, onClick: () => gameRef.current?.resume(), primary: true },
              { label: "Restart", icon: RotateCcw, onClick: () => gameRef.current?.restart() },
              ...(hud.mode === "lots"
                ? [
                    { label: "Missions", icon: ClipboardList, onClick: () => setScreen("missions") },
                    { label: "Garage", icon: Car, onClick: () => setScreen("garage") },
                    { label: "Wardrobe", icon: Shirt, onClick: () => setScreen("wardrobe") },
                    { label: "Levels", icon: MapIcon, onClick: () => setScreen("select") },
                    { label: "Quit to title", icon: LogOut, onClick: goTitle },
                  ]
                : [
                    { label: "Arcade", icon: Gamepad2, onClick: goHub },
                    { label: "Garage", icon: Car, onClick: () => setScreen("garage") },
                    { label: "Wardrobe", icon: Shirt, onClick: () => setScreen("wardrobe") },
                    { label: "Quit to title", icon: LogOut, onClick: goTitle },
                  ]),
            ]}
          />
        ) : null}

        {hud.screen === "win" && !introActive ? (
          <Modal
            title={hud.mode === "lots" ? "Same-Day Release" : hud.levelName}
            copy={
              hud.mode === "rush"
                ? `${hud.record ? "New best. " : ""}${formatKm(hud.score)}. Banked ${formatPesos(hud.pesos)}.`
                : hud.mode === "survival"
                  ? `${hud.record ? "New best. " : ""}${Math.floor(hud.clock)}s · wave ${hud.wave}.`
                  : hud.mode === "invaders"
                    ? `${hud.record ? "New best. " : ""}${hud.score} closes · wave ${hud.wave}.`
                    : hud.mode === "deal"
                      ? `${hud.record ? "New best. " : ""}${formatPesos(hud.score)} closed.`
                      : hud.mode === "cells"
                        ? `${hud.record ? "New best. " : ""}${hud.score} pts · cell ${hud.wave}/8.`
                      : hud.record
                      ? `New best ${formatTime(hud.clock)}. ${hud.coins} units · max ×${hud.comboMax} · ${formatPesos(hud.pesos)} profit.`
                      : `${formatTime(hud.clock)} · ${hud.coins}/${hud.totalCoins} units · max ×${hud.comboMax} · ${formatPesos(hud.pesos)} profit.`
            }
            actions={
              hud.mode === "lots"
                ? [
                    hud.levelIndex < LEVELS.length - 1
                      ? {
                          label: "Next lot",
                          icon: ChevronRight,
                          primary: true,
                          onClick: () => start(hud.levelIndex + 1),
                        }
                      : {
                          label: "Play again",
                          icon: RotateCcw,
                          primary: true,
                          onClick: () => start(0),
                        },
                    { label: "Replay lot", icon: RotateCcw, onClick: () => gameRef.current?.restart() },
                    { label: "Missions", icon: ClipboardList, onClick: () => setScreen("missions") },
                    { label: "Garage", icon: Car, onClick: () => setScreen("garage") },
                    { label: "Levels", icon: MapIcon, onClick: () => setScreen("select") },
                    { label: "Title", icon: LogOut, onClick: goTitle },
                  ]
                : [
                    { label: "Play again", icon: Play, primary: true, onClick: () => gameRef.current?.restart() },
                    { label: "Arcade", icon: Gamepad2, onClick: goHub },
                    { label: "Title", icon: LogOut, onClick: goTitle },
                  ]
            }
          />
        ) : null}

        {showPads ? (
          <GamePad
            live={padsLive}
            hintCross={hud.padAction.toUpperCase()}
            hintCircle={(hud.padExtra ?? hud.padAction).toUpperCase()}
            onStick={(x, y) => {
              padMove.current.analogX = x;
              padMove.current.stickDown = y > 0.55;
              flushPadMove();
            }}
            onCross={(on) => holdJump(on)}
            onCircle={(on) => (hud.padExtra ? touch("slash", on) : holdJump(on))}
            onSquare={(on) => {
              padMove.current.squareDown = on;
              flushPadMove();
            }}
            onTriangle={(on) => {
              touch("up", on);
              holdJump(on);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function Title({
  ready,
  rank,
  cars,
  done,
  total,
  onStart,
  onSelect,
  onGarage,
  onWardrobe,
  onMissions,
  onStory,
  onRush,
  onSurvival,
  onInvaders,
  onDeal,
  onCells,
  onLetters,
  rushBest,
  survivalBest,
  invadersBest,
  dealBest,
  cellsBest,
}: {
  ready: boolean;
  rank: string;
  cars: number;
  done: number;
  total: number;
  onStart: () => void;
  onSelect: () => void;
  onGarage: () => void;
  onWardrobe: () => void;
  onMissions: () => void;
  onStory: () => void;
  onRush: () => void;
  onSurvival: () => void;
  onInvaders: () => void;
  onDeal: () => void;
  onCells: () => void;
  onLetters: () => void;
  rushBest: number;
  survivalBest: number;
  invadersBest: number;
  dealBest: number;
  cellsBest: number;
}) {
  const daily = featuredMission();
  const [page, setPage] = useState<"hub" | "arcade" | "quit" | "guide">("hub");
  const cell = "pointer-events-auto flex h-11 items-center justify-center gap-1.5 border-2 border-border bg-elevated px-2 font-medium text-fg hover:bg-surface active:scale-[0.98]";

  if (page === "quit") {
    return (
      <div className="w-full max-w-sm border-2 border-border bg-surface/95 p-5 overlay-card pxl-frame">
        <p className="font-pixel text-[10px] uppercase tracking-[0.18em] text-gold">Walk out</p>
        <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">Leave the lot?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Save stays on this phone. Pause anytime, then Quit to title. Close the tab when you want to leave MCARS PH.
        </p>
        <button type="button" {...bindPress(() => setPage("hub"))} className="mt-5 flex h-12 w-full items-center justify-center bg-accent font-display text-lg font-semibold text-accent-fg">
          Back to menu
        </button>
      </div>
    );
  }

  if (page === "guide") {
    return (
      <div className="max-h-[min(92dvh,46rem)] w-full max-w-md overflow-y-auto border-2 border-border bg-surface/95 p-4 overlay-card pxl-frame sm:p-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="font-pixel text-[10px] uppercase tracking-[0.18em] text-gold">Guide</p>
            <h2 className="font-display text-2xl font-bold tracking-tight">How this plays</h2>
          </div>
          <button type="button" {...bindPress(() => setPage("hub"))} className="h-10 border-2 border-border px-3 font-pixel text-[10px] uppercase text-muted hover:text-fg">
            Back
          </button>
        </div>
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted">
          <p>
            <span className="font-pixel text-[10px] uppercase tracking-wide text-gold">Start</span>
            <br />
            Start Game drops you on Malabon. Lots picks a stage. Arcade is the other boards.
          </p>
          <p>
            <span className="font-pixel text-[10px] uppercase tracking-wide text-gold">Pad</span>
            <br />
            Stick moves. ✕ jumps. ○ is the extra: slash in Cells, hop on EDSA, fire in Invaders, pick in Jed's Deal. △ up · □ drop. Keyboard stays A/D left-right, W/Space jump, F slash.
          </p>
          <p>
            <span className="font-pixel text-[10px] uppercase tracking-wide text-gold">Boss John</span>
            <br />
            Grab SUMMON BOSS JOHN and he walks the lot with you. Fidelity Security is his invincibility — terracotta guards in navy uniforms lock a ring around you and clear enemies.
          </p>
          <p>
            <span className="font-pixel text-[10px] uppercase tracking-wide text-gold">Keys → cars</span>
            <br />
            Every key is a unit. Grab them fast to chain a combo. Buy is the minus. Sell is the plus. Profit is the score, multiplied ×1 ×2 ×3 ×4 as the chain climbs. Drop the chain if you wait or fall.
          </p>
          <p>
            <span className="font-pixel text-[10px] uppercase tracking-wide text-gold">Get back</span>
            <br />
            Every overlay has Back. Pause sits top-right in a run. Quit to title from pause. Lots has Title.
          </p>
          <p>
            <span className="font-pixel text-[10px] uppercase tracking-wide text-gold">Quit</span>
            <br />
            Pause → Quit to title. From this menu, Quit explains it. Close the tab to leave.
          </p>
          <p>
            <span className="font-pixel text-[10px] uppercase tracking-wide text-gold">Looks</span>
            <br />
            Wardrobe unlocks Jed fits as you clear lots, bank pesos, and run Cells. Pixel Jed on the lot. Real photos in the menus.
          </p>
        </div>
        <button type="button" {...bindPress(onStory)} className={cell + " mt-4 w-full"}>
          Q4 Story
        </button>
      </div>
    );
  }

  if (page === "arcade") {
    return (
      <div className="max-h-[min(92dvh,46rem)] w-full max-w-md overflow-y-auto border-2 border-border bg-surface/95 p-4 overlay-card pxl-frame sm:p-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="font-pixel text-[10px] uppercase tracking-[0.18em] text-gold">Arcade</p>
            <h2 className="font-display text-2xl font-bold tracking-tight">Pick a board</h2>
          </div>
          <button type="button" {...bindPress(() => setPage("hub"))} className="h-10 border-2 border-border px-3 font-pixel text-[10px] uppercase text-muted hover:text-fg">
            Back
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" {...bindPress(onRush)} className={cell + " h-16 flex-col"}>
            <span className="font-display text-base font-semibold">EDSA Rush</span>
            <span className="text-[11px] text-muted">Best {formatKm(rushBest)}</span>
          </button>
          <button type="button" {...bindPress(onSurvival)} className={cell + " h-16 flex-col"}>
            <span className="font-display text-base font-semibold">Survival</span>
            <span className="text-[11px] text-muted">Best {survivalBest}s</span>
          </button>
          <button type="button" {...bindPress(onInvaders)} className={cell + " h-16 flex-col"}>
            <span className="font-display text-base font-semibold">Invaders</span>
            <span className="text-[11px] text-muted">Best {invadersBest}</span>
          </button>
          <button type="button" {...bindPress(onDeal)} className={cell + " h-16 flex-col"}>
            <span className="font-display text-base font-semibold">Jed's Deal</span>
            <span className="text-[11px] text-muted">Best {formatPesos(dealBest)}</span>
          </button>
          <button type="button" {...bindPress(onCells)} className={cell + " col-span-2 h-16 flex-col border-gold/50"}>
            <span className="font-display text-base font-semibold">Replevin Cells</span>
            <span className="text-[11px] text-muted">Best {cellsBest} pts · ✕ jump · ○ slash</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-full w-full max-w-md overflow-y-auto border-2 border-border bg-surface/95 p-3 overlay-card pxl-frame sm:p-6">
      <div className="mb-3 flex items-center gap-3">
        <JedFace className="size-12 shrink-0 pxl-img sm:size-16" />
        <img
          src="/logo.jpg"
          alt="MCARS PH"
          className="h-12 min-w-0 flex-1 border-2 border-border object-cover object-center sm:h-16"
        />
      </div>
      <p className="font-pixel text-[10px] uppercase tracking-[0.18em] text-gold">
        {rank} · {cars}/{USED_CARS.length} units · {done}/{total} quota
      </p>
      <p className="mt-1 font-pixel text-[10px] uppercase tracking-[0.16em] text-muted">
        v{GAME_VERSION} · Boss John live · Fidelity Security
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold leading-none tracking-tight sm:text-4xl">
        Same-Day Release
      </h1>
      <p className="mt-1.5 mb-3 text-sm leading-relaxed text-muted">
        Enemies hit the lot. Summon Boss John. Fidelity Security is the terracotta ring — invincible, then walk out.
      </p>
      <div className="mb-3 hidden border-2 border-border bg-elevated px-3 py-2 sm:block">
        <p className="font-pixel text-[9px] uppercase tracking-[0.16em] text-muted">Today on the board</p>
        <p className="font-display text-base font-semibold leading-tight">{daily.title}</p>
        <p className="text-[11px] text-muted">{daily.copy}</p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          {...bindPress(onStart)}
          className="pointer-events-auto flex h-14 items-center justify-center gap-2 bg-accent px-5 font-display text-xl font-semibold tracking-wide text-accent-fg hover:brightness-110 active:scale-[0.98]"
          aria-busy={!ready}
        >
          <Play className="size-5" />
          Start Game
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" {...bindPress(onSelect)} className={cell}>
            <Flag className="size-4" />
            Lots
          </button>
          <button type="button" {...bindPress(() => setPage("arcade"))} className={cell}>
            <Gamepad2 className="size-4" />
            Arcade
          </button>
          <button type="button" {...bindPress(onGarage)} className={cell}>
            <Car className="size-4" />
            Garage
          </button>
          <button type="button" {...bindPress(onWardrobe)} className={cell}>
            <Shirt className="size-4" />
            Wardrobe
          </button>
          <button type="button" {...bindPress(onMissions)} className={cell}>
            <ClipboardList className="size-4" />
            Quota
          </button>
          <button type="button" {...bindPress(onLetters)} className={cell}>
            <ScrollText className="size-4" />
            Letters
          </button>
          <button type="button" {...bindPress(() => setPage("guide"))} className={cell}>
            Guide
          </button>
          <button type="button" {...bindPress(() => setPage("quit"))} className={cell}>
            <LogOut className="size-4" />
            Quit
          </button>
        </div>
      </div>
      <p className="mt-4 font-pixel text-[9px] leading-relaxed tracking-wide text-subtle">
        Pause top-right. Quit to title from pause. Overlay Back returns you. Stick + ✕/○ on phones. Keyboard: A/D move · W/Space jump · F slash.
      </p>
    </div>
  );
}

function LevelSelect({
  unlocked,
  best,
  bestTime,
  stars,
  onBack,
  onTitle,
  onPick,
}: {
  unlocked: number;
  best: number[];
  bestTime: number[];
  stars: number[];
  onBack: () => void;
  onTitle: () => void;
  onPick: (i: number) => void;
}) {
  return (
    <div className="flex max-h-[min(82dvh,40rem)] w-full max-w-lg flex-col overflow-hidden border-2 border-border bg-surface/95 overlay-card pxl-frame">
      <div className="flex shrink-0 items-end justify-between px-4 pt-4 sm:px-7 sm:pt-7">
        <div>
          <p className="font-pixel text-[10px] uppercase tracking-[0.18em] text-muted">Lots</p>
          <h2 className="font-display text-2xl font-bold tracking-tight">Level select</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            {...bindPress(onTitle)}
            className="pointer-events-auto h-10 border-2 border-border px-3 font-pixel text-[10px] uppercase text-muted hover:text-fg"
          >
            Title
          </button>
          <button
            type="button"
            {...bindPress(onBack)}
            className="pointer-events-auto h-10 border-2 border-border px-3 font-pixel text-[10px] uppercase text-muted hover:text-fg"
          >
            Back
          </button>
        </div>
      </div>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:mt-4 sm:px-7 sm:pb-7">
        <div className="flex flex-col gap-2">
          {LEVELS.map((lv, i) => {
            const open = i <= unlocked;
            return (
              <button
                key={lv.id}
                type="button"
                disabled={!open}
                {...(open ? bindPress(() => onPick(i)) : {})}
                className="pointer-events-auto flex items-center gap-3 rounded-lg border border-border bg-elevated px-2.5 py-2 text-left enabled:hover:border-accent/50 enabled:active:scale-[0.99] disabled:opacity-40 sm:gap-4 sm:px-4 sm:py-3"
              >
                <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md border border-border sm:h-12 sm:w-16">
                  <img
                    src={LOT_ART[lv.bg] ?? "/maps/showroom.jpg"}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </span>
                <span className="font-display text-xl font-bold tabular-nums text-accent sm:text-2xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-semibold leading-tight sm:text-lg">
                    {lv.name}
                  </span>
                  <span className="block truncate text-[11px] text-muted sm:text-xs">{lv.kicker}</span>
                  <span className="mt-0.5 block text-[11px] tracking-widest text-gold">
                    {"★".repeat(stars[i] ?? 0)}
                    {"☆".repeat(Math.max(0, 3 - (stars[i] ?? 0)))}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-0.5 text-[11px] tabular-nums text-muted sm:text-xs">
                  <span className="flex items-center gap-1">
                    <KeyRound className="size-3 text-gold sm:size-3.5" />
                    {best[i] ?? 0}/{lv.coins.length}
                  </span>
                  <span className="flex items-center gap-1 timer-digits">
                    <Clock className="size-3 text-gold sm:size-3.5" />
                    {formatTime(bestTime[i] ?? 0, true)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Modal({
  title,
  copy,
  actions,
}: {
  title: string;
  copy: string;
  actions: {
    label: string;
    icon: typeof Play;
    onClick: () => void;
    primary?: boolean;
  }[];
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-bg/70 p-3 backdrop-blur-[2px] sm:p-4">
      <div className="max-h-[min(88dvh,36rem)] w-full max-w-sm overflow-y-auto border-2 border-border bg-surface/95 p-5 overlay-card pxl-frame sm:p-6">
        <h2 className="font-display text-3xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
        <div className="mt-5 flex flex-col gap-2">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                type="button"
                {...bindPress(a.onClick)}
                className={
                  a.primary
                    ? "pointer-events-auto flex h-11 items-center justify-center gap-2 rounded-md bg-accent font-display text-lg font-semibold text-accent-fg"
                    : "pointer-events-auto flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-elevated text-sm font-medium text-fg"
                }
              >
                <Icon className="size-4" />
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

