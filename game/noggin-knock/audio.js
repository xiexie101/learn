/**
 * Noggin Knock - Audio Synthesizer (Web Audio API)
 * Zero external audio files required, zero latency, high-fidelity Nintendo Mario Party style SFX.
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.tempo = 128; // BPM
        this.step = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.bgmPlaying) {
            this.stopBGM();
        } else if (this.enabled && !this.bgmPlaying) {
            this.startBGM();
        }
        return this.enabled;
    }

    // Mallet Swing Whoosh
    playSwing() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // Filtered white noise sweep
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        filter.Q.setValueAtTime(3, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.15);
    }

    // Mallet hitting Mechanical Monty Mole (Crisp metallic clank + punchy thud)
    playHitMole() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // 1. Low percussive thud
        const oscThud = this.ctx.createOscillator();
        const gainThud = this.ctx.createGain();
        oscThud.type = 'triangle';
        oscThud.frequency.setValueAtTime(180, now);
        oscThud.frequency.exponentialRampToValueAtTime(45, now + 0.12);
        gainThud.gain.setValueAtTime(0.7, now);
        gainThud.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        oscThud.connect(gainThud);
        gainThud.connect(this.ctx.destination);
        oscThud.start(now);
        oscThud.stop(now + 0.12);

        // 2. High metallic "clack/bonk"
        const oscMetal = this.ctx.createOscillator();
        const gainMetal = this.ctx.createGain();
        oscMetal.type = 'square';
        oscMetal.frequency.setValueAtTime(880, now);
        oscMetal.frequency.exponentialRampToValueAtTime(440, now + 0.09);
        gainMetal.gain.setValueAtTime(0.3, now);
        gainMetal.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        oscMetal.connect(gainMetal);
        gainMetal.connect(this.ctx.destination);
        oscMetal.start(now);
        oscMetal.stop(now + 0.09);

        // Coin reward chime
        setTimeout(() => this.playCoin(), 30);
    }

    // Mega Mole Hit (Triumphant double impact + heavy metallic gong)
    playHitMega() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // Sub bass heavy slam
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);

        // Metallic bell harmonics
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const bell = this.ctx.createOscillator();
            const bellGain = this.ctx.createGain();
            bell.type = 'triangle';
            bell.frequency.setValueAtTime(freq, now + i * 0.03);
            bellGain.gain.setValueAtTime(0.25, now + i * 0.03);
            bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + i * 0.03);
            bell.connect(bellGain);
            bellGain.connect(this.ctx.destination);
            bell.start(now + i * 0.03);
            bell.stop(now + 0.4);
        });
    }

    // Classic Mario Two-Tone Coin Chime (B5: 987.77Hz -> E6: 1318.51Hz)
    playCoin() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, now);
        gain1.gain.setValueAtTime(0.28, now);
        gain1.gain.setValueAtTime(0.28, now + 0.06);
        gain1.gain.linearRampToValueAtTime(0.01, now + 0.07);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.07);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.51, now + 0.07);
        gain2.gain.setValueAtTime(0.35, now + 0.07);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.07);
        osc2.stop(now + 0.42);
    }

    // Bob-omb Explosion (Thunderous blast + rumble + siren sting)
    playExplosion() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // Noise blast
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.6);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + 0.6);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.6);

        // Sub bass drop
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sawtooth';
        sub.frequency.setValueAtTime(120, now);
        sub.frequency.exponentialRampToValueAtTime(30, now + 0.5);
        subGain.gain.setValueAtTime(0.6, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        sub.connect(subGain);
        subGain.connect(this.ctx.destination);
        sub.start(now);
        sub.stop(now + 0.5);

        // Penalty buzzer (Negative warning)
        setTimeout(() => {
            if (!this.enabled) return;
            const buzNow = this.ctx.currentTime;
            const buz = this.ctx.createOscillator();
            const buzG = this.ctx.createGain();
            buz.type = 'sawtooth';
            buz.frequency.setValueAtTime(140, buzNow);
            buz.frequency.setValueAtTime(110, buzNow + 0.15);
            buzG.gain.setValueAtTime(0.3, buzNow);
            buzG.gain.exponentialRampToValueAtTime(0.001, buzNow + 0.35);
            buz.connect(buzG);
            buzG.connect(this.ctx.destination);
            buz.start(buzNow);
            buz.stop(buzNow + 0.35);
        }, 150);
    }

    // Mole Pop-up Gear Click
    playPopUp() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Countdown Blip (3, 2, 1)
    playCountDown(isFinal = false) {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        if (isFinal) {
            osc.frequency.setValueAtTime(1046.5, now); // High C6 (START!)
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
        } else {
            osc.frequency.setValueAtTime(523.25, now); // C5
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    }

    // Sports Whistle / Finish
    playWhistle() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        [2400, 2460].forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.6);
        });
    }

    // Dynamic Upbeat Background Music (Mario Party Style Carnival Groove)
    startBGM() {
        if (!this.enabled || this.bgmPlaying) return;
        this.init();
        this.bgmPlaying = true;

        const bassNotes = [
            130.81, 130.81, 164.81, 196.00, // C3, C3, E3, G3
            146.83, 146.83, 174.61, 220.00, // D3, D3, F3, A3
            164.81, 164.81, 196.00, 246.94, // E3, E3, G3, B3
            174.61, 196.00, 220.00, 246.94  // F3, G3, A3, B3
        ];

        const melodyNotes = [
            523.25, 0, 523.25, 659.25, 783.99, 659.25, 587.33, 0,
            587.33, 0, 587.33, 698.46, 880.00, 698.46, 659.25, 0,
            659.25, 0, 659.25, 783.99, 987.77, 783.99, 698.46, 0,
            698.46, 783.99, 880.00, 987.77, 1046.50, 0, 0, 0
        ];

        let step = 0;
        const interval = 135; // ~111 BPM 16th notes

        this.bgmTimer = setInterval(() => {
            if (!this.bgmPlaying || !this.enabled) return;
            const now = this.ctx.currentTime;

            // Bass note on quarter notes
            if (step % 2 === 0) {
                const bassFreq = bassNotes[(step / 2) % bassNotes.length];
                const bass = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bass.type = 'triangle';
                bass.frequency.setValueAtTime(bassFreq, now);
                bGain.gain.setValueAtTime(0.12, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                bass.connect(bGain);
                bGain.connect(this.ctx.destination);
                bass.start(now);
                bass.stop(now + 0.18);
            }

            // Melody note
            const melFreq = melodyNotes[step % melodyNotes.length];
            if (melFreq > 0) {
                const mel = this.ctx.createOscillator();
                const mGain = this.ctx.createGain();
                mel.type = 'sine';
                mel.frequency.setValueAtTime(melFreq, now);
                mGain.gain.setValueAtTime(0.08, now);
                mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                mel.connect(mGain);
                mGain.connect(this.ctx.destination);
                mel.start(now);
                mel.stop(now + 0.12);
            }

            // Snare / Hihat tick
            if (step % 4 === 2) {
                const bufSize = Math.floor(this.ctx.sampleRate * 0.04);
                const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
                const d = buf.getChannelData(0);
                for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.05;
                const sn = this.ctx.createBufferSource();
                sn.buffer = buf;
                sn.connect(this.ctx.destination);
                sn.start(now);
            }

            step++;
        }, interval);
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

window.soundEngine = new SoundEngine();
