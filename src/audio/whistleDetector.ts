// Web Audio API Whistle and Voice Pitch Detector
export interface WhistleDetectorListener {
  onWhistle: (event: { type: 'whistle' | 'voice'; confidence: number; volume: number }) => void;
  onAudioLevel?: (level: number) => void;
  onError?: (err: Error) => void;
}

export class WhistleDetector {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private lastTriggerTime: number = 0;
  private listeners: WhistleDetectorListener[] = [];

  public addListener(listener: WhistleDetectorListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getIsListening(): boolean {
    return this.isRunning;
  }

  public async start(): Promise<boolean> {
    if (this.isRunning) return true;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error('Web Audio API is not supported in this browser.');
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.65;
      source.connect(this.analyser);

      this.isRunning = true;
      this.detectLoop();
      return true;
    } catch (err: unknown) {
      this.stop();
      this.listeners.forEach((l) => l.onError?.(err as Error));
      return false;
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.analyser = null;
  }

  private detectLoop = () => {
    if (!this.isRunning || !this.analyser || !this.audioCtx) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(frequencyData);

    const timeData = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(timeData);

    // 1. Calculate overall audio volume (RMS)
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      const val = (timeData[i] - 128) / 128;
      sumSquares += val * val;
    }
    const rms = Math.sqrt(sumSquares / bufferLength);
    const audioLevel = Math.min(100, Math.round(rms * 280));

    this.listeners.forEach((l) => l.onAudioLevel?.(audioLevel));

    // 2. Frequency analysis for whistle / voice
    // Nyquist frequency = sampleRate / 2 (typically 22050 or 24000 Hz)
    const binSize = (this.audioCtx.sampleRate / 2) / bufferLength;

    // Typical human whistle range: 850 Hz - 2800 Hz
    const whistleMinBin = Math.floor(850 / binSize);
    const whistleMaxBin = Math.floor(2800 / binSize);

    // Human voice range: 250 Hz - 900 Hz
    const voiceMinBin = Math.floor(250 / binSize);
    const voiceMaxBin = Math.floor(900 / binSize);

    let maxWhistleEnergy = 0;
    let maxWhistleBin = 0;
    let totalWhistleEnergy = 0;

    for (let i = whistleMinBin; i <= whistleMaxBin; i++) {
      const energy = frequencyData[i];
      totalWhistleEnergy += energy;
      if (energy > maxWhistleEnergy) {
        maxWhistleEnergy = energy;
        maxWhistleBin = i;
      }
    }

    let maxVoiceEnergy = 0;
    for (let i = voiceMinBin; i <= voiceMaxBin; i++) {
      if (frequencyData[i] > maxVoiceEnergy) {
        maxVoiceEnergy = frequencyData[i];
      }
    }

    const now = performance.now();
    const isWhistling = maxWhistleEnergy > 140 && audioLevel > 18;
    const isLoudVoice = maxVoiceEnergy > 165 && audioLevel > 35;

    // Trigger detection with cooldown
    if ((isWhistling || isLoudVoice) && now - this.lastTriggerTime > 2200) {
      this.lastTriggerTime = now;
      const detectedType = isWhistling ? 'whistle' : 'voice';
      const peakFreq = Math.round(maxWhistleBin * binSize);

      this.listeners.forEach((l) =>
        l.onWhistle({
          type: detectedType,
          confidence: isWhistling ? maxWhistleEnergy / 255 : maxVoiceEnergy / 255,
          volume: audioLevel,
        })
      );
    }

    this.animFrameId = requestAnimationFrame(this.detectLoop);
  };
}

export const whistleDetector = new WhistleDetector();
