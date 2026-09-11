/**
 * NES Battle City Sound Engine (Web Audio API Synthesizer)
 * Emulates the Ricoh 2A03 sound chip (Pulse 1, Pulse 2, Triangle, Noise channels)
 * 100% procedurally synthesized - zero external audio dependencies.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.muted = false;
        this.volume = 0.5;
        this.engineOsc = null;
        this.engineGain = null;
        this.isEngineRunning = false;
        this.isEngineMoving = false;
        this.noiseBuffer = null;
    }

    init() {
        if (this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
            this.createNoiseBuffer();
        } catch (e) {
            console.warn("Web Audio API not supported:", e);
        }
    }

    resume() {
        if (!this.ctx) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMuted(muted) {
        this.muted = muted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
        }
    }

    toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain && this.ctx && !this.muted) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2;
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // Brown/Pink tinted white noise for retro grit
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }
    }

    // ==========================================
    // Core NES Synthesizer Primitives
    // ==========================================

    playPulse(freq, duration, type = 'square', gain = 0.15, startTime = null) {
        if (!this.ctx || this.muted) return;
        const t0 = startTime !== null ? startTime : this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);

        g.gain.setValueAtTime(gain, t0);
        g.gain.setValueAtTime(gain, t0 + duration * 0.8);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

        osc.connect(g);
        g.connect(this.masterGain);

        osc.start(t0);
        osc.stop(t0 + duration);
        return osc;
    }

    playNoise(duration, filterFreq = 1000, filterType = 'lowpass', gain = 0.2, startTime = null) {
        if (!this.ctx || this.muted || !this.noiseBuffer) return;
        const t0 = startTime !== null ? startTime : this.ctx.currentTime;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(filterFreq, t0);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(gain, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

        noise.connect(filter);
        filter.connect(g);
        g.connect(this.masterGain);

        noise.start(t0);
        noise.stop(t0 + duration);
    }

    // ==========================================
    // Authentic Sound Effects
    // ==========================================

    // Player or enemy tank firing
    playShoot() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t0 = this.ctx.currentTime;
        const duration = 0.09;

        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, t0);
        osc.frequency.exponentialRampToValueAtTime(140, t0 + duration);

        g.gain.setValueAtTime(0.18, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

        osc.connect(g);
        g.connect(this.masterGain);

        osc.start(t0);
        osc.stop(t0 + duration);

        // Small noise click for NES impact
        this.playNoise(0.04, 2500, 'bandpass', 0.12, t0);
    }

    // Bullet hitting brick wall
    playBrickHit() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t0 = this.ctx.currentTime;
        const duration = 0.06;

        this.playNoise(duration, 1400, 'lowpass', 0.22, t0);

        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t0);
        osc.frequency.exponentialRampToValueAtTime(60, t0 + duration);

        g.gain.setValueAtTime(0.15, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(t0);
        osc.stop(t0 + duration);
    }

    // Bullet hitting steel wall (metallic ping)
    playSteelHit() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t0 = this.ctx.currentTime;
        const duration = 0.08;

        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1800, t0);
        osc.frequency.exponentialRampToValueAtTime(1200, t0 + duration);

        g.gain.setValueAtTime(0.2, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(t0);
        osc.stop(t0 + duration);
    }

    // Bullet vs Bullet collision
    playBulletClash() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t0 = this.ctx.currentTime;
        const duration = 0.05;

        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, t0);
        osc.frequency.exponentialRampToValueAtTime(300, t0 + duration);

        g.gain.setValueAtTime(0.15, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(t0);
        osc.stop(t0 + duration);
    }

    // Tank or base explosion
    playExplosion(isBig = false) {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t0 = this.ctx.currentTime;
        const duration = isBig ? 0.55 : 0.35;

        if (!this.noiseBuffer) return;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.setValueAtTime(3.0, t0);
        filter.frequency.setValueAtTime(600, t0);
        filter.frequency.exponentialRampToValueAtTime(50, t0 + duration);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(isBig ? 0.35 : 0.25, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

        noise.connect(filter);
        filter.connect(g);
        g.connect(this.masterGain);

        noise.start(t0);
        noise.stop(t0 + duration);

        // Low rumble oscillator
        const osc = this.ctx.createOscillator();
        const oscG = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, t0);
        osc.frequency.exponentialRampToValueAtTime(30, t0 + duration);

        oscG.gain.setValueAtTime(isBig ? 0.3 : 0.2, t0);
        oscG.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

        osc.connect(oscG);
        oscG.connect(this.masterGain);
        osc.start(t0);
        osc.stop(t0 + duration);
    }

    // Power-up spawned (red flashing enemy killed)
    playPowerupSpawn() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t0 = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880];
        const step = 0.06;
        notes.forEach((freq, idx) => {
            this.playPulse(freq, step, 'square', 0.16, t0 + idx * step);
        });
    }

    // Power-up picked up
    playPowerupPickup() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t0 = this.ctx.currentTime;
        const notes = [659.25, 830.61, 987.77, 1318.51, 1661.22];
        const step = 0.05;
        notes.forEach((freq, idx) => {
            this.playPulse(freq, step * 1.5, 'square', 0.18, t0 + idx * step);
        });
    }

    // 1-UP Extra Life chime
    playLifeUp() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t0 = this.ctx.currentTime;
        const notes = [
            { f: 523.25, d: 0.08 }, // C5
            { f: 659.25, d: 0.08 }, // E5
            { f: 783.99, d: 0.08 }, // G5
            { f: 1046.50, d: 0.12 }, // C6
            { f: 783.99, d: 0.08 }, // G5
            { f: 1046.50, d: 0.25 }  // C6
        ];
        let offset = 0;
        notes.forEach(n => {
            this.playPulse(n.f, n.d, 'square', 0.2, t0 + offset);
            offset += n.d * 0.95;
        });
    }

    // Tally counter tick
    playTallyTick() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t0 = this.ctx.currentTime;
        this.playPulse(1200, 0.03, 'square', 0.15, t0);
    }

    // Tally bonus tally end fanfare
    playTallyEnd() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t0 = this.ctx.currentTime;
        const notes = [659.25, 783.99, 987.77, 1318.51];
        notes.forEach((freq, idx) => {
            this.playPulse(freq, 0.1, 'square', 0.16, t0 + idx * 0.08);
        });
    }

    // Game Over fanfare
    playGameOver() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t0 = this.ctx.currentTime;
        const notes = [
            { f: 349.23, d: 0.2 }, // F4
            { f: 311.13, d: 0.2 }, // D#4
            { f: 293.66, d: 0.2 }, // D4
            { f: 261.63, d: 0.45 } // C4
        ];
        let offset = 0;
        notes.forEach(n => {
            this.playPulse(n.f, n.d, 'triangle', 0.25, t0 + offset);
            this.playPulse(n.f * 0.5, n.d, 'square', 0.15, t0 + offset);
            offset += n.d;
        });
        this.playNoise(0.6, 200, 'lowpass', 0.15, t0 + 0.6);
    }

    // ==========================================
    // Iconic Stage Start Jingle
    // ==========================================
    playIntroMusic(onEnd = null) {
        if (!this.ctx || this.muted) {
            if (onEnd) setTimeout(onEnd, 2200);
            return;
        }
        this.resume();
        const t0 = this.ctx.currentTime + 0.05;
        const bpm = 140;
        const beat = 60 / bpm; // ~0.428s
        const s16 = beat / 4;  // ~0.107s
        const s8 = beat / 2;   // ~0.214s
        const qtr = beat;      // ~0.428s

        // Melody Notes (Pulse 1)
        const melody = [
            // Bar 1
            { f: 293.66, d: s8 },  // D4
            { f: 369.99, d: s8 },  // F#4
            { f: 440.00, d: s8 },  // A4
            { f: 587.33, d: s8 },  // D5
            { f: 554.37, d: s8 },  // C#5
            { f: 493.88, d: s8 },  // B4
            { f: 440.00, d: s8 },  // A4
            { f: 369.99, d: s8 },  // F#4
            // Bar 2
            { f: 392.00, d: s8 },  // G4
            { f: 440.00, d: s8 },  // A4
            { f: 493.88, d: qtr }, // B4
            { f: 440.00, d: qtr }, // A4
            // Bar 3
            { f: 392.00, d: s8 },  // G4
            { f: 329.63, d: s8 },  // E4
            { f: 369.99, d: s8 },  // F#4
            { f: 392.00, d: s8 },  // G4
            { f: 440.00, d: qtr }, // A4
            { f: 392.00, d: qtr }, // G4
            // Bar 4
            { f: 369.99, d: s8 },  // F#4
            { f: 293.66, d: s8 },  // D4
            { f: 329.63, d: s8 },  // E4
            { f: 369.99, d: s8 },  // F#4
            { f: 392.00, d: qtr }, // G4
            { f: 369.99, d: qtr }, // F#4
            // Bar 5
            { f: 329.63, d: qtr }, // E4
            { f: 440.00, d: qtr }, // A4
            { f: 293.66, d: qtr * 1.5 } // D4
        ];

        let offset = 0;
        melody.forEach(n => {
            this.playPulse(n.f, n.d * 0.9, 'square', 0.16, t0 + offset);
            // Harmony (Pulse 2 - lower 3rd/5th)
            this.playPulse(n.f * 0.75, n.d * 0.85, 'square', 0.08, t0 + offset);
            offset += n.d;
        });

        // Bass Line (Triangle)
        const bassNotes = [
            { f: 146.83, d: qtr }, // D3
            { f: 146.83, d: qtr },
            { f: 196.00, d: qtr }, // G3
            { f: 146.83, d: qtr }, // D3
            { f: 164.81, d: qtr }, // E3
            { f: 196.00, d: qtr }, // G3
            { f: 146.83, d: qtr }, // D3
            { f: 146.83, d: qtr },
            { f: 220.00, d: qtr }, // A3
            { f: 146.83, d: qtr * 1.5 } // D3
        ];

        let bassOffset = 0;
        bassNotes.forEach(n => {
            this.playPulse(n.f, n.d * 0.9, 'triangle', 0.22, t0 + bassOffset);
            bassOffset += n.d;
        });

        const totalTime = Math.max(offset, bassOffset) * 1000;
        if (onEnd) {
            setTimeout(onEnd, totalTime + 100);
        }
    }

    // ==========================================
    // Tank Engine Loop
    // ==========================================
    startEngine() {
        if (this.isEngineRunning || !this.ctx) return;
        try {
            this.engineOsc = this.ctx.createOscillator();
            this.engineGain = this.ctx.createGain();

            this.engineOsc.type = 'triangle';
            this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

            this.engineGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

            this.engineOsc.connect(this.engineGain);
            this.engineGain.connect(this.masterGain);

            this.engineOsc.start();
            this.isEngineRunning = true;
        } catch (e) {
            console.warn("Failed to start engine audio:", e);
        }
    }

    updateEngine(isMoving) {
        if (!this.ctx || this.muted) return;
        if (!this.isEngineRunning) {
            this.startEngine();
        }
        if (!this.engineGain) return;

        const t0 = this.ctx.currentTime;
        if (isMoving) {
            // Moving engine frequency fluctuation
            this.engineGain.gain.cancelScheduledValues(t0);
            this.engineGain.gain.setValueAtTime(0.08, t0);
            const freq = 65 + (Math.sin(t0 * 25) * 15);
            this.engineOsc.frequency.setValueAtTime(freq, t0);
            this.isEngineMoving = true;
        } else {
            // Idle engine
            this.engineGain.gain.cancelScheduledValues(t0);
            this.engineGain.gain.setValueAtTime(0.015, t0);
            this.engineOsc.frequency.setValueAtTime(45, t0);
            this.isEngineMoving = false;
        }
    }

    stopEngine() {
        if (!this.isEngineRunning) return;
        try {
            if (this.engineGain && this.ctx) {
                this.engineGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
            }
            if (this.engineOsc) {
                this.engineOsc.stop(this.ctx.currentTime + 0.05);
                this.engineOsc.disconnect();
            }
        } catch (e) {}
        this.engineOsc = null;
        this.engineGain = null;
        this.isEngineRunning = false;
    }
}

// Global audio singleton
window.soundEngine = new SoundEngine();
