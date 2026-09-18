import type { PointerEvent, MouseEvent } from "react";
import { Check, Lock } from "lucide-react";
import { USED_CARS, rankFor, type CareerSave } from "@/game/garage";
import { formatPesos } from "@/game/types";
import { JedFace } from "@/components/JedPop";
import { resolveLoadout } from "@/game/loadout";

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

export function Garage({
  save,
  onBack,
  onEquip,
}: {
  save: Pick<CareerSave, "cars" | "equipped" | "careerKeys" | "careerPesos">;
  onBack: () => void;
  onEquip: (id: string) => void;
}) {
  const rank = rankFor({ cars: save.cars });
  const equipped = resolveLoadout(save.equipped);
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-bg/80 p-3 backdrop-blur-[2px] sm:p-4">
      <div className="flex max-h-[min(92dvh,42rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.45)] overlay-card">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <JedFace className="size-12 shrink-0 sm:size-14" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
              Loadout · Used lot
            </p>
            <h2 className="font-display text-2xl font-bold leading-none tracking-tight">{rank}</h2>
            <p className="mt-1 text-xs text-muted">
              {save.cars.length}/{USED_CARS.length} units · {save.careerKeys} keys ·{" "}
              {formatPesos(save.careerPesos)}
            </p>
          </div>
          <button
            type="button"
            {...bindPress(onBack)}
            className="h-10 shrink-0 rounded-md border border-border px-3 text-sm text-muted hover:text-fg"
          >
            Back
          </button>
        </div>
        <div className="border-b border-border bg-elevated px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md bg-bg">
              <img
                src={equipped.kind === "suv" ? "/sprites/suv.png" : "/sprites/sedan.png"}
                alt=""
                className="h-full w-full object-contain object-bottom"
                style={{ filter: `hue-rotate(${equipped.hue}deg) saturate(1.15)` }}
                draggable={false}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold leading-tight">
                {equipped.year} {equipped.name}{" "}
                <span className="text-gold">{equipped.tag}</span>
              </p>
              <p className="text-[12px] leading-snug text-muted">{equipped.passive}</p>
            </div>
          </div>
          <dl className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 text-[11px] leading-snug sm:grid-cols-2">
            <div>
              <dt className="text-subtle">Lots</dt>
              <dd className="text-fg">{equipped.lotsLine}</dd>
            </div>
            <div>
              <dt className="text-subtle">EDSA Rush</dt>
              <dd className="text-fg">{equipped.rushLine}</dd>
            </div>
            <div>
              <dt className="text-subtle">Survival</dt>
              <dd className="text-fg">{equipped.survLine}</dd>
            </div>
            <div>
              <dt className="text-subtle">Invaders</dt>
              <dd className="text-fg">{equipped.invLine}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-subtle">Jed's Deal</dt>
              <dd className="text-fg">{equipped.dealLine}</dd>
            </div>
          </dl>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {USED_CARS.map((car) => {
              const open = save.cars.includes(car.id);
              const on = save.equipped === car.id;
              return (
                <button
                  key={car.id}
                  type="button"
                  disabled={!open}
                  {...(open ? bindPress(() => onEquip(car.id)) : {})}
                  className={
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-transform duration-150 enabled:active:scale-[0.99] disabled:opacity-45 " +
                    (on ? "border-accent bg-elevated" : "border-border bg-elevated")
                  }
                >
                  <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md bg-bg">
                    <img
                      src={car.kind === "suv" ? "/sprites/suv.png" : "/sprites/sedan.png"}
                      alt=""
                      className="h-full w-full object-contain object-bottom"
                      style={{ filter: `hue-rotate(${car.hue}deg) saturate(1.15)` }}
                      draggable={false}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base font-semibold leading-tight">
                      {car.year} {car.name}
                    </span>
                    <span className="block text-[11px] text-muted">
                      {open ? (
                        <>
                          <span className="text-gold">{car.perk.tag}</span>
                          {" · "}
                          {car.perk.passive}
                        </>
                      ) : (
                        car.hint
                      )}
                    </span>
                  </span>
                  {open ? (
                    on ? (
                      <Check className="size-4 shrink-0 text-accent" />
                    ) : null
                  ) : (
                    <Lock className="size-3.5 shrink-0 text-subtle" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 px-1 text-xs leading-relaxed text-subtle">
            Equip a unit. It is your loadout on every lot and every arcade — perks like Dota items.
            Swap here, then close.
          </p>
        </div>
      </div>
    </div>
  );
}
