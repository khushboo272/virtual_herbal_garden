// ──────────────────────────────────────────────────────────
// utils/proceduralAudio.ts — Zero-Asset Procedural Web Audio Soundscape
// Synthesizes natural foliage wind, cascading pond water, daytime bird chirps,
// and nocturnal crickets without requiring any external MP3 files.
// ──────────────────────────────────────────────────────────

export class ProceduralGardenSoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private waterGain: GainNode | null = null;
  private creatureTimer: any = null;
  private isRunning = false;
  private isNight = false;
  private volume = 0.7;

  private initContext(): boolean {
    if (this.ctx) return true;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      return true;
    } catch (e) {
      console.warn('[ProceduralAudio] Web Audio API initialization failed:', e);
      return false;
    }
  }

  /**
   * Generates a 3-second looping pink/brown noise buffer for wind and water
   */
  private createNoiseBuffer(durationSec = 3): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * durationSec;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration filter
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Compensate amplitude
    }
    return buffer;
  }

  /**
   * Starts the gentle canopy breeze / wind in leaves
   */
  private startWind() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(3);
    if (!noiseBuffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Lowpass filter for foliage rustling
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    // LFO to modulate wind gusts (0.12 Hz)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    lfo.start();
    noiseSource.start();
  }

  /**
   * Starts running water / waterfall trickle near the pond
   */
  private startWater() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(2);
    if (!noiseBuffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Bandpass filter to simulate splashing water
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    // Subtle water bubble LFO modulation
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.35, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(150, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(this.waterGain);
    this.waterGain.connect(this.masterGain);

    lfo.start();
    noiseSource.start();
  }

  /**
   * Procedural bird chirp (daytime)
   */
  private playBirdChirp() {
    if (!this.ctx || !this.masterGain || !this.isRunning || this.isNight) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Randomize chirp base frequency between 2200 and 3200 Hz
    const baseFreq = 2200 + Math.random() * 1000;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, now + 0.14);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Procedural night crickets (nighttime)
   */
  private playCricketChirp() {
    if (!this.ctx || !this.masterGain || !this.isRunning || !this.isNight) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(4600 + Math.random() * 400, now);

    // Stridulation pulses (3 rapid bursts)
    gain.gain.setValueAtTime(0, now);
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.04;
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.setValueAtTime(0.001, t + 0.025);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  private scheduleNextCreature() {
    if (!this.isRunning) return;
    const delay = this.isNight ? 1200 + Math.random() * 1800 : 3500 + Math.random() * 5500;
    this.creatureTimer = setTimeout(() => {
      if (this.isNight) {
        this.playCricketChirp();
      } else {
        this.playBirdChirp();
      }
      this.scheduleNextCreature();
    }, delay);
  }

  /**
   * Activates or resumes audio output
   */
  public start(volume = 0.7, isNight = false) {
    if (!this.initContext()) return;
    this.volume = volume;
    this.isNight = isNight;

    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this.startWind();
      this.startWater();
      this.scheduleNextCreature();
    }

    this.setVolume(volume);
  }

  public stop() {
    this.isRunning = false;
    if (this.creatureTimer) {
      clearTimeout(this.creatureTimer);
      this.creatureTimer = null;
    }
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume * 0.45, now + 0.08);
    }
  }

  public setNight(isNight: boolean) {
    this.isNight = isNight;
    // Water and wind become slightly quieter at night
    if (this.ctx && this.windGain && this.waterGain) {
      const now = this.ctx.currentTime;
      this.windGain.gain.linearRampToValueAtTime(isNight ? 0.18 : 0.28, now + 1.0);
      this.waterGain.gain.linearRampToValueAtTime(isNight ? 0.15 : 0.22, now + 1.0);
    }
  }

  public updatePlayerDistanceToPond(distToPondMeters: number) {
    if (!this.ctx || !this.waterGain) return;
    // Water volume attenuates with distance from pond
    // Full volume within 12m, drops off by 40m
    const factor = Math.max(0.15, Math.min(1.0, 1 - (distToPondMeters - 10) / 30));
    const now = this.ctx.currentTime;
    this.waterGain.gain.linearRampToValueAtTime(0.25 * factor, now + 0.1);
  }

  public dispose() {
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

// Global singleton instance for the garden
export const gardenSoundscape = new ProceduralGardenSoundscape();

