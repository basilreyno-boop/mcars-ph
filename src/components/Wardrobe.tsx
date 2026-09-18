import { useEffect, useRef, type PointerEvent, type MouseEvent } from "react";
import { Check, Lock } from "lucide-react";
import { OUTFITS, isOutfitUnlocked, outfitById, portraitFor, type Outfit } from "@/game/outfits";
import type { CareerSave } from "@/game/garage";
import { JedShot } from "@/components/JedPop";
import { drawJedLite } from "@/game/jedLite";

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

export function Wardrobe({
  save,
  onBack,
  onEquip,
}: {
  save: Pick<CareerSave, "outfits" | "equippedOutfit" | "careerKeys" | "careerPesos" | "cars" | "bestTime" | "cellsBest">;
  onBack: () => void;
  onEquip: (id: string) => void;
}) {
  const worn = outfitById(save.equippedOutfit);
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-bg/70 p-3 sm:p-4">
      <div className="flex max-h-[min(92dvh,42rem)] w-full max-w-lg flex-col overflow-hidden border-2 border-border bg-surface/95 overlay-card pxl-frame">
        <div className="flex items-center gap-3 border-b-2 border-border px-4 py-3">
          <JedShot shot={worn.shot} className="size-12 shrink-0 sm:size-14 pxl-img" />
          <PixelJed outfitId={worn.id} />
          <div className="min-w-0 flex-1">
            <p className="font-pixel text-[10px] uppercase tracking-[0.18em] text-muted">Wardrobe</p>
            <h2 className="font-display text-2xl font-bold leading-none tracking-tight">{worn.name}</h2>
            <p className="mt-1 text-xs text-muted">{worn.jed}</p>
          </div>
          <button
            type="button"
            {...bindPress(onBack)}
            className="h-10 shrink-0 border-2 border-border px-3 font-pixel text-[10px] uppercase tracking-wide text-muted hover:text-fg"
          >
            Back
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            {OUTFITS.map((o) => {
              const open = save.outfits.includes(o.id) || isOutfitUnlocked(o, save as CareerSave);
              const on = save.equippedOutfit === o.id;
              return (
                <OutfitCard
                  key={o.id}
                  outfit={o}
                  open={open}
                  on={on}
                  onEquip={() => onEquip(o.id)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function OutfitCard({
  outfit,
  open,
  on,
  onEquip,
}: {
  outfit: Outfit;
  open: boolean;
  on: boolean;
  onEquip: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!open}
      {...(open ? bindPress(onEquip) : {})}
      className={
        "flex items-center gap-2 border-2 px-2 py-2 text-left enabled:active:scale-[0.98] disabled:opacity-45 " +
        (on ? "border-accent bg-elevated" : "border-border bg-elevated/80")
      }
    >
      <span className="relative size-14 shrink-0 overflow-hidden border-2 border-border bg-bg">
        <img
          src={portraitFor(outfit)}
          alt=""
          className="h-full w-full object-cover pxl-img"
          style={{ filter: outfit.filter || undefined }}
          draggable={false}
        />
        {!open ? (
          <span className="absolute inset-0 flex items-center justify-center bg-bg/70">
            <Lock className="size-4 text-muted" />
          </span>
        ) : on ? (
          <span className="absolute right-0.5 top-0.5 bg-accent p-0.5 text-accent-fg">
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-pixel text-[9px] uppercase tracking-[0.14em] text-gold">{outfit.tag}</span>
        <span className="block font-display text-base font-semibold leading-tight">{outfit.name}</span>
        <span className="block truncate text-[11px] text-muted">{open ? "Tap to wear" : outfit.hint}</span>
      </span>
    </button>
  );
}

function PixelJed({ outfitId }: { outfitId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t0 = performance.now();
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#0b0b0d";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.imageSmoothingEnabled = false;
      drawJedLite(ctx, c.width / 2, c.height - 6, 1, t, 1.35, outfitId, { pose: "idle" });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [outfitId]);
  return (
    <canvas
      ref={ref}
      width={72}
      height={88}
      className="size-[4.5rem] shrink-0 border-2 border-border bg-bg sm:size-20"
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    />
  );
}
