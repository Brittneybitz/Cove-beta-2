// Whale Game Organic Audio Controller & AI State Machine
// Based on the prototype architecture: WhaleAudioManager, WhistleDetector, and WhaleAI

export type ControllerEmotion = 'idle' | 'battle' | 'respond';
export type LogType = 'info' | 'system' | 'audio' | 'ai' | 'warn' | 'mic';

export interface ControllerLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: LogType;
}

const DB_NAME = 'WhaleOrganicAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'organic_audio';

export class WhaleAudioManager {
  private ctx: AudioContext;
  public buffer: AudioBuffer | null = null;
  public fileName: string | null = null;
  private onLog: (msg: string, type: LogType) => void;

  constructor(ctx: AudioContext, onLog: (msg: string, type: LogType) => void) {
    this.ctx = ctx;
    this.onLog = onLog;
  }

  public async loadAudio(bufferData: ArrayBuffer, fileName: string = 'whale_cry.mp3'): Promise<boolean> {
    try {
      // AudioContext.decodeAudioData detaches the buffer, make a slice copy
      const copy = bufferData.slice(0);
      this.buffer = await this.ctx.decodeAudioData(copy);
      this.fileName = fileName;
      this.onLog(
        `Successfully decoded: ${fileName} (${this.buffer.duration.toFixed(2)}s, ${this.buffer.numberOfChannels}ch)`,
        'system'
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.onLog(`Failed to decode audio: ${msg}`, 'warn');
      return false;
    }
  }

  public playCry(emotion: ControllerEmotion): number {
    if (!this.buffer) {
      this.onLog('Cannot play cry: No organic audio loaded yet.', 'warn');
      return 0;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Determine Pitch/Speed Profile based on Emotion
    let rate = 1.0;
    if (emotion === 'idle') {
      // 1.5x - 2.0x speed
      rate = 1.5 + Math.random() * 0.5;
    } else if (emotion === 'battle') {
      // 1.2x - 1.5x speed (lower, more aggressive)
      rate = 1.2 + Math.random() * 0.3;
    } else if (emotion === 'respond') {
      // 2.0x - 2.8x speed (very cute, happy, high pitch)
      rate = 2.0 + Math.random() * 0.8;
    }

    // Slice Selection (0.5s to 2.0s snippet)
    const minDuration = 0.5;
    const maxDuration = 2.0;
    let duration = minDuration + Math.random() * (maxDuration - minDuration);
    duration = Math.min(duration, this.buffer.duration);

    const maxStart = Math.max(0, this.buffer.duration - duration);
    const startTime = Math.random() * maxStart;

    // Audio Graph Setup
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffer;
    source.playbackRate.value = rate;

    // Highpass filter to keep it cute (remove low rumblings)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 600;

    const gainNode = this.ctx.createGain();

    // Routing
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    // Envelope (Fade In/Out to avoid clicks)
    const now = this.ctx.currentTime;
    const actualPlaybackDuration = duration / rate; // Adjusted for pitch shifting
    const fadeTime = Math.min(0.08, actualPlaybackDuration / 2);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.75, now + fadeTime);
    gainNode.gain.setValueAtTime(0.75, now + actualPlaybackDuration - fadeTime);
    gainNode.gain.linearRampToValueAtTime(0.001, now + actualPlaybackDuration);

    // Execute
    source.start(now, startTime, duration);
    this.onLog(
      `[WhaleAudioManager] Emitting '${emotion}' cry (Pitch: ${rate.toFixed(2)}x, Length: ${actualPlaybackDuration.toFixed(2)}s, Slice: ${startTime.toFixed(2)}s)`,
      'audio'
    );

    return actualPlaybackDuration;
  }
}

export class OrganicWhistleDetector {
  private ctx: AudioContext;
  private onWhistleDetected: () => void;
  private onLog: (msg: string, type: LogType) => void;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  public isActive = false;
  private cooldownTimer = 0;

  constructor(
    ctx: AudioContext,
    onWhistleDetected: () => void,
    onLog: (msg: string, type: LogType) => void
  ) {
    this.ctx = ctx;
    this.onWhistleDetected = onWhistleDetected;
    this.onLog = onLog;
  }

  public async start(): Promise<boolean> {
    if (this.isActive) return true;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      const source = this.ctx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.8;

      source.connect(this.analyser);
      this.isActive = true;
      this.onLog('Microphone connected. Organic whistle & voice detection active.', 'mic');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.onLog(`Mic access denied or unavailable: ${msg}`, 'warn');
      return false;
    }
  }

  public stop() {
    this.isActive = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.analyser = null;
    this.onLog('Microphone disconnected.', 'info');
  }

  public update(deltaTime: number) {
    if (!this.isActive || !this.analyser) return;

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= deltaTime;
      return;
    }

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Whistle Band bins 25 (1000Hz) to 70 (3000Hz)
    const startBin = 25;
    const endBin = 70;
    let totalEnergy = 0;
    let peakEnergy = 0;

    for (let i = startBin; i < endBin; i++) {
      totalEnergy += dataArray[i];
      if (dataArray[i] > peakEnergy) peakEnergy = dataArray[i];
    }

    const averageEnergy = totalEnergy / (endBin - startBin);

    // Voice band bins 6 (250Hz) to 20 (850Hz)
    let voicePeak = 0;
    for (let v = 6; v < 22; v++) {
      if (dataArray[v] > voicePeak) voicePeak = dataArray[v];
    }

    const isWhistle = peakEnergy > 185 && averageEnergy > 45;
    const isVoice = voicePeak > 195 && averageEnergy > 35;

    if (isWhistle || isVoice) {
      const typeStr = isWhistle ? 'Whistle' : 'Voice speech';
      this.onLog(
        `[WhistleDetector] ${typeStr} detected! (Peak: ${Math.max(peakEnergy, voicePeak)}, Avg: ${averageEnergy.toFixed(1)})`,
        'mic'
      );
      this.onWhistleDetected();
      this.cooldownTimer = 2.8; // Cooldown before next trigger
    }
  }
}

export class WhaleAI {
  public audioManager: WhaleAudioManager;
  public state: 'idle' | 'busy' = 'idle';
  private idleTimer = 5.0;
  private lastTime = performance.now();
  public isRunning = false;
  public whistleDetector: OrganicWhistleDetector | null = null;
  private onLog: (msg: string, type: LogType) => void;
  private onStateChange?: (state: 'idle' | 'busy') => void;
  private animFrameId: number | null = null;

  constructor(
    audioManager: WhaleAudioManager,
    onLog: (msg: string, type: LogType) => void,
    onStateChange?: (state: 'idle' | 'busy') => void
  ) {
    this.audioManager = audioManager;
    this.onLog = onLog;
    this.onStateChange = onStateChange;
    this.idleTimer = this.getRandomIdleTime();
  }

  private getRandomIdleTime(): number {
    // Random interval between 4.0 and 8.0 seconds
    return 4.0 + Math.random() * 4.0;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.idleTimer = this.getRandomIdleTime();
    this.onLog("[WhaleAI] State machine started. Entering 'idle' state.", 'ai');
    this.onStateChange?.('idle');
    this.gameLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.onLog('[WhaleAI] State machine paused.', 'info');
  }

  private gameLoop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const deltaTime = Math.min(0.2, (now - this.lastTime) / 1000.0);
    this.lastTime = now;

    this.update(deltaTime);

    this.animFrameId = requestAnimationFrame(this.gameLoop);
  };

  public update(deltaTime: number) {
    if (this.whistleDetector) {
      this.whistleDetector.update(deltaTime);
    }

    if (this.state === 'idle') {
      this.idleTimer -= deltaTime;

      if (this.idleTimer <= 0) {
        this.onLog('[WhaleAI] Idle timer elapsed. Triggering ambient cry.', 'ai');
        const cryDuration = this.audioManager.playCry('idle');
        this.setBusy(cryDuration);
      }
    }
  }

  public setBusy(duration: number) {
    this.state = 'busy';
    this.onStateChange?.('busy');
    setTimeout(() => {
      if (this.isRunning) {
        this.state = 'idle';
        this.idleTimer = this.getRandomIdleTime();
        this.onLog(
          `[WhaleAI] Returned to 'idle'. Next ambient cry in ${this.idleTimer.toFixed(1)}s.`,
          'ai'
        );
        this.onStateChange?.('idle');
      }
    }, Math.max(800, (duration + 0.5) * 1000));
  }

  public triggerEvent(emotion: ControllerEmotion) {
    if (!this.audioManager.buffer) {
      this.onLog(`[WhaleAI] Interrupt received ('${emotion}'), but no audio buffer is loaded.`, 'warn');
      return;
    }

    this.onLog(`[WhaleAI] Interrupt received! Triggering '${emotion}' behavior.`, 'ai');
    const cryDuration = this.audioManager.playCry(emotion);
    this.setBusy(cryDuration);
  }
}

// Global Controller Singleton that manages Web Audio, Persistence, and Settings
class OrganicAudioControllerService {
  private ctx: AudioContext | null = null;
  public audioManager: WhaleAudioManager | null = null;
  public whistleDetector: OrganicWhistleDetector | null = null;
  public whaleAI: WhaleAI | null = null;

  private isEnabled = false;
  private isMicRunning = false;
  private logs: ControllerLogEntry[] = [];
  private logSubscribers: ((logs: ControllerLogEntry[]) => void)[] = [];
  private stateSubscribers: (() => void)[] = [];

  constructor() {
    this.loadSettings();
    this.log('[SYSTEM] Whale Audio Controller ready. Awaiting initialization.', 'info');
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public getIsMicRunning(): boolean {
    return this.isMicRunning;
  }

  public getLoadedFileName(): string | null {
    return this.audioManager?.fileName || null;
  }

  public getHasAudio(): boolean {
    return !!this.audioManager?.buffer;
  }

  public getAiState(): 'idle' | 'busy' | 'off' {
    if (!this.whaleAI || !this.whaleAI.isRunning) return 'off';
    return this.whaleAI.state;
  }

  public getLogs(): ControllerLogEntry[] {
    return [...this.logs];
  }

  public subscribeLogs(cb: (logs: ControllerLogEntry[]) => void) {
    this.logSubscribers.push(cb);
    cb([...this.logs]);
    return () => {
      this.logSubscribers = this.logSubscribers.filter((s) => s !== cb);
    };
  }

  public subscribeState(cb: () => void) {
    this.stateSubscribers.push(cb);
    return () => {
      this.stateSubscribers = this.stateSubscribers.filter((s) => s !== cb);
    };
  }

  private notifyState() {
    this.stateSubscribers.forEach((s) => s());
  }

  public log(message: string, type: LogType = 'info') {
    const time = new Date().toISOString().split('T')[1].slice(0, -1);
    const entry: ControllerLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: time,
      message,
      type,
    };
    this.logs = [...this.logs.slice(-120), entry];
    this.logSubscribers.forEach((s) => s([...this.logs]));
  }

  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.log('Initializing AudioContext...', 'system');

      this.audioManager = new WhaleAudioManager(this.ctx, (msg, t) => this.log(msg, t));
      this.whaleAI = new WhaleAI(
        this.audioManager,
        (msg, t) => this.log(msg, t),
        () => this.notifyState()
      );

      this.whistleDetector = new OrganicWhistleDetector(
        this.ctx,
        () => {
          this.whaleAI?.triggerEvent('respond');
          this.notifyState();
        },
        (msg, t) => this.log(msg, t)
      );

      this.whaleAI.whistleDetector = this.whistleDetector;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public async setEnabled(enabled: boolean): Promise<boolean> {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('whale_organic_controller_enabled', enabled ? 'true' : 'false');
    } catch {}

    if (enabled) {
      this.ensureContext();
      // Try restoring saved audio if not yet loaded
      if (!this.audioManager?.buffer) {
        await this.restoreSavedAudio();
      }

      if (this.isMicRunning) {
        await this.whistleDetector?.start();
      }

      this.whaleAI?.start();
      this.log('Background Organic Controller turned ON.', 'system');
    } else {
      this.whaleAI?.stop();
      this.whistleDetector?.stop();
      this.log('Background Organic Controller turned OFF.', 'system');
    }

    this.notifyState();
    return this.isEnabled;
  }

  public async handleMicStateChange(micActive: boolean) {
    this.isMicRunning = micActive;
    if (this.isEnabled && micActive) {
      this.ensureContext();
      await this.whistleDetector?.start();
    } else if (!micActive) {
      this.whistleDetector?.stop();
    }
    this.notifyState();
  }

  // Load user audio file
  public async loadAudioFile(file: File): Promise<boolean> {
    this.ensureContext();
    this.log(`Reading organic audio file: ${file.name}...`, 'system');

    const buffer = await file.arrayBuffer();
    const success = await this.audioManager!.loadAudio(buffer, file.name);

    if (success) {
      // Persist in IndexedDB
      await this.saveAudioToDB(file.name, buffer);

      if (this.isEnabled) {
        this.whaleAI?.start();
      }
      this.notifyState();
    }

    return success;
  }

  // Manual trigger for testing
  public triggerCry(emotion: ControllerEmotion) {
    this.ensureContext();
    this.whaleAI?.triggerEvent(emotion);
    this.notifyState();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('whale_organic_controller_enabled');
      if (saved === 'true') {
        this.isEnabled = true;
      }
    } catch {}
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async saveAudioToDB(fileName: string, buffer: ArrayBuffer) {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put({ id: 'primary_organic_cry', fileName, buffer, savedAt: Date.now() });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      this.log(`Saved ${fileName} to browser database for auto-load.`, 'system');
    } catch {
      // Storage fallback
    }
  }

  public async restoreSavedAudio(): Promise<boolean> {
    try {
      const db = await this.openDB();
      const record = await new Promise<{ fileName: string; buffer: ArrayBuffer } | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('primary_organic_cry');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (record && record.buffer) {
        this.ensureContext();
        await this.audioManager?.loadAudio(record.buffer, record.fileName);
        this.notifyState();
        return true;
      }
    } catch {
      // ignore
    }

    // If no custom audio was uploaded yet, synthesize an organic multi-harmonic whale audio buffer!
    if (!this.audioManager?.buffer) {
      await this.generateSyntheticOrganicBuffer();
      return true;
    }

    return false;
  }

  // Generates a rich, harmonic 4-second organic whale vocalization as initial default
  private async generateSyntheticOrganicBuffer() {
    this.ensureContext();
    if (!this.ctx) return;

    const sampleRate = this.ctx.sampleRate;
    const duration = 4.0;
    const frameCount = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      // Gentle frequency glissando: 380Hz to 620Hz and dipping
      const freq = 380 + Math.sin(t * Math.PI * 1.5) * 160 + Math.sin(t * 12) * 20;
      const fundamental = Math.sin(2 * Math.PI * freq * t);
      const harmonic2 = 0.45 * Math.sin(4 * Math.PI * freq * t);
      const harmonic3 = 0.22 * Math.sin(6 * Math.PI * freq * t);
      const subHarmonic = 0.28 * Math.sin(Math.PI * freq * t);

      // Amplitude envelope
      const env = Math.sin((t / duration) * Math.PI);
      data[i] = (fundamental + harmonic2 + harmonic3 + subHarmonic) * env * 0.4;
    }

    this.audioManager!.buffer = buffer;
    this.audioManager!.fileName = 'Default Organic Orca Cry (Harmonic)';
    this.log('Loaded default harmonic organic whale audio sample.', 'system');
    this.notifyState();
  }
}

export const organicAudioController = new OrganicAudioControllerService();
