import { useState } from "react";
import { JED_SHOT, POWER_ICON, isPowerKind, type HudPopup } from "@/game/types";

export function JedFace({ className = "size-20" }: { className?: string }) {
  return <JedShot shot="close" className={className} />;
}

export function JedShot({
  shot = "close",
  className = "size-20",
  rounded = "full",
}: {
  shot?: keyof typeof JED_SHOT;
  className?: string;
  rounded?: "full" | "xl";
}) {
  const [ok, setOk] = useState(true);
  const round = rounded === "full" ? "rounded-full" : "rounded-xl";
  if (!ok) {
    return (
      <div
        className={
          "flex items-center justify-center border-2 border-accent bg-elevated font-display text-xl font-bold text-accent " +
          round +
          " " +
          className
        }
      >
        J
      </div>
    );
  }
  return (
    <img
      src={JED_SHOT[shot]}
      alt="Boss Jed"
      className={round + " object-cover " + className}
      draggable={false}
      onError={() => setOk(false)}
    />
  );
}

function PowerMedallion({ kind, className }: { kind: keyof typeof POWER_ICON; className: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <div
        className={
          "flex items-center justify-center rounded-xl border-2 border-gold bg-elevated font-display text-sm font-bold text-gold " +
          className
        }
      >
        ₱
      </div>
    );
  }
  return (
    <img
      src={POWER_ICON[kind]}
      alt=""
      className={"rounded-xl object-cover " + className}
      draggable={false}
      onError={() => setOk(false)}
    />
  );
}

export function JedPop({ popup }: { popup: HudPopup }) {
  const power = isPowerKind(popup.kind) ? popup.kind : null;
  const shot: keyof typeof JED_SHOT =
    popup.kind === "line" ? "point" : popup.kind === "rank" ? "stage" : "close";
  const kicker = power
    ? popup.kind === "john" || popup.kind === "fidelity"
      ? "BOSS JOHN"
      : "PICKUP"
    : popup.kind === "rank"
      ? "MUSIC BOX"
      : "BOSS JED";

  return (
    <div
      key={popup.id}
      className="pointer-events-none absolute inset-x-0 top-2 z-40 flex justify-center px-3 jed-pop"
    >
      <div className="flex max-w-md items-center gap-3 rounded-xl border border-accent bg-surface/95 py-2 pl-2 pr-3 shadow-[0_12px_40px_rgba(225,6,0,0.28)]">
        {power ? (
          <div className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-xl border-2 border-gold bg-elevated sm:size-20">
            <PowerMedallion kind={power} className="size-full" />
          </div>
        ) : (
          <div className="jed-orbit relative size-[4.5rem] shrink-0 sm:size-20">
            <span className="jed-ring" aria-hidden />
            <JedShot shot={shot} className="jed-face relative z-[1] size-full" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent">{kicker}</p>
          <p className="font-display text-xl font-bold leading-none tracking-tight text-fg sm:text-2xl">
            {popup.title}
          </p>
          <p className="mt-1 text-xs leading-snug text-muted sm:text-sm">{popup.copy}</p>
        </div>
      </div>
    </div>
  );
}
