export class WhistleDetector {
    ctx: AudioContext;
    onWhistleDetected: () => void;
    analyser: AnalyserNode | null = null;
    isActive: boolean = false;
    cooldownTimer: number = 0;

    constructor(ctx: AudioContext, onWhistleDetected: () => void) {
        this.ctx = ctx;
        this.onWhistleDetected = onWhistleDetected;
    }

    async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.ctx.createMediaStreamSource(stream);
            
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 1024;
            this.analyser.smoothingTimeConstant = 0.8; 
            
            source.connect(this.analyser);
            this.isActive = true;
            console.log("[WhistleDetector] Microphone accessed. Active.");
            return true;
        } catch (err: any) {
            console.warn(`[WhistleDetector] Mic access denied: ${err.message}`);
            return false;
        }
    }

    update(deltaTime: number) {
        if (!this.isActive || !this.analyser) return;

        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= deltaTime;
            return;
        }

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);

        const startBin = 25;
        const endBin = 70;
        let totalEnergy = 0;
        let peakEnergy = 0;

        for (let i = startBin; i < endBin; i++) {
            totalEnergy += dataArray[i];
            if (dataArray[i] > peakEnergy) peakEnergy = dataArray[i];
        }

        const averageEnergy = totalEnergy / (endBin - startBin);

        if (peakEnergy > 200 && averageEnergy > 50) {
            console.log(`[WhistleDetector] High frequency detected! (Peak: ${peakEnergy})`);
            this.onWhistleDetected();
            this.cooldownTimer = 3.0;
        }
    }
}