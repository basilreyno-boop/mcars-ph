import type { PointerEvent, MouseEvent } from "react";
import { Check, Lock } from "lucide-react";
import type { HudMission } from "@/game/types";
import { formatPesos } from "@/game/types";

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

export function Missions({
  list,
  done,
  total,
  onBack,
}: {
  list: HudMission[];
  done: number;
  total: number;
  onBack: () => void;
}) {
  const open = list.filter((m) => !m.done);
  const closed = list.filter((m) => m.done);
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-bg/80 p-3 backdrop-blur-[2px] sm:p-4">
      <div className="flex max-h-[min(92dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.45)] overlay-card">
        <div className="flex items-end justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
              Quota board · {done}/{total}
            </p>
            <h2 className="font-display text-2xl font-bold leading-none tracking-tight">Missions</h2>
          </div>
          <button
            type="button"
            {...bindPress(onBack)}
            className="h-10 shrink-0 rounded-md border border-border px-3 text-sm text-muted hover:text-fg"
          >
            Back
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.round((done / Math.max(1, total)) * 100)}%` }}
            />
          </div>
          <ul className="flex flex-col gap-2">
            {open.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-border bg-elevated px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold leading-tight">{m.title}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted">{m.copy}</p>
                  </div>
                  <span className="shrink-0 font-display text-xs font-semibold text-gold">{m.reward}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-bg">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${Math.round((m.progress / Math.max(1, m.target)) * 100)}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-[11px] text-muted">
                    {m.target >= 1000
                      ? `${formatPesos(m.progress)}/${formatPesos(m.target)}`
                      : `${Math.min(m.progress, m.target)}/${m.target}`}
                  </span>
                </div>
              </li>
            ))}
            {closed.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-bg/40 px-3 py-2 opacity-70"
              >
                <Check className="size-4 shrink-0 text-gold" />
                <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold">{m.title}</span>
                <span className="shrink-0 text-[11px] text-muted">{m.reward}</span>
              </li>
            ))}
            {list.length === 0 ? (
              <li className="flex items-center gap-2 px-2 py-6 text-sm text-muted">
                <Lock className="size-4" />
                Quota still loading.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
