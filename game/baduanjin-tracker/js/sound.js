/**
 * 音效管理模块
 * 使用 Web Audio API 合成音效，无需外部文件
 */

class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.5; // 默认音量
    }

    toggle(enabled) {
        this.enabled = enabled;
        if (this.ctx.state === 'suspended' && enabled) {
            this.ctx.resume();
        }
    }

    // 播放短促的点击声 (木鱼声/水滴声)
    playClick() {
        if (!this.enabled) return;
        this.resumeContext();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        // 模拟木鱼声: 频率快速下降，短包络
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.start(t);
        osc.stop(t + 0.1);
    }

    // 播放完成音效 (清脆的钟声/磬声)
    playComplete() {
        if (!this.enabled) return;
        this.resumeContext();

        const t = this.ctx.currentTime;

        // 基频
        this.playBellNote(t, 523.25); // C5
        // 泛音
        this.playBellNote(t, 1046.50, 0.5); // C6
    }

    // 播放单个钟声频段
    playBellNote(startTime, freq, volumeScale = 1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(this.masterGain);

        // 包络: 快速起音，长释放
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3 * volumeScale, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.0);

        osc.start(startTime);
        osc.stop(startTime + 2.0);
    }

    // 播放庆祝音效 (简单的琶音)
    playCelebration() {
        if (!this.enabled) return;
        this.resumeContext();

        const t = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C

        notes.forEach((freq, i) => {
            this.playBellNote(t + i * 0.1, freq, 0.8);
        });
    }

    resumeContext() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}

window.SoundManager = SoundManager;
