class SoundService {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmAudio: HTMLAudioElement | null = null;
  private volume: number = 0.6;
  private readonly bgmVolume = 0.18;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.sfxGain = this.ctx.createGain();
        
        this.sfxGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

        this.sfxGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.sfxGain) {
      const targetSfx = this.isMuted ? 0 : this.volume;
      this.sfxGain.gain.setTargetAtTime(targetSfx, this.ctx.currentTime, 0.05);
    }
    if (this.bgmAudio) this.bgmAudio.volume = this.isMuted ? 0 : this.volume * this.bgmVolume;
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- Sound Effects ---

  // 1. Piece Reveal: Crisp futuristic mechanical 3D tile flip
  public playPieceClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // 2. Correct Answer: Bright majestic chime (C - E - G - C major chord progression)
  public playCorrect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.55);
    });
  }

  // 3. Wrong Answer: Gentle low synth buzzer
  public playWrong() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.25);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // 4. Combo Fanfare: Rising sparkle chords
  public playCombo(comboCount: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const baseF = Math.min(1200, 440 + comboCount * 70);
    const freqs = [baseF, baseF * 1.25, baseF * 1.5, baseF * 2];
    freqs.forEach((f, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  // 5. Timer Tick (Under 10 seconds urgency)
  public playTick(isUrgent: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isUrgent ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 880 : 587.33, t);

    gain.gain.setValueAtTime(isUrgent ? 0.15 : 0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playTimeUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const duration = 0.7;
    const frames = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }

    const noise = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const noiseGain = this.ctx.createGain();
    noise.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + duration);
    noiseGain.gain.setValueAtTime(0.34, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + duration);

    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(110, t);
    bass.frequency.exponentialRampToValueAtTime(38, t + 0.45);
    bassGain.gain.setValueAtTime(0.4, t);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    bass.connect(bassGain);
    bassGain.connect(this.sfxGain);
    bass.start(t);
    bass.stop(t + 0.52);
  }

  // 6. Fireworks celebration for victory podium
  public playFireworks() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    for (let burst = 0; burst < 3; burst++) {
      const delay = burst * 0.28;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150 + Math.random() * 80, t);
      osc.frequency.exponentialRampToValueAtTime(600 + Math.random() * 400, t + 0.2);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.5);
    }
  }

  // --- Background music ---
  public async startBgm(): Promise<boolean> {
    if (this.bgmAudio) return this.isBgmPlaying;

    const audio = new Audio('/assets/Afternoon_at_the_Lobby.mp3');
    audio.loop = true;
    audio.volume = this.isMuted ? 0 : this.volume * this.bgmVolume;
    this.bgmAudio = audio;

    try {
      await audio.play();
      if (this.bgmAudio !== audio) {
        audio.pause();
        return false;
      }
      this.isBgmPlaying = true;
      return true;
    } catch (error) {
      if (this.bgmAudio === audio) this.bgmAudio = null;
      this.isBgmPlaying = false;
      console.error('Could not play background music:', error);
      return false;
    }
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    this.bgmAudio?.pause();
    this.bgmAudio = null;
  }

  public toggleBgm(): Promise<boolean> {
    if (this.bgmAudio) {
      this.stopBgm();
      return Promise.resolve(false);
    }
    return this.startBgm();
  }

  public getIsBgmPlaying(): boolean {
    return this.isBgmPlaying;
  }
}

export const soundService = new SoundService();
