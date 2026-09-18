export class Sfx {
  private ctx: AudioContext | null = null;

  unlock() {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) this.ctx = new AC();
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  private jitter(base: number, amt = 0.08) {
    return base * (1 + (Math.random() * 2 - 1) * amt);
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType = "square",
    gain = 0.07,
    slide = 0,
  ) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(this.jitter(freq, 0.06), t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(this.jitter(gain, 0.12), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  jump() {
    this.tone(440, 0.08, "square", 0.05, 200);
  }
  doubleJump() {
    this.tone(580, 0.09, "square", 0.05, 240);
    this.tone(900, 0.07, "triangle", 0.03, 80);
  }
  coin() {
    this.tone(980, 0.07, "square", 0.05);
    this.tone(1480, 0.1, "square", 0.03);
  }
  combo(n: number) {
    const step = Math.max(1, Math.min(12, n));
    const f = 720 + step * 85;
    this.tone(f, 0.06, "square", 0.05);
    this.tone(f * 1.5, 0.11, "triangle", 0.035, 120);
    if (step >= 4) this.tone(f * 2, 0.08, "square", 0.03);
  }
  peso() {
    this.tone(740, 0.06, "square", 0.045);
    this.tone(1100, 0.09, "triangle", 0.03);
  }
  checkpoint() {
    this.tone(520, 0.1, "triangle", 0.05);
    this.tone(780, 0.16, "triangle", 0.04);
  }
  death() {
    this.tone(220, 0.22, "sawtooth", 0.055, -160);
  }
  win() {
    this.tone(523, 0.12, "square", 0.05);
    this.tone(659, 0.16, "square", 0.05);
    this.tone(784, 0.28, "square", 0.06);
  }
  land() {
    this.tone(110, 0.04, "sine", 0.03);
  }
  step() {
    this.tone(90, 0.028, "sine", 0.014);
  }
  power() {
    this.tone(392, 0.07, "square", 0.05, 80);
    this.tone(523, 0.1, "triangle", 0.05, 160);
    this.tone(784, 0.14, "square", 0.04);
  }
  stomp() {
    this.tone(160, 0.08, "square", 0.05, -40);
    this.tone(90, 0.1, "sine", 0.04);
  }
  slash() {
    this.tone(620, 0.05, "square", 0.045, -180);
    this.tone(180, 0.08, "sawtooth", 0.04, -80);
  }
  unlockChime() {
    this.tone(392, 0.08, "square", 0.05, 80);
    this.tone(523, 0.12, "triangle", 0.05, 160);
    this.tone(784, 0.18, "square", 0.045);
    this.tone(1046, 0.22, "triangle", 0.03);
  }
  summon() {
    this.tone(196, 0.16, "sawtooth", 0.05, 80);
    this.tone(392, 0.2, "square", 0.05, 120);
    this.tone(587, 0.24, "triangle", 0.045, 180);
    this.tone(784, 0.3, "square", 0.035);
  }
  shield() {
    this.tone(330, 0.14, "triangle", 0.05, 40);
    this.tone(440, 0.2, "sine", 0.04);
    this.tone(660, 0.26, "triangle", 0.035, 80);
  }
}
