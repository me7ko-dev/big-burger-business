// Всички звуци и музиката се генерират с Web Audio API — няма звукови файлове.

import { S } from '../data/save';

class Sfx {
  ctx: AudioContext | null = null;
  master!: GainNode;
  musicGain!: GainNode;
  noiseBuf!: AudioBuffer;
  private loops = new Map<string, { src: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode }>();
  private musicTimer: number | null = null;
  private musicStep = 0;
  private musicNext = 0;

  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const ch = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private get on(): boolean {
    return !!this.ctx && S().settings.sound;
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, delay = 0, slide = 0): void {
    if (!this.on) return;
    const c = this.ctx!;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, freq: number, q = 1, vol = 0.3, type: BiquadFilterType = 'bandpass', delay = 0): void {
    if (!this.on) return;
    const c = this.ctx!;
    const t = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  vibe(ms: number | number[]): void {
    if (S().settings.vibe && navigator.vibrate) navigator.vibrate(ms);
  }

  tap(): void { this.tone(660, 0.06, 'triangle', 0.18); }
  pop(): void { this.tone(420, 0.09, 'sine', 0.25, 0, 380); }
  place(): void { this.tone(300, 0.07, 'triangle', 0.22); this.noise(0.05, 1800, 2, 0.08); }
  chop(): void { this.noise(0.07, 2600, 3, 0.4); this.tone(180, 0.05, 'square', 0.08); }
  flip(): void { this.noise(0.12, 900, 1, 0.25); this.tone(250, 0.1, 'sine', 0.15, 0, 200); }
  coin(): void { this.tone(988, 0.08, 'square', 0.12); this.tone(1319, 0.22, 'square', 0.12, 0.07); }
  ding(): void { this.tone(1568, 0.35, 'sine', 0.22); this.tone(2093, 0.4, 'sine', 0.12, 0.02); }
  bell(): void { this.tone(1760, 0.5, 'triangle', 0.18); this.tone(2637, 0.4, 'sine', 0.08, 0.01); }
  serve(): void { this.tone(523, 0.08, 'triangle', 0.2); this.tone(784, 0.14, 'triangle', 0.2, 0.07); }
  whoosh(): void { this.noise(0.25, 700, 0.7, 0.25, 'bandpass'); }
  trash(): void { this.noise(0.2, 400, 1, 0.35, 'lowpass'); this.tone(120, 0.2, 'sawtooth', 0.12, 0, -60); }
  fail(): void { this.tone(220, 0.2, 'sawtooth', 0.15); this.tone(160, 0.35, 'sawtooth', 0.15, 0.18); }
  angry(): void { this.tone(190, 0.18, 'square', 0.12, 0, -40); this.tone(150, 0.3, 'square', 0.12, 0.16, -40); }
  salt(): void { for (let i = 0; i < 4; i++) this.noise(0.05, 6000, 2, 0.15, 'highpass', i * 0.06); }
  splash(): void { this.noise(0.4, 500, 0.8, 0.35, 'lowpass'); }
  sizzleHit(): void { this.noise(0.35, 4000, 0.6, 0.18, 'highpass'); }
  eat(): void { this.noise(0.06, 1200, 2, 0.2); this.noise(0.06, 1000, 2, 0.2, 'bandpass', 0.15); }
  combo(n: number): void { const base = 523 * Math.pow(1.12, n); [0, 0.07, 0.14].forEach((d, i) => this.tone(base * [1, 1.25, 1.5][i], 0.18, 'square', 0.1, d)); }
  levelUp(): void { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.25, 'square', 0.1, i * 0.09)); }
  fanfare(): void { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.2, i * 0.12)); this.tone(1047, 0.8, 'triangle', 0.18, 0.5); }
  star(i: number): void { this.tone(880 * Math.pow(1.26, i), 0.3, 'triangle', 0.22); this.tone(1760 * Math.pow(1.26, i), 0.25, 'sine', 0.08); }
  buy(): void { this.tone(784, 0.08, 'square', 0.12); this.tone(1047, 0.08, 'square', 0.12, 0.08); this.tone(1568, 0.2, 'square', 0.12, 0.16); }
  nope(): void { this.tone(200, 0.12, 'square', 0.1); }

  /** Постоянни звуци (цвъртене, наливане); сила 0 = изключено. */
  loop(id: 'sizzle' | 'fry' | 'pour', level: number): void {
    if (!this.ctx) return;
    let l = this.loops.get(id);
    if (!l) {
      if (level <= 0) return;
      const c = this.ctx;
      const src = c.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = id === 'pour' ? 'bandpass' : 'highpass';
      filter.frequency.value = id === 'sizzle' ? 3500 : id === 'fry' ? 2500 : 900;
      filter.Q.value = id === 'pour' ? 1.5 : 0.5;
      const gain = c.createGain();
      gain.gain.value = 0;
      src.connect(filter).connect(gain).connect(this.master);
      src.start();
      l = { src, gain, filter };
      this.loops.set(id, l);
    }
    const target = this.on ? Math.min(1, level) * (id === 'pour' ? 0.35 : 0.1) : 0;
    l.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
  }

  stopLoops(): void {
    for (const id of this.loops.keys()) this.loop(id as 'sizzle', 0);
  }

  // ------------------------------------------------------------ музика (весела мелодия на цикъл)
  startMusic(kind: 'menu' | 'game' = 'game'): void {
    if (!this.ctx) return;
    this.stopMusic();
    this.musicStep = 0;
    this.musicNext = this.ctx.currentTime + 0.1;
    const bpm = kind === 'game' ? 132 : 110;
    const step = 60 / bpm / 2;
    // C - Am - F - G, весела поп прогресия
    const chords = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]];
    const melody = kind === 'game'
      ? [72, 0, 76, 79, 76, 0, 72, 74, 72, 0, 69, 72, 76, 0, 74, 0, 69, 0, 72, 77, 76, 0, 72, 69, 71, 0, 74, 79, 77, 76, 74, 0]
      : [67, 0, 0, 72, 0, 71, 69, 0, 64, 0, 0, 69, 0, 67, 65, 0, 65, 0, 0, 69, 0, 67, 65, 0, 67, 0, 71, 0, 74, 0, 0, 0];
    const tick = () => {
      if (!this.ctx) return;
      while (this.musicNext < this.ctx.currentTime + 0.25) {
        const i = this.musicStep;
        const t = this.musicNext;
        const bar = Math.floor(i / 8) % 4;
        if (S().settings.music) {
          if (i % 2 === 0) this.note(chords[bar][0] - 12, t, step * 1.6, 'triangle', 0.5);
          if (i % 4 === 2) chords[bar].forEach((n) => this.note(n + 12, t, step * 0.9, 'square', 0.06));
          const m = melody[i % melody.length];
          if (m) this.note(m, t, step * 0.95, kind === 'game' ? 'square' : 'triangle', kind === 'game' ? 0.1 : 0.2);
          if (i % 4 === 0) this.hat(t, 0.08);
          if (i % 8 === 4) this.hat(t, 0.16, 1200);
        }
        this.musicStep++;
        this.musicNext += step;
      }
    };
    tick();
    this.musicTimer = window.setInterval(tick, 60);
  }

  private note(midi: number, t: number, dur: number, type: OscillatorType, vol: number): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private hat(t: number, vol: number, freq = 8000): void {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(f).connect(g).connect(this.musicGain);
    src.start(t, Math.random());
    src.stop(t + 0.08);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}

export const sfx = new Sfx();
