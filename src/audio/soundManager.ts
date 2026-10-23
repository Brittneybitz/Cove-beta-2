import { WhistleDetector } from './whistleDetector';

class WhaleAudioManager {
    ctx: AudioContext;
    buffer: AudioBuffer | null = null;

    constructor(ctx: AudioContext) {
        this.ctx = ctx;
    }

    async loadAudio(url: string) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
            console.log(`[WhaleAudioManager] Decoded audio successfully.`);
            return true;
        } catch (err: any) {
            console.warn(`[WhaleAudioManager] Failed to decode: ${err.message}`);
            return false;
        }
    }

    playCry(emotion: 'idle' | 'battle' | 'respond') {
        if (!this.buffer) return 0;

        let rate = 1.0;
        if (emotion === 'idle') rate = 1.5 + Math.random() * 0.5;
        else if (emotion === 'battle') rate = 1.2 + Math.random() * 0.3;
        else if (emotion === 'respond') rate = 2.0 + Math.random() * 0.8;

        const minDuration = 0.5;
        const maxDuration = 2.0;
        let duration = Math.min(minDuration + Math.random() * (maxDuration - minDuration), this.buffer.duration);
        const startTime = Math.random() * Math.max(0, this.buffer.duration - duration);

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffer;
        source.playbackRate.value = rate;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 600;

        const gainNode = this.ctx.createGain();

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        const now = this.ctx.currentTime;
        const actualDuration = duration / rate;
        const fadeTime = Math.min(0.1, actualDuration / 2);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(1, now + fadeTime);
        gainNode.gain.setValueAtTime(1, now + actualDuration - fadeTime);
        gainNode.gain.linearRampToValueAtTime(0, now + actualDuration);

        source.start(now, startTime, duration);
        return actualDuration;
    }
}

class WhaleAI {
    audioManager: WhaleAudioManager;
    state: 'idle' | 'busy' = 'idle';
    idleTimer: number = this.getRandomIdleTime();
    lastTime: number = performance.now();
    isRunning: boolean = false;
    whistleDetector: WhistleDetector | null = null;
    animationFrameId: number | null = null;

    constructor(audioManager: WhaleAudioManager) {
        this.audioManager = audioManager;
    }

    getRandomIdleTime() { return 4.0 + (Math.random() * 4.0); }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    }

    gameLoop() {
        if (!this.isRunning) return;
        const now = performance.now();
        const deltaTime = (now - this.lastTime) / 1000.0;
        this.lastTime = now;
        this.update(deltaTime);
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime: number) {
        if (this.whistleDetector) this.whistleDetector.update(deltaTime);
        if (this.state === 'idle') {
            this.idleTimer -= deltaTime;
            if (this.idleTimer <= 0) {
                const cryDuration = this.audioManager.playCry('idle');
                this.setBusy(cryDuration);
            }
        }
    }

    setBusy(duration: number) {
        this.state = 'busy';
        setTimeout(() => {
            if (this.isRunning) {
                this.state = 'idle';
                this.idleTimer = this.getRandomIdleTime();
            }
        }, (duration + 0.5) * 1000);
    }

    triggerEvent(emotion: 'idle' | 'battle' | 'respond') {
        if (!this.audioManager.buffer) return;
        const cryDuration = this.audioManager.playCry(emotion);
        this.setBusy(cryDuration);
    }
}

let audioContext: AudioContext | null = null;
let whaleAI: WhaleAI | null = null;

export const soundManager = {
    async init(audioUrl: string) {
        if (whaleAI) return; 
        
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const whaleAudio = new WhaleAudioManager(audioContext);
        whaleAI = new WhaleAI(whaleAudio);

        const detector = new WhistleDetector(audioContext, () => {
            whaleAI?.triggerEvent('respond');
        });
        
        whaleAI.whistleDetector = detector;
        await detector.start();
        
        const success = await whaleAudio.loadAudio(audioUrl);
        if (success) whaleAI.start();
    },

    cleanup() {
        if (whaleAI) {
            whaleAI.stop();
            whaleAI = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
    }
};