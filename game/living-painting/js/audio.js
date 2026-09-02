/**
 * 音效模块
 * 职责: 管理背景音效，可根据手指位置调整音量/声源
 */

class AudioController {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.masterGain = null;
    }

    async init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0;
    }

    async loadSound(name, url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds[name] = audioBuffer;
    }

    play(name, loop = true) {
        if (!this.sounds[name]) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        source.loop = loop;
        source.connect(this.masterGain);
        source.start();
        return source;
    }

    fadeIn(duration = 0.5) {
        this.masterGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + duration);
    }

    fadeOut(duration = 0.3) {
        this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

window.AudioController = AudioController;
