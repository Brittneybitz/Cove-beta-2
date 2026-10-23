// whale_audio.js - Whale Audio Engine & AI Controller

class WhaleAudioManager {
    constructor() {
        this.audioCtx = null;
        this.sampleBuffer = null;
        this.masterGain = null;
        this.highpassFilter = null;
    }

    async init() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 1.0;

            this.highpassFilter = this.audioCtx.createBiquadFilter();
            this.highpassFilter.type = 'highpass';
            this.highpassFilter.frequency.value = 600; // Strips out deep bass rumbles to keep it cute and high

            this.highpassFilter.connect(this.masterGain);
            this.masterGain.connect(this.audioCtx.destination);
        }
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
    }

    async loadSample(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.sampleBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
            console.log("Whale cry sample loaded successfully!");
        } catch (e) {
            console.error("Failed to load sample audio:", e);
        }
    }

    playRandomSlice(emotion = 'idle') {
        if (!this.sampleBuffer || !this.audioCtx) return;

        const source = this.audioCtx.createBufferSource();
        source.buffer = this.sampleBuffer;

        // Configure playback rate (pitch) based on emotion
        let rate = 1.8 + Math.random() * 0.7; // default cute high pitch (1.5x to 2.5x)
        if (emotion === 'battle') {
            rate = 1.2 + Math.random() * 0.4; // slightly deeper for battle
        } else if (emotion === 'respond') {
            rate = 2.2 + Math.random() * 0.5; // very high and excited for whistle response
        }
        source.playbackRate.value = rate;

        // Pick a random slice of the audio file
        const duration = this.sampleBuffer.duration;
        const sliceLength = 0.5 + Math.random() * 1.0; // between 0.5 and 1.5 seconds long
        const maxStart = Math.max(0, duration - sliceLength);
        const startTime = Math.random() * maxStart;

        // Create an envelope gain node to prevent popping/clicking at start/end
        const gainNode = this.audioCtx.createGain();
        const now = this.audioCtx.currentTime;
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(1.0, now + 0.05);
        gainNode.gain.setValueAtTime(1.0, now + sliceLength - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + sliceLength);

        // Connect nodes: Source -> Gain -> Highpass Filter -> Speakers
        source.connect(gainNode);
        gainNode.connect(this.highpassFilter);

        source.start(now, startTime, sliceLength);
    }
}

class WhistleDetector {
    constructor() {
        this.audioCtx = null;
        this.analyser = null;
        this.microphone = null;
        this.isListening = false;
    }

    async init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.microphone = this.audioCtx.createMediaStreamSource(stream);
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 2048;
            
            this.microphone.connect(this.analyser);
            this.isListening = true;
            console.log("Microphone whistle detector active.");
        } catch (err) {
            console.warn("Microphone access denied or unavailable:", err);
        }
    }

    detectWhistle() {
        if (!this.isListening || !this.analyser) return false;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        // Look for high-frequency spikes typical of a human whistle
        let highFreqSum = 0;
        const startBin = Math.floor(bufferLength * 0.6); // Upper frequency range
        for (let i = startBin; i < bufferLength; i++) {
            highFreqSum += dataArray[i];
        }
        const averageHighFreq = highFreqSum / (bufferLength - startBin);

        // Threshold for detecting a whistle burst
        return averageHighFreq > 80;
    }
}

class WhaleAI {
    constructor() {
        this.audioManager = new WhaleAudioManager();
        this.whistleDetector = new WhistleDetector();
        this.currentEmotion = 'idle';
        this.idleTimer = 0;
        this.nextIdleInterval = 5000; // 5 seconds
        this.initialized = false;
    }

    async init() {
        await this.audioManager.init();
        await this.whistleDetector.init();
        this.initialized = true;
    }

    triggerEmotion(emotion) {
        this.currentEmotion = emotion;
        this.audioManager.playRandomSlice(emotion);
        
        // Reset idle timer when an emotion is manually triggered
        this.idleTimer = 0;
    }

    update() {
        if (!this.initialized) return;

        // Check for player whistle to trigger response
        if (this.whistleDetector.detectWhistle()) {
            this.triggerEmotion('respond');
            return;
        }

        // Handle random stagnant/idle background cries
        this.idleTimer += 16; // Roughly 16ms per frame at 60fps
        if (this.idleTimer >= this.nextIdleInterval) {
            this.audioManager.playRandomSlice('idle');
            this.idleTimer = 0;
            // Randomize next interval between 6 to 14 seconds so it feels organic
            this.nextIdleInterval = 6000 + Math.random() * 8000;
        }
    }
}