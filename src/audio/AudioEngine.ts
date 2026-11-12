/* src/audio/AudioEngine.ts */
export class AudioEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private unlocked = false;
  private bgmTimer = 0;
  private bgmPlaying = false;
  private bgmSequence: Array<{ time: number; fn: () => void }> = [];
  private scheduleHandle: number | null = null;

  constructor() {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AC();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.25;
    this.masterGain.connect(this.ctx.destination);
    this.buildBGMSequence();
  }

  async unlock(): Promise<void> {
    if (this.unlocked) return;
    await this.ctx.resume();
    this.unlocked = true;
  }

  setMasterVolume(v: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, v));
  }

  getMasterVolume(): number {
    return this.masterGain.gain.value;
  }

  toggleMute(): boolean {
    if (this.masterGain.gain.value > 0) {
      this.masterGain.gain.value = 0;
      return true;
    } else {
      this.masterGain.gain.value = 0.25;
      return false;
    }
  }

  /* ---- Low-level primitives ---- */
  private createOsc(freq: number, type: OscillatorType, gainVal: number, dest: AudioNode) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = gainVal;
    osc.connect(gain).connect(dest);
    return { osc, gain };
  }

  private createNoise(bufferSize = 4096): AudioBufferSourceNode {
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    return src;
  }

  private env(gain: GainNode, a: number, d: number, s: number, r: number, peak = 1) {
    const now = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + a);
    gain.gain.linearRampToValueAtTime(s * peak, now + a + d);
    return {
      release: () => gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + r),
    };
  }

  /* ---- High-level SFX ---- */
  playShoot(): void {
    const { osc, gain } = this.createOsc(880, 'square', 0.18, this.masterGain);
    const e = this.env(gain, 0.005, 0.04, 0, 0.02);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
    setTimeout(() => e.release(), 50);
  }

  playHit(): void {
    const src = this.createNoise(2048);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 2;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.12;
    src.connect(filter).connect(gain).connect(this.masterGain);
    const e = this.env(gain, 0.001, 0.08, 0, 0.02);
    src.start();
    src.stop(this.ctx.currentTime + 0.12);
    setTimeout(() => e.release(), 90);
  }

  playExplosion(): void {
    const src = this.createNoise(8192);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.25;
    src.connect(filter).connect(gain).connect(this.masterGain);
    const e = this.env(gain, 0.01, 0.35, 0.1, 0.15);
    src.start();
    src.stop(this.ctx.currentTime + 0.5);
    setTimeout(() => e.release(), 400);
  }

  playPowerUp(): void {
    const notes = [659.25, 880, 1318.5, 1760];
    notes.forEach((f, i) => {
      setTimeout(() => {
        const { osc, gain } = this.createOsc(f, 'sine', 0.1, this.masterGain);
        const e = this.env(gain, 0.01, 0.06, 0, 0.04);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
        setTimeout(() => e.release(), 70);
      }, i * 55);
    });
  }

  playWaveComplete(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      setTimeout(() => {
        const { osc, gain } = this.createOsc(f, 'triangle', 0.12, this.masterGain);
        const e = this.env(gain, 0.01, 0.1, 0.2, 0.05);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
        setTimeout(() => e.release(), 120);
      }, i * 80);
    });
  }

  /* ---- BGM: 4 bars × 120BPM loop ---- */
  private buildBGMSequence(): void {
    const bpm = 120;
    const beat = 60 / bpm;
    const bar = beat * 4;
    const loopBars = 4;
    const total = bar * loopBars;

    // Drums
    for (let b = 0; b < total; b += beat) {
      const beatNum = b / beat;
      const isKick = beatNum % 4 === 0;
      const isSnare = beatNum % 4 === 2;
      if (isKick || isSnare) {
        this.bgmSequence.push({ time: b, fn: () => this.playKick(isKick) });
      }
      // Hi-hat 8th notes
      if (beatNum % 0.5 === 0) {
        this.bgmSequence.push({ time: b, fn: () => this.playHat() });
      }
    }

    // Bass
    const bassNotes = [55, 55, 73.42, 65.41];
    bassNotes.forEach((f, i) => {
      this.bgmSequence.push({ time: i * bar, fn: () => this.playBass(f, bar) });
    });

    // Lead melody
    const lead = [
      { t: 0, n: 440 },
      { t: 0.5, n: 523.25 },
      { t: 1, n: 587.33 },
      { t: 1.5, n: 659.25 },
      { t: 2, n: 523.25 },
      { t: 2.5, n: 493.88 },
      { t: 3, n: 440 },
      { t: 3.5, n: 0 },
    ];
    lead.forEach(({ t, n }) => {
      if (n) this.bgmSequence.push({ time: t * beat, fn: () => this.playLead(n, beat * 0.4) });
    });
  }

  private playKick(isKick: boolean): void {
    const { osc, gain } = this.createOsc(isKick ? 55 : 180, 'sine', 0.35, this.masterGain);
    const e = this.env(gain, 0.001, isKick ? 0.15 : 0.05, 0, 0.02);
    osc.frequency.exponentialRampToValueAtTime(isKick ? 35 : 120, this.ctx.currentTime + 0.08);
    osc.start();
    osc.stop(this.ctx.currentTime + (isKick ? 0.2 : 0.1));
    setTimeout(() => e.release(), isKick ? 160 : 60);
  }

  private playHat(): void {
    const src = this.createNoise(512);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.04;
    src.connect(filter).connect(gain).connect(this.masterGain);
    const e = this.env(gain, 0.001, 0.02, 0, 0.01);
    src.start();
    src.stop(this.ctx.currentTime + 0.04);
    setTimeout(() => e.release(), 30);
  }

  private playBass(freq: number, dur: number): void {
    const { osc, gain } = this.createOsc(freq, 'sawtooth', 0.12, this.masterGain);
    const e = this.env(gain, 0.02, dur * 0.6, 0.3, 0.1);
    osc.start();
    osc.stop(this.ctx.currentTime + dur * 0.95);
    setTimeout(() => e.release(), dur * 900);
  }

  private playLead(freq: number, dur: number): void {
    const { osc, gain } = this.createOsc(freq, 'square', 0.08, this.masterGain);
    const e = this.env(gain, 0.01, dur * 0.5, 0.2, 0.05);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
    setTimeout(() => e.release(), dur * 800);
  }

  startBGM(): void {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.bgmTimer = this.ctx.currentTime;
    this.scheduleNext();
  }

  stopBGM(): void {
    this.bgmPlaying = false;
    if (this.scheduleHandle !== null) {
      clearTimeout(this.scheduleHandle);
      this.scheduleHandle = null;
    }
  }

  private scheduleNext(): void {
    if (!this.bgmPlaying) return;
    const now = this.ctx.currentTime;
    const elapsed = now - this.bgmTimer;
    const bar = 60 / 120 * 4;
    const loopBars = 4;
    const total = bar * loopBars;

    // Schedule events in the next ~200ms window
    for (const ev of this.bgmSequence) {
      const at = this.bgmTimer + ev.time;
      if (at > now && at < now + 0.2) {
        setTimeout(ev.fn, (at - now) * 1000);
      }
    }

    // Handle loop wrap
    const nextLoop = this.bgmTimer + total;
    if (nextLoop - now < 0.5) {
      this.bgmTimer = nextLoop;
    }

    // Schedule next check
    const nextCheck = Math.min(200, (total - (elapsed % total)) * 1000);
    this.scheduleHandle = window.setTimeout(() => this.scheduleNext(), nextCheck);
  }

  getContext(): AudioContext {
    return this.ctx;
  }
}

export const audioEngine = new AudioEngine();