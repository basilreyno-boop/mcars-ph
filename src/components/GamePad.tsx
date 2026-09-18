import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

type HoldFn = (on: boolean) => void;
type StickFn = (x: number, y: number) => void;

const DZ = 0.16;

function radial(x: number, y: number, dz = DZ) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const mag = Math.min(1, m);
  const scale = ((mag - dz) / (1 - dz)) / m;
  return { x: x * scale, y: y * scale };
}

function HoldButton({
  label,
  children,
  onHold,
  live,
  className,
  retrigger,
}: {
  label: string;
  children: ReactNode;
  onHold: HoldFn;
  live: boolean;
  className: string;
  retrigger?: boolean;
}) {
  const heldRef = useRef(false);
  const ids = useRef(new Set<number>());
  const holdFn = useRef(onHold);
  holdFn.current = onHold;
  const [held, setHeld] = useState(false);

  function start(id: number) {
    if (!live) return;
    ids.current.add(id);
    if (!heldRef.current) {
      heldRef.current = true;
      setHeld(true);
      holdFn.current(true);
    } else if (retrigger) {
      holdFn.current(true);
    }
  }
  function end(id: number) {
    ids.current.delete(id);
    if (ids.current.size === 0 && heldRef.current) {
      heldRef.current = false;
      setHeld(false);
      holdFn.current(false);
    }
  }

  useEffect(() => {
    if (!live && heldRef.current) {
      ids.current.clear();
      heldRef.current = false;
      setHeld(false);
      holdFn.current(false);
    }
  }, [live]);

  useEffect(
    () => () => {
      if (heldRef.current) {
        heldRef.current = false;
        holdFn.current(false);
      }
    },
    [],
  );

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={held}
      disabled={!live}
      data-held={held ? "1" : "0"}
      className={className}
      style={{ touchAction: "none" }}
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
        if (!live) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        start(e.pointerId);
      }}
      onPointerUp={(e) => end(e.pointerId)}
      onPointerCancel={(e) => end(e.pointerId)}
      onLostPointerCapture={(e) => end(e.pointerId)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

function AnalogStick({ live, onMove }: { live: boolean; onMove: StickFn }) {
  const wellRef = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);
  const moveFn = useRef(onMove);
  moveFn.current = onMove;
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [held, setHeld] = useState(false);

  function emit(x: number, y: number) {
    setKnob({ x, y });
    moveFn.current(x, y);
  }

  function fromEvent(e: PointerEvent<HTMLDivElement>) {
    const el = wellRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const max = Math.min(r.width, r.height) * 0.42;
    if (max < 4) return { x: 0, y: 0 };
    const dx = (e.clientX - (r.left + r.width / 2)) / max;
    const dy = (e.clientY - (r.top + r.height / 2)) / max;
    return radial(dx, dy);
  }

  function release() {
    pid.current = null;
    setHeld(false);
    emit(0, 0);
  }

  useEffect(() => {
    if (!live && pid.current !== null) release();
  }, [live]);

  useEffect(
    () => () => {
      if (pid.current !== null) moveFn.current(0, 0);
    },
    [],
  );

  return (
    <div
      ref={wellRef}
      role="slider"
      aria-label="Move"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={knob.x}
      className="stick-well pointer-events-auto relative shrink-0"
      data-held={held ? "1" : "0"}
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        if (!live) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        pid.current = e.pointerId;
        setHeld(true);
        const v = fromEvent(e);
        emit(v.x, v.y);
      }}
      onPointerMove={(e) => {
        if (pid.current !== e.pointerId) return;
        e.preventDefault();
        const v = fromEvent(e);
        emit(v.x, v.y);
      }}
      onPointerUp={(e) => {
        if (pid.current === e.pointerId) release();
      }}
      onPointerCancel={(e) => {
        if (pid.current === e.pointerId) release();
      }}
      onLostPointerCapture={(e) => {
        if (pid.current === e.pointerId) release();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="stick-ring" />
      <span
        className="stick-knob"
        style={{
          transform: `translate(calc(-50% + ${knob.x * 1.72}rem), calc(-50% + ${knob.y * 1.72}rem))`,
        }}
      />
    </div>
  );
}

function Face({
  label,
  sub,
  glyph,
  tone,
  onHold,
  live,
  retrigger,
}: {
  label: string;
  sub: string;
  glyph: ReactNode;
  tone: "cross" | "circle" | "square" | "tri";
  onHold: HoldFn;
  live: boolean;
  retrigger?: boolean;
}) {
  return (
    <HoldButton
      label={`${label} ${sub}`}
      onHold={onHold}
      live={live}
      retrigger={retrigger}
      className={"face-btn face-" + tone}
    >
      <span className="face-glyph" aria-hidden>
        {glyph}
      </span>
      <span className="face-sub">{sub}</span>
    </HoldButton>
  );
}

const GlyphX = (
  <svg viewBox="0 0 24 24" className="size-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="2.6">
    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
  </svg>
);
const GlyphO = (
  <svg viewBox="0 0 24 24" className="size-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="2.6">
    <circle cx="12" cy="12" r="7.2" />
  </svg>
);
const GlyphSq = (
  <svg viewBox="0 0 24 24" className="size-[1.05rem]" fill="none" stroke="currentColor" strokeWidth="2.6">
    <rect x="6.2" y="6.2" width="11.6" height="11.6" rx="1.2" />
  </svg>
);
const GlyphTri = (
  <svg viewBox="0 0 24 24" className="size-[1.1rem]" fill="none" stroke="currentColor" strokeWidth="2.6">
    <path d="M12 5.4L19.4 18.2H4.6L12 5.4z" strokeLinejoin="round" />
  </svg>
);

export function GamePad({
  live,
  hintCross,
  hintCircle,
  onStick,
  onCross,
  onCircle,
  onSquare,
  onTriangle,
}: {
  live: boolean;
  hintCross: string;
  hintCircle: string;
  onStick: StickFn;
  onCross: HoldFn;
  onCircle: HoldFn;
  onSquare: HoldFn;
  onTriangle: HoldFn;
}) {
  return (
    <div
      className={
        "pad-overlay pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 px-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] sm:px-5 " +
        (live ? "" : "opacity-35")
      }
    >
      <AnalogStick live={live} onMove={onStick} />

      <div className="ps-diamond pointer-events-none relative shrink-0">
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <Face label="Triangle" sub="UP" glyph={GlyphTri} tone="tri" onHold={onTriangle} live={live} retrigger />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <Face label="Cross" sub={hintCross} glyph={GlyphX} tone="cross" onHold={onCross} live={live} retrigger />
        </div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          <Face label="Square" sub="DOWN" glyph={GlyphSq} tone="square" onHold={onSquare} live={live} />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <Face label="Circle" sub={hintCircle} glyph={GlyphO} tone="circle" onHold={onCircle} live={live} retrigger />
        </div>
      </div>
    </div>
  );
}
