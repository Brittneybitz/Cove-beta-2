// public/whale_audio.js
class WhaleAudioManager {
  constructor(ctx) {
    this.ctx = ctx;
    this.buffer = null;
    this.highpassFilter = null;
  }

  async loadAudio(urlOrBuffer) {
    try {
      if (typeof urlOrBuffer === 'string') {
        const response = await fetch(urlOrBuffer);
        const arrayBuffer = await response.arrayBuffer();
        this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
      } else if (urlOrBuffer instanceof ArrayBuffer) {
        this.buffer = await this.ctx.decodeAudioData(urlOrBuffer);
      }
      return true;
    } catch (err) {
      console.error("Failed to decode audio:", err);
      return false;
    }
  }

  playCry(emotion = 'idle') {
    if (!this.buffer || !this.ctx) return 0;

    // Determine Pitch / Speed Profile based on Emotion (matches prototype)
    let rate = 1.0;
    if (emotion === 'idle') {
      rate = 1.5 + Math.random() * 0.5; // Cute high pitch (1.5x to 2.0x)
    } else if (emotion === 'battle') {
      rate = 1.2 + Math.random() * 0.3; // Deeper, more aggressive (1.2x to 1.5x)
    } else if (emotion === 'respond') {
      rate = 2.0 + Math.random() * 0.8; // Very high, excited response (2.0x to 2.8x)
    }

    // Randomized Slice Selection (0.5s to 2.0s)
    const minDuration = 0.5;
    const maxDuration = 2.0;
    let duration = minDuration + Math.random() * (maxDuration - minDuration);
    duration = Math.min(duration, this.buffer.duration);

    const maxStart = Math.max(0, this.buffer.duration - duration);
    const startTime = Math.random() * maxStart;

    // Audio Graph
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffer;
    source.playbackRate.value = rate;

    // Highpass filter (strips out deep rumbles to keep it high and cute)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 600;

    const gainNode = this.ctx.createGain();

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    // Envelope Fade In / Out
    const now = this.ctx.currentTime;
    const actualPlaybackDuration = duration / rate;
    const fadeTime = Math.min(0.1, actualPlaybackDuration / 2);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + fadeTime);
    gainNode.gain.setValueAtTime(1, now + actualPlaybackDuration - fadeTime);
    gainNode.gain.linearRampToValueAtTime(0, now + actualPlaybackDuration);

    source.start(now, startTime, duration);
    return actualPlaybackDuration;
  }
}

class WhaleAI {
  constructor() {
    this.ctx = null;
    this.audioManager = null;
    this.state = 'idle';
    this.idleTimer = this.getRandomIdleTime();
    this.lastTime = performance.now();
    this.initialized = false;
  }

  getRandomIdleTime() {
    return 4.0 + Math.random() * 4.0; // 4 to 8 seconds
  }

  async init(sampleUrl = '/assets/audio/whale_cry_snippet.mp3') {
    if (this.initialized) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.audioManager = new WhaleAudioManager(this.ctx);
    await this.audioManager.loadAudio(sampleUrl);
    this.initialized = true;
    this.lastTime = performance.now();
  }

  triggerEmotion(emotion) {
    if (!this.initialized || !this.audioManager) return;
    const duration = this.audioManager.playCry(emotion);
    this.setBusy(duration);
  }

  setBusy(duration) {
    this.state = 'busy';
    setTimeout(() => {
      this.state = 'idle';
      this.idleTimer = this.getRandomIdleTime();
    }, (duration + 0.5) * 1000);
  }

  update() {
    if (!this.initialized) return;

    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000.0;
    this.lastTime = now;

    if (this.state === 'idle') {
      this.idleTimer -= deltaTime;
      if (this.idleTimer <= 0) {
        const duration = this.audioManager.playCry('idle');
        this.setBusy(duration);
      }
    }
  }
}

// Expose globally to window
window.WhaleAI = WhaleAI;