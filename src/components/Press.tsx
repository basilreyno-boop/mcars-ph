import type { PointerEvent, MouseEvent } from "react";
import { X } from "lucide-react";
import { JedShot } from "@/components/JedPop";
import { GAME_VERSION, JED_SHOT } from "@/game/types";

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

export function Press({ onClose }: { onClose: () => void }) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-bg/80 p-3 backdrop-blur-[2px] sm:p-4">
      <article className="max-h-[min(92dvh,46rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.45)] overlay-card">
        <div className="relative h-40 overflow-hidden sm:h-48">
          <img
            src={JED_SHOT.stage}
            alt=""
            className="h-full w-full object-cover object-[50%_18%]"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
          <button
            type="button"
            aria-label="Close letters"
            className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-md border border-border bg-surface/90 text-fg"
            {...bindPress(onClose)}
          >
            <X className="size-5" />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
              Press kit · v{GAME_VERSION}
            </p>
            <h2 className="font-display text-3xl font-bold leading-none tracking-tight text-fg sm:text-4xl">
              Same-Day Release
            </h2>
          </div>
        </div>

        <div className="space-y-6 px-4 py-5 sm:px-7 sm:py-6">
          <p className="text-sm leading-relaxed text-muted">
            A phone-first arcade about the last quarter on a Malabon lot. You are the closer. The
            unit is the loadout. Boss Jed is in your ear. Walk in. Drive out.
          </p>

          <section>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold">The pitch</p>
            <p className="mt-1 font-display text-xl font-semibold leading-tight text-fg">
              Twelve lots. Five arcades. One quota that does not close itself.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Platform the showroom. Hop EDSA traffic. Last on the lot. Shoot the quota. Take the
              banker's call. Slash eight Replevin Cells before the walk-ins take the unit back.
              Equip a used Fortuner and the whole board changes — speed, jump, armor, magnet, peek.
              Cars are items. Jed is the patch notes.
            </p>
          </section>

          <section className="rounded-lg border border-border bg-elevated p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-3">
              <JedShot shot="close" className="size-14 shrink-0" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
                  Letter to the player
                </p>
                <p className="font-display text-lg font-semibold leading-none text-fg">Tara na.</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              This is not a licensed product. It is a private tribute — a love letter to a stream,
              a lot, and the cadence of a closer who talks like the clock is always running. Pads
              live under the lot. A is left. D is right. Hold Jump for the full leap. In Cells, F
              slashes. Garage the unit you want; every arcade wears it. Bank keys. Unlock the
              Hilux. Miss a jump, take the checkpoint, go again. The quarter is fourteen days and
              you already wasted one reading this. Hit Start.
            </p>
          </section>

          <section className="rounded-lg border border-border bg-elevated p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-3">
              <JedShot shot="point" className="size-14 shrink-0" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
                  Letter to Jed
                </p>
                <p className="font-display text-lg font-semibold leading-none text-fg">Boss.</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              You did not ask for a video game. We made one anyway — because the catchphrases
              already played like power-ups, the lot already played like a stage, and the used
              cars already played like a garage RPG. Same-Day Release is invuln. No Bank Approval
              is speed. Replevin is a bounce. Music Box Timog is a jam. None of this is mockery.
              It is the highest compliment a player can pay a streamer: we wanted to be in the
              room. If the jump feels tight, that is the close. If the quota never fills, that is
              the bit. Iuwi mo na 'yan.
            </p>
          </section>

          <section>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold">On the board</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              <li>
                <span className="font-medium text-fg">Lots · </span>
                Twelve PH stages. Mario jump. Distinct pickups. Three-star medals.
              </li>
              <li>
                <span className="font-medium text-fg">EDSA Rush · </span>
                Drive the equipped unit. Hop bumpers. Don't eat traffic.
              </li>
              <li>
                <span className="font-medium text-fg">Lot Survival · </span>
                Jed rides the unit. Stomp walk-ins. Last on the lot.
              </li>
              <li>
                <span className="font-medium text-fg">Quota Invaders · </span>
                The car is the turret. Clear the Music Box ceiling.
              </li>
              <li>
                <span className="font-medium text-fg">Jed's Deal · </span>
                Twelve cases. The banker calls. Peek and offer scale with the loadout.
              </li>
              <li>
                <span className="font-medium text-fg">Replevin Cells · </span>
                Dead-Cells energy. Eight rooms. Slash, loot, flasks, permadeath.
              </li>
            </ul>
          </section>

          <p className="text-xs leading-relaxed text-subtle">
            A private build. Not affiliated with MCARS PH. Real stills of Jed stay on the messages
            and the letters. Power-ups wear their own badges. The unit you equip is the item you
            take into every mode.
          </p>
        </div>
      </article>
    </div>
  );
}
