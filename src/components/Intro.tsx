import { useEffect, useState, type MouseEvent, type PointerEvent } from "react";
import { ChevronRight, Play } from "lucide-react";
import { BootStage } from "@/components/Boot3D";

const COMIC_KEY = "mcars-ph-comic-v3";

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

export function hasSeenComic() {
  try {
    return localStorage.getItem(COMIC_KEY) === "1";
  } catch {
    return false;
  }
}

export function markComicSeen() {
  try {
    localStorage.setItem(COMIC_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function BootScreen({
  progress,
  ready,
  onSkip,
}: {
  progress: number;
  ready: boolean;
  onSkip: () => void;
}) {
  const pct = ready ? 100 : Math.min(94, Math.round(6 + progress * 88));
  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-bg boot-screen">
      <BootStage progress={ready ? 1 : progress} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-4 pt-4 sm:px-6 sm:pt-5">
        <img
          src="/logo.jpg"
          alt="MCARS PH"
          className="h-10 w-auto max-w-[42%] border border-border object-cover object-center pxl-img sm:h-12"
        />
        <p className="font-pixel text-[10px] uppercase tracking-[0.22em] text-gold">
          Fidelity Security
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-0 px-5 pb-6 sm:px-8 sm:pb-8">
        <p className="font-pixel text-[10px] uppercase tracking-[0.28em] text-gold">
          Boss John · Terracotta ring
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold leading-none tracking-tight text-fg sm:text-5xl">
          Same-Day Release
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          Guards lock the dais. Enemies hit the lot. Summon Boss John. Walk in. Drive out.
        </p>
        <div className="mt-5 h-1.5 w-full max-w-sm overflow-hidden bg-elevated">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 font-pixel text-[10px] uppercase tracking-[0.18em] text-subtle">
          {ready ? "Lot is open" : "Lighting the showroom"}
        </p>
        {ready ? (
          <button
            type="button"
            className="pointer-events-auto mt-4 h-12 bg-accent px-6 font-display text-xl font-semibold text-accent-fg"
            {...bindPress(onSkip)}
          >
            Enter the lot
          </button>
        ) : (
          <p className="mt-3 font-pixel text-[10px] uppercase tracking-[0.16em] text-muted">
            Stick move · ✕ jump · ○ act
          </p>
        )}
      </div>
    </div>
  );
}

const PANELS = [
  {
    kicker: "Panel 01 · Malabon",
    title: "Last quarter.",
    copy: "Fourteen days left. The board at 95 Yanga still reads 47 of 60 units. Quota does not close itself.",
    art: "/comic/quota.jpg",
    jed: false,
  },
  {
    kicker: "Panel 02 · Boss Jed",
    title: "Walk-ins don’t wait.",
    copy: "Red jacket. Silver chain. Same-day energy. “If they sit, we close. Dream car pa rin.”",
    art: "/jed/jed-point.png",
    jed: true,
  },
  {
    kicker: "Panel 03 · The lot",
    title: "Tara na sa MCARS PH.",
    copy: "Keys on the lifts. Cones on the floor. Every key is a unit waiting to close.",
    art: "/comic/lot.jpg",
    jed: false,
  },
  {
    kicker: "Panel 04 · The chain",
    title: "Keys turn into cars.",
    copy: "Grab them fast. Buy is the minus. Sell is the plus. Profit is the score — ×1, ×2, ×3, ×4 as the combo climbs.",
    art: "/comic/combo.jpg",
    jed: false,
  },
  {
    kicker: "Panel 05 · Same-day",
    title: "Another day, another sold.",
    copy: "Hit the flag. Bank the quota. Iuwi mo na ‘yan — one day process, no bank approval.",
    art: "/comic/flag.jpg",
    jed: false,
  },
  {
    kicker: "Panel 06 · Boss John",
    title: "Fidelity Security.",
    copy: "When the lot gets ugly, summon Boss John. His guards lock a terracotta ring — navy uniforms, gold badges, nothing gets through.",
    art: "/sprites/powers/john.jpg",
    jed: false,
  },
];

export function ComicIntro({
  onPlay,
  onLots,
}: {
  onPlay: () => void;
  onLots: () => void;
}) {
  const [page, setPage] = useState(0);
  const last = page >= PANELS.length - 1;
  const panel = PANELS[page];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowRight") {
        e.preventDefault();
        if (last) onPlay();
        else setPage((p) => p + 1);
      }
      if (e.code === "Escape") onLots();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last, onPlay, onLots]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-bg">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
          Issue 01 · Q4 Quota
        </p>
        <button
          type="button"
          className="h-10 rounded-md px-3 text-sm text-muted hover:text-fg"
          {...bindPress(onLots)}
        >
          Skip
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-stretch px-3 pb-3">
        <article className="comic-panel relative flex min-h-0 w-full flex-col overflow-hidden rounded-lg border-[3px] border-fg bg-elevated">
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <ComicScene art={panel.art} jed={panel.jed} />
            <div className="pointer-events-none absolute left-3 top-3 max-w-[78%] rounded-sm bg-fg px-2.5 py-1.5 text-bg shadow-[3px_3px_0_#e10600]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                {panel.kicker}
              </p>
              <p className="font-display text-xl font-bold leading-none tracking-tight sm:text-2xl">
                {panel.title}
              </p>
            </div>
          </div>
          <div className="border-t-[3px] border-fg bg-surface px-4 py-3">
            <p className="text-sm leading-relaxed text-fg">{panel.copy}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex gap-1">
                {PANELS.map((_, i) => (
                  <span
                    key={i}
                    className={
                      "h-1.5 w-6 rounded-full " + (i <= page ? "bg-accent" : "bg-border")
                    }
                  />
                ))}
              </div>
              {last ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="h-11 rounded-md border border-border bg-elevated px-3 text-sm font-medium text-fg"
                    {...bindPress(onLots)}
                  >
                    Menu
                  </button>
                  <button
                    type="button"
                    className="flex h-11 items-center gap-1.5 rounded-md bg-accent px-4 font-display text-lg font-semibold text-accent-fg"
                    {...bindPress(onPlay)}
                  >
                    <Play className="size-4" />
                    Start Game
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="flex h-11 items-center gap-1.5 rounded-md bg-accent px-4 font-display text-lg font-semibold text-accent-fg"
                  {...bindPress(() => setPage((p) => p + 1))}
                >
                  Next
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

function ComicScene({ art, jed }: { art: string; jed: boolean }) {
  return (
    <div className="absolute inset-0 bg-bg">
      <img
        src={art}
        alt=""
        className={
          "h-full w-full " +
          (jed ? "object-cover object-[center_18%] comic-photo" : "object-cover object-center")
        }
        draggable={false}
      />
      <div className="comic-halftone" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_3px_#f4f4f5]" />
    </div>
  );
}
