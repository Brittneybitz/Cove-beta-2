type WhistleCallback = (data: { type: 'whistle' | 'voice' }) => void;
type LevelCallback = (level: number) => void;
type ErrorCallback = () => void;

class WhistleDetectorManager {
    ctx: AudioContext | null = null;
    analyser: AnalyserNode | null = null;
    mediaStream: MediaStream | null = null;
    isActive: boolean = false;
    listeners: {
        onWhistle: WhistleCallback;
        onAudioLevel: LevelCallback;
        onError: ErrorCallback;
    }[] = [];
    animationId: number | null = null;
    cooldown: number = 0;

    async start(): Promise<boolean> {
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.ctx.createMediaStreamSource(this.mediaStream);

            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 1024;
            this.analyser.smoothingTimeConstant = 0.8;
            source.connect(this.analyser);

            this.isActive = true;
            this.monitorAudio();
            return true;
        } catch (_err) {
            this.listeners.forEach((l) => l.onError());
            return false;
        }
    }

    stop() {
        this.isActive = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
            this.mediaStream = null;
        }
        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
        }
    }

    addListener(callbacks: {
        onWhistle: WhistleCallback;
        onAudioLevel: LevelCallback;
        onError: ErrorCallback;
    }) {
        this.listeners.push(callbacks);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== callbacks);
        };
    }

    private monitorAudio() {
        if (!this.isActive || !this.analyser) return;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        let peak = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
            if (dataArray[i] > peak) peak = dataArray[i];
        }

        const avgLevel = sum / dataArray.length;
        const normalizedLevel = Math.min(100, Math.floor((avgLevel / 128) * 100));

        this.listeners.forEach((l) => l.onAudioLevel(normalizedLevel));

        if (this.cooldown > 0) {
            this.cooldown -= 0.1;
        } else if (peak > 195 && avgLevel > 35) {
            this.cooldown = 2.5; 
            const whistleType = peak > 220 ? 'whistle' : 'voice';
            this.listeners.forEach((l) => l.onWhistle({ type: whistleType }));
        }

        this.animationId = requestAnimationFrame(() => this.monitorAudio());
    }
}

export const whistleDetector = new WhistleDetectorManager();
export type { WhistleDetectorManager };