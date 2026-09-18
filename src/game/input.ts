const GAME_CODES = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "KeyA",
  "KeyD",
  "KeyW",
  "KeyS",
  "Space",
  "KeyP",
  "Escape",
  "KeyR",
  "KeyF",
  "KeyJ",
  "KeyK",
]);

function radialDeadzone(x: number, y: number, dz = 0.18) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = ((Math.min(1, m) - dz) / (1 - dz)) / m;
  return { x: x * scale, y: y * scale };
}

export class Input {
  keys = new Set<string>();
  injected: string[] | null = null;
  touchLeft = false;
  touchRight = false;
  touchJump = false;
  touchSlash = false;
  touchDown = false;
  touchAnalogX = 0;
  moveX = 0;
  jumpHeld = false;
  jumpPressed = false;
  slashHeld = false;
  slashPressed = false;
  downHeld = false;
  pausePressed = false;
  restartPressed = false;
  private prevJump = false;
  private prevSlash = false;
  private prevPause = false;
  private prevRestart = false;
  private attached = false;
  private jumpLatch = false;
  private slashLatch = false;

  private onDown = (e: KeyboardEvent) => {
    if (GAME_CODES.has(e.code)) e.preventDefault();
    this.keys.add(e.code);
    if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") this.jumpLatch = true;
    if (e.code === "KeyF" || e.code === "KeyJ" || e.code === "KeyK") this.slashLatch = true;
  };
  private onUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };
  private onBlur = () => {
    this.keys.clear();
    this.clearTouch();
  };
  private onVis = () => {
    if (document.hidden) this.onBlur();
  };

  attach() {
    if (this.attached) return;
    this.attached = true;
    window.addEventListener("keydown", this.onDown, { passive: false });
    window.addEventListener("keyup", this.onUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVis);
  }

  detach() {
    if (!this.attached) return;
    this.attached = false;
    window.removeEventListener("keydown", this.onDown);
    window.removeEventListener("keyup", this.onUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVis);
  }

  clearTouch() {
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
    this.touchSlash = false;
    this.touchDown = false;
    this.touchAnalogX = 0;
    this.jumpLatch = false;
    this.slashLatch = false;
  }

  latchJump() {
    this.jumpLatch = true;
    this.touchJump = true;
  }

  latchSlash() {
    this.slashLatch = true;
    this.touchSlash = true;
  }

  sample() {
    const c = new Set(this.injected ?? this.keys);
    let x = this.touchAnalogX;
    if (c.has("KeyA") || c.has("ArrowLeft") || this.touchLeft) x -= 1;
    if (c.has("KeyD") || c.has("ArrowRight") || this.touchRight) x += 1;

    let jump =
      c.has("Space") || c.has("KeyW") || c.has("ArrowUp") || this.touchJump || this.jumpLatch;
    let slash = c.has("KeyF") || c.has("KeyJ") || c.has("KeyK") || this.touchSlash || this.slashLatch;
    let down = c.has("KeyS") || c.has("ArrowDown") || this.touchDown;
    let pause = c.has("Escape") || c.has("KeyP");
    let restart = c.has("KeyR");

    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() ?? [] : [];
    for (const p of pads) {
      if (!p) continue;
      const stick = radialDeadzone(p.axes[0] ?? 0, p.axes[1] ?? 0, 0.18);
      x += stick.x;
      if (p.buttons[14]?.pressed) x -= 1;
      if (p.buttons[15]?.pressed) x += 1;
      if (p.buttons[0]?.pressed || p.buttons[1]?.pressed || p.buttons[12]?.pressed) jump = true;
      if (p.buttons[2]?.pressed || p.buttons[5]?.pressed) slash = true;
      if (p.buttons[13]?.pressed || stick.y > 0.5) down = true;
      if (p.buttons[9]?.pressed) pause = true;
      if (p.buttons[8]?.pressed) restart = true;
    }

    this.moveX = Math.max(-1, Math.min(1, x));
    this.downHeld = down;
    this.jumpHeld = jump || this.touchJump;
    this.jumpPressed = (jump && !this.prevJump) || this.jumpLatch;
    this.jumpLatch = false;
    this.prevJump = this.jumpHeld;
    this.slashHeld = slash || this.touchSlash;
    this.slashPressed = (slash && !this.prevSlash) || this.slashLatch;
    this.slashLatch = false;
    this.prevSlash = this.slashHeld;
    this.pausePressed = pause && !this.prevPause;
    this.prevPause = pause;
    this.restartPressed = restart && !this.prevRestart;
    this.prevRestart = restart;
  }
}

export type TouchState = {
  left?: boolean;
  right?: boolean;
  jump?: boolean;
  slash?: boolean;
  up?: boolean;
  down?: boolean;
  analogX?: number;
};

export function applyTouch(input: Input, t: TouchState) {
  if (t.left !== undefined) input.touchLeft = t.left;
  if (t.right !== undefined) input.touchRight = t.right;
  if (t.analogX !== undefined) input.touchAnalogX = Math.max(-1, Math.min(1, t.analogX));
  if (t.jump === true || t.up === true) input.latchJump();
  else if (t.jump === false) input.touchJump = false;
  if (t.slash === true) input.latchSlash();
  else if (t.slash === false) input.touchSlash = false;
  if (t.down !== undefined) input.touchDown = t.down;
}
