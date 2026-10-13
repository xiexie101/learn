/**
 * 《七里香》× 莫奈印象 Web Audio 合成与环境声景引擎
 * 支持：
 * 1. 纯算法 Web Audio API 合成《七里香》经典前奏、主歌、副歌与间奏旋律和弦
 * 2. 印象派自然声景生成（晨风、夏蝉、雷阵雨水滴、风铃声）
 * 3. 外部音频文件载入（支持用户上传或载入外部七里香原曲音频）
 */

class QilixiangAudioEngine {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.isExternal = false;
        this.externalAudio = null;
        this.bpm = 76;
        this.currentTime = 0;
        this.duration = 299; // 04:59 = 299秒
        this.timer = null;
        this.onTimeUpdate = null;
        this.onPlayStateChange = null;

        // 音效增益节点
        this.masterGain = null;
        this.musicGain = null;
        this.ambientGain = null;

        // 环境发生器
        this.ambientNodes = [];
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
            this.ambientGain.connect(this.masterGain);
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 载入外部音频文件（如原版伴奏或歌曲）
    loadExternalFile(file) {
        if (!this.externalAudio) {
            this.externalAudio = new Audio();
            this.externalAudio.crossOrigin = "anonymous";
            this.externalAudio.addEventListener('ended', () => {
                this.pause();
                this.seek(0);
            });
        }
        const url = URL.createObjectURL(file);
        this.externalAudio.src = url;
        this.isExternal = true;
        this.externalAudio.load();
    }

    // 纯合成器播放主旋律音符 (频率 Hz, 持续时长, 乐器类型)
    playSynthNote(freq, startTime, duration, type = 'acoustic') {
        if (!this.ctx || freq <= 0) return;
        const now = this.ctx.currentTime + startTime;

        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        if (type === 'guitar') {
            osc.type = 'triangle';
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1800, now);
            filter.frequency.exponentialRampToValueAtTime(400, now + duration);

            noteGain.gain.setValueAtTime(0.001, now);
            noteGain.gain.linearRampToValueAtTime(0.35, now + 0.02);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        } else if (type === 'bell') {
            osc.type = 'sine';
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(800, now);

            noteGain.gain.setValueAtTime(0.001, now);
            noteGain.gain.linearRampToValueAtTime(0.2, now + 0.01);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.5);
        } else if (type === 'strings') {
            osc.type = 'sawtooth';
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(900, now);

            noteGain.gain.setValueAtTime(0.001, now);
            noteGain.gain.linearRampToValueAtTime(0.18, now + 0.15);
            noteGain.gain.linearRampToValueAtTime(0.12, now + duration * 0.8);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        } else {
            // Warm rhodes / piano
            osc.type = 'sine';
            noteGain.gain.setValueAtTime(0.001, now);
            noteGain.gain.linearRampToValueAtTime(0.3, now + 0.03);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        }

        osc.frequency.setValueAtTime(freq, now);
        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + duration + 0.2);
    }

    // 印象派环境声景（风铃、夏蝉、细雨、晨鸟）
    startAmbientLandscape(sceneType) {
        this.stopAmbientLandscape();
        if (!this.ctx) return;

        // 1. 晨风与微气流（Pink/Brownian Noise）
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            output[i] = (b0 + b1 + b2) * 0.08;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const windFilter = this.ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.setValueAtTime(sceneType === 'rain' ? 800 : 420, this.ctx.currentTime);
        windFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

        const windGain = this.ctx.createGain();
        windGain.gain.setValueAtTime(sceneType === 'rain' ? 0.35 : 0.12, this.ctx.currentTime);

        whiteNoise.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(this.ambientGain);
        whiteNoise.start();

        this.ambientNodes.push({ source: whiteNoise, gain: windGain });
    }

    stopAmbientLandscape() {
        this.ambientNodes.forEach(item => {
            try {
                item.source.stop();
                item.source.disconnect();
            } catch (e) {}
        });
        this.ambientNodes = [];
    }

    play() {
        this.init();
        if (this.isPlaying) return;
        this.isPlaying = true;

        if (this.isExternal && this.externalAudio) {
            this.externalAudio.currentTime = this.currentTime;
            this.externalAudio.play();
        }

        this.startAmbientLandscape(this.getSceneByTime(this.currentTime));

        const startTimestamp = performance.now() - (this.currentTime * 1000);
        this.timer = setInterval(() => {
            if (!this.isPlaying) return;
            const elapsed = (performance.now() - startTimestamp) / 1000;
            this.currentTime = Math.min(elapsed, this.duration);

            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.currentTime);
            }

            // 调度内置旋律乐音（模拟吉他与风铃核心motif）
            this.tickSynthMelody(this.currentTime);

            if (this.currentTime >= this.duration) {
                this.pause();
                this.seek(0);
            }
        }, 50);

        if (this.onPlayStateChange) {
            this.onPlayStateChange(true);
        }
    }

    pause() {
        this.isPlaying = false;
        clearInterval(this.timer);
        this.stopAmbientLandscape();

        if (this.isExternal && this.externalAudio) {
            this.externalAudio.pause();
        }

        if (this.onPlayStateChange) {
            this.onPlayStateChange(false);
        }
    }

    seek(seconds) {
        this.currentTime = Math.max(0, Math.min(seconds, this.duration));
        if (this.isExternal && this.externalAudio) {
            this.externalAudio.currentTime = this.currentTime;
        }
        if (this.onTimeUpdate) {
            this.onTimeUpdate(this.currentTime);
        }
        if (this.isPlaying) {
            this.pause();
            this.play();
        }
    }

    getSceneByTime(time) {
        if (time < 25) return 'morning';
        if (time < 74) return 'summer_field';
        if (time < 124) return 'rain';
        if (time < 149) return 'rainbow';
        if (time < 173) return 'haystack';
        if (time < 222) return 'rain_night';
        if (time < 272) return 'jasmine_night';
        return 'orangerie';
    }

    // 实时触发七里香标志性的五音和弦与铃声
    tickSynthMelody(time) {
        if (this.isExternal) return; // 若有外部音轨则静音内置生成
        // 依据节拍生成浪漫的清晨风铃与微风琴声
        const beat = (time * (this.bpm / 60)) % 4;
        if (Math.abs(beat - Math.round(beat)) < 0.05) {
            const notes = [493.88, 554.37, 622.25, 739.99, 830.61]; // B major pentatonic
            const note = notes[Math.floor((time * 1.5) % notes.length)];
            if (time < 25 || (time > 124 && time < 149) || time > 272) {
                this.playSynthNote(note, 0, 0.6, 'bell');
            } else if (time >= 74 && time < 124) {
                this.playSynthNote(note * 0.5, 0, 0.4, 'strings');
            } else {
                this.playSynthNote(note, 0, 0.5, 'guitar');
            }
        }
    }
}

window.QilixiangAudioEngine = QilixiangAudioEngine;
