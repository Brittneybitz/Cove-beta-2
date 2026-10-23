class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientOscs: (OscillatorNode | AudioBufferSourceNode)[] = [];
  private ambientActive: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ambientGain) {
      this.ambientGain.gain.value = muted ? 0 : 0.12;
    }
  }

  public getMuted() {
    return this.muted;
  }

  public isAmbientMusicPlaying() {
    return this.ambientActive;
  }

  public startOceanAmbientMusic() {
    if (this.ambientActive) return;
    this.initCtx();
    if (!this.ctx) return;

    this.ambientActive = true;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.muted ? 0 : 0.01, this.ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(this.muted ? 0 : 0.12, this.ctx.currentTime + 3.0);
    this.ambientGain.connect(this.ctx.destination);

    // Warm chord pads: D minor 9 (D3, F3, A3, C4, E4)
    const padNotes = [146.83, 174.61, 220.0, 261.63, 329.63];
    padNotes.forEach((freq, idx) => {
      if (!this.ctx || !this.ambientGain) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320 + idx * 80, this.ctx.currentTime);

      // Low subtle volume per voice
      oscGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(this.ambientGain);

      osc.start();
      this.ambientOscs.push(osc);
    });

    // Gentle filtered ocean wave wash generator
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const waveFilter = this.ctx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.setValueAtTime(180, this.ctx.currentTime);

    // LFO to swell the ocean waves slowly
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // one swell every ~8 seconds
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);
    lfo.connect(waveFilter.frequency);

    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    noiseSource.connect(waveFilter);
    waveFilter.connect(waveGain);
    waveGain.connect(this.ambientGain);

    lfo.start();
    noiseSource.start();
    this.ambientOscs.push(lfo, noiseSource);
  }

  public stopOceanAmbientMusic() {
    if (!this.ambientActive) return;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
    }
    setTimeout(() => {
      this.ambientOscs.forEach((n) => {
        try {
          n.stop();
          n.disconnect();
        } catch {}
      });
      this.ambientOscs = [];
      this.ambientActive = false;
      this.ambientGain = null;
    }, 1600);
  }

  public toggleOceanAmbientMusic() {
    if (this.ambientActive) {
      this.stopOceanAmbientMusic();
      return false;
    } else {
      this.startOceanAmbientMusic();
      return true;
    }
  }

  // Authentic Pokémon-style victory fanfare
  public playPokemonVictoryFanfare() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Classic Pokémon victory fanfare: C5, C5, C5, C5, G#4, A#4, C5 (hold), then G4, A#4, C5
    const notes = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 523.25, d: 0.12, t: 0.14 },
      { f: 523.25, d: 0.12, t: 0.28 },
      { f: 523.25, d: 0.28, t: 0.42 },
      { f: 415.30, d: 0.24, t: 0.74 },
      { f: 466.16, d: 0.24, t: 1.0 },
      { f: 523.25, d: 0.55, t: 1.26 },
      { f: 466.16, d: 0.16, t: 1.84 },
      { f: 523.25, d: 0.65, t: 2.02 },
    ];

    const now = this.ctx.currentTime;
    notes.forEach((item) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + item.t;

      osc.type = 'triangle';
      osc2.type = 'sawtooth';
      osc.frequency.setValueAtTime(item.f, t);
      osc2.frequency.setValueAtTime(item.f * 1.002, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.02);
      gain.gain.setValueAtTime(0.2, t + item.d * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, t + item.d);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc2.start(t);
      osc.stop(t + item.d + 0.05);
      osc2.stop(t + item.d + 0.05);
    });
  }

  // Sparkling level-up fanfare
  public playLevelUpFanfare() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, t: 0 },
      { f: 659.25, t: 0.1 },
      { f: 783.99, t: 0.2 },
      { f: 1046.5, t: 0.3 },
      { f: 880.0,  t: 0.45 },
      { f: 1046.5, t: 0.6 },
    ];
    const now = this.ctx.currentTime;
    notes.forEach((item) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + item.t;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(item.f, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  // Resonant, mystical Sea Flute catch tune
  public playFluteCatchChime() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Oceanic pentatonic flute flourish: D5, F#5, A5, B5, D6, with fluttering vibrato
    const notes = [587.33, 739.99, 880.0, 987.77, 1174.66];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const vibrato = this.ctx.createOscillator();
      const vibGain = this.ctx.createGain();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      // Breath vibrato
      vibrato.frequency.setValueAtTime(6.5, t);
      vibGain.gain.setValueAtTime(6, t);
      vibrato.connect(osc.frequency);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      vibrato.start(t);
      osc.start(t);
      vibrato.stop(t + 0.38);
      osc.stop(t + 0.38);
    });
  }

  public playBubble() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    const startFreq = 220 + Math.random() * 200;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.5, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playForage() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  public playSplash() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Filtered noise burst
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.25);
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.26);
  }

  public playAttackCrash() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playFluteMelody() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Peaceful oceanic woodwind melody: C5 - E5 - G5 - A5 - C6
    const notes = [523.25, 659.25, 783.99, 880.0, 1046.5];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.14;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      // gentle breath vibrato
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  public playCatchSuccess() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  public playFeed() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playWhaleChirp() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Sweet FM frequency modulated whale vocalization
    const now = this.ctx.currentTime;
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const masterGain = this.ctx.createGain();

    carrier.type = 'sine';
    modulator.type = 'sine';

    modulator.frequency.setValueAtTime(14, now);
    modGain.gain.setValueAtTime(80, now);
    modulator.connect(carrier.frequency);

    carrier.frequency.setValueAtTime(540, now);
    carrier.frequency.exponentialRampToValueAtTime(780, now + 0.18);
    carrier.frequency.exponentialRampToValueAtTime(420, now + 0.35);

    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    carrier.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + 0.4);
    carrier.stop(now + 0.4);
  }

  public playHappyWhaleCry() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Joyful, multi-tone playful whale greeting song (chirp + trill)
    const now = this.ctx.currentTime;

    // Carrier 1 (Primary whale vocalization)
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    carrier.type = 'sine';
    modulator.type = 'sine';

    modulator.frequency.setValueAtTime(18, now);
    modGain.gain.setValueAtTime(95, now);
    modulator.connect(carrier.frequency);

    // Playful ascending melody curves: low chirp -> high joyous whistle -> warm resolution
    carrier.frequency.setValueAtTime(480, now);
    carrier.frequency.exponentialRampToValueAtTime(1180, now + 0.22);
    carrier.frequency.exponentialRampToValueAtTime(840, now + 0.38);
    carrier.frequency.exponentialRampToValueAtTime(1420, now + 0.58);
    carrier.frequency.exponentialRampToValueAtTime(720, now + 0.78);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.08);
    gain.gain.setValueAtTime(0.22, now + 0.55);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    carrier.connect(gain);
    gain.connect(this.ctx.destination);

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + 0.85);
    carrier.stop(now + 0.85);

    // Harmonic bell shimmer over top
    const shimmer = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(960, now + 0.15);
    shimmer.frequency.exponentialRampToValueAtTime(1650, now + 0.45);
    sGain.gain.setValueAtTime(0.01, now + 0.15);
    sGain.gain.linearRampToValueAtTime(0.12, now + 0.25);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    shimmer.connect(sGain);
    sGain.connect(this.ctx.destination);

    shimmer.start(now + 0.15);
    shimmer.stop(now + 0.72);
  }

  public playClick() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playAttackSplash() {
    this.playSplash();
  }

  public playOreoClick() {
    this.playWhaleChirp();
  }

  public playWildEncounterAlert() {
    this.playAttackCrash();
  }
}

export const soundManager = new SoundManager();
