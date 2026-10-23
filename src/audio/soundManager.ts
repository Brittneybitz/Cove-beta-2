// src/audio/soundManager.ts
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

      oscGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(this.ambientGain);

      osc.start();
      this.ambientOscs.push(osc);
    });

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

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
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

  public playPokemonVictoryFanfare() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

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

  public playFluteCatchChime() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

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

  public playWhaleChirp() {
    const ai = (window as any).whaleAIInstance;
    if (ai && ai.initialized) {
      ai.triggerEmotion('respond');
    }
  }

  public playHappyWhaleCry() {
    const ai = (window as any).whaleAIInstance;
    if (ai && ai.initialized) {
      ai.triggerEmotion('respond');
    }
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
    const ai = (window as any).whaleAIInstance;
    if (ai && ai.initialized) {
      ai.triggerEmotion('battle');
    } else {
      this.playAttackCrash();
    }
  }
}

export const soundManager = new SoundManager();