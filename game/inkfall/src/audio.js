// Web Audio API procedural sound synthesizer for INKFALL
// Provides 100% self-contained ballpoint pen and paint audio effects

class InkSoundSystem {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.bgmPlaying = false;
        this.bgmPhase = 'climb'; // 'climb' | 'boss1' | 'boss2' | 'boss3' | 'victory'
        this.stepTimer = null;
        this.beatCount = 0;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
            this.bgmGain.connect(this.masterGain);

            this.initialized = true;
            this.startBgmLoop();
        } catch (e) {
            console.warn('Web Audio initialization failed:', e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.init();
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.7, this.ctx.currentTime);
        }
        return this.muted;
    }

    // Ballpoint pen scribble sound
    playPenScratch(pitch = 1.0, duration = 0.08) {
        if (this.muted || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;

        // Bandpass filtered noise
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800 * pitch, t);
        filter.Q.setValueAtTime(4.0, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(t);
        noise.stop(t + duration);
    }

    // Ballpoint pen click (retractable pen click)
    playPenClick() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;

        // 1st click
        const osc1 = this.ctx.createOscillator();
        const g1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(2400, t);
        osc1.frequency.exponentialRampToValueAtTime(800, t + 0.02);
        g1.gain.setValueAtTime(0.4, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        osc1.connect(g1);
        g1.connect(this.sfxGain);
        osc1.start(t);
        osc1.stop(t + 0.02);

        // 2nd mini snap
        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1200, t + 0.025);
        osc2.frequency.exponentialRampToValueAtTime(400, t + 0.04);
        g2.gain.setValueAtTime(0.2, t + 0.025);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
        osc2.connect(g2);
        g2.connect(this.sfxGain);
        osc2.start(t + 0.025);
        osc2.stop(t + 0.045);
    }

    // Gunshot (Ripper weapon shot)
    playShoot(isSurge = false) {
        if (this.muted || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = isSurge ? 'sawtooth' : 'triangle';
        const startFreq = isSurge ? 950 : 700;
        const endFreq = isSurge ? 180 : 120;
        const dur = isSurge ? 0.09 : 0.06;

        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3200, t);

        gain.gain.setValueAtTime(isSurge ? 0.4 : 0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + dur);

        // High pen scribble snap
        this.playPenScratch(2.0, 0.04);
    }

    // Air-Dash swoosh
    playDash() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const dur = 0.2;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + dur);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + dur);

        // Noise rush
        this.playPenScratch(0.8, dur);
    }

    // Bullet deflection (Dash sends bullets back!)
    playDeflect() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;

        // Bright metallic pen nib ping
        const osc1 = this.ctx.createOscillator();
        const g1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1600, t);
        osc1.frequency.exponentialRampToValueAtTime(2400, t + 0.1);
        g1.gain.setValueAtTime(0.5, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc1.connect(g1);
        g1.connect(this.sfxGain);
        osc1.start(t);
        osc1.stop(t + 0.25);

        // Harmonizing bell overtone
        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(3200, t);
        g2.gain.setValueAtTime(0.3, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc2.connect(g2);
        g2.connect(this.sfxGain);
        osc2.start(t);
        osc2.stop(t + 0.3);
    }

    // Wet, squelchy paint splatter explosion
    playPaintSplat(isMajor = false) {
        if (this.muted || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const dur = isMajor ? 0.35 : 0.18;

        // Low bubble thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + dur);

        gain.gain.setValueAtTime(isMajor ? 0.5 : 0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + dur);

        // Splat noise texture (wet slap)
        const bufferSize = Math.floor(this.ctx.sampleRate * (dur * 0.7));
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.frequency.exponentialRampToValueAtTime(400, t + dur * 0.7);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(isMajor ? 0.45 : 0.25, t);
        nGain.gain.exponentialRampToValueAtTime(0.01, t + dur * 0.7);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);

        noise.start(t);
        noise.stop(t + dur * 0.7);
    }

    // Player hit / damage crunch
    playHit() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.15);
        this.playPenScratch(0.6, 0.1);
    }

    // Jump sound
    playJump() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.12);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    // Focus bullet-time enter/exit
    playFocusToggle(isOn) {
        if (this.muted || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        if (isOn) {
            osc.frequency.setValueAtTime(500, t);
            osc.frequency.exponentialRampToValueAtTime(180, t + 0.2);
        } else {
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.exponentialRampToValueAtTime(500, t + 0.15);
        }
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (isOn ? 0.2 : 0.15));

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + (isOn ? 0.2 : 0.15));
    }

    // Boss Phase Roar / Alarm
    playBossPhase(phaseNum) {
        if (this.muted || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90 + phaseNum * 25, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.6);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.6);
    }

    // Victory Fanfare
    playVictory() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.1;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.8);
        });
    }

    // Adaptive Lo-Fi Paper & Pencil BGM Engine
    setBgmPhase(phase) {
        this.bgmPhase = phase;
    }

    startBgmLoop() {
        if (this.stepTimer) clearInterval(this.stepTimer);
        const bpm = 120;
        const stepMs = (60 / bpm / 2) * 1000; // eighth notes

        this.stepTimer = setInterval(() => {
            if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
            this.playBgmStep(this.beatCount);
            this.beatCount = (this.beatCount + 1) % 16;
        }, stepMs);
    }

    playBgmStep(step) {
        const t = this.ctx.currentTime;

        // Paper-tap percussion (Kick / Snare / Shaker)
        if (step % 4 === 0) {
            // Pencil tap kick
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(110, t);
            osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);
            g.gain.setValueAtTime(0.2, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(g);
            g.connect(this.bgmGain);
            osc.start(t);
            osc.stop(t + 0.08);
        } else if (step % 4 === 2) {
            // Pen click snare
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.04);
            g.gain.setValueAtTime(0.08, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
            osc.connect(g);
            g.connect(this.bgmGain);
            osc.start(t);
            osc.stop(t + 0.04);
        }

        // Bassline / Synth notes
        if (this.bgmPhase === 'climb') {
            const climbBass = [130.81, 146.83, 164.81, 174.61]; // C3, D3, E3, F3
            if (step % 4 === 0) {
                const note = climbBass[Math.floor(step / 4)];
                const osc = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(note, t);
                g.gain.setValueAtTime(0.12, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                osc.connect(g);
                g.connect(this.bgmGain);
                osc.start(t);
                osc.stop(t + 0.2);
            }
        } else if (this.bgmPhase.startsWith('boss')) {
            // Dark cathedral organ / choir arpeggio
            const bossChords = [110, 123.47, 130.81, 98]; // A2, B2, C3, G2
            const root = bossChords[Math.floor(step / 4)];
            const arp = [root, root * 1.5, root * 1.78, root * 2];
            const note = arp[step % 4];

            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = this.bgmPhase === 'boss3' ? 'sawtooth' : 'triangle';
            osc.frequency.setValueAtTime(note, t);
            g.gain.setValueAtTime(this.bgmPhase === 'boss3' ? 0.16 : 0.1, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(this.bgmPhase === 'boss3' ? 1800 : 900, t);

            osc.connect(filter);
            filter.connect(g);
            g.connect(this.bgmGain);
            osc.start(t);
            osc.stop(t + 0.18);
        }
    }
}

window.InkSound = new InkSoundSystem();
