// Audio Processing Module
class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.sensitivity = 1.0;
        this.isActive = false;
    }

    async initialize() {
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: false
                }
            });

            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;

            // Connect microphone to analyser
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);

            // Create data array for frequency data
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            this.isActive = true;
            return true;
        } catch (error) {
            console.error('Microphone access denied:', error);
            alert('无法访问麦克风。请确保已授予权限。');
            return false;
        }
    }

    getWindForce() {
        if (!this.isActive || !this.analyser) {
            return 0;
        }

        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length;

        // Apply sensitivity and normalize to 0-100 range
        let windForce = (average / 255) * 100 * this.sensitivity;

        // Clamp to 0-100
        windForce = Math.max(0, Math.min(100, windForce));

        return windForce;
    }

    setSensitivity(value) {
        this.sensitivity = value;
    }

    dispose() {
        if (this.microphone) {
            this.microphone.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.isActive = false;
    }
}

// Export for use in main app
window.AudioProcessor = AudioProcessor;
