/**
 * Dance Tour Pass - 巡演票夹核心逻辑与交互系统
 * 
 * 包含：
 * 1. Web Audio API 原生程序化声学生成器 (Scratch, 808 Stamp, Paper Tear, Tap SFX, Boom-Bap BGM)
 * 2. CRT 卡带机开机仪式与多阶段状态机
 * 3. 拟物三联票根切换系统与自适应画布回退演示
 * 4. 连击打 Call 弹幕喷射引擎 (Combo HUD + Slang Particles)
 * 5. 逼真撕票裂开与 808 震动盖章认证系统
 * 6. 终极彩蛋：Canvas 潮流街舞杂志封面海报生成器 (双模切换 + 移动端长按保存)
 */

(function() {
  'use strict';

  // 读取配置对象（兜底保护）
  const CONFIG = window.TOUR_CONFIG || {
    teacherName: "K-Rock",
    teacherFullName: "K-Rock 导师",
    className: "夜校嘻哈舞进阶一期",
    date: "2026.09.10",
    wishes: [],
    tributeLetter: { paragraphs: [] }
  };

  // ==========================================================================
  // 1. Web Audio API 原生程序化音效与音乐引擎 (零外链依赖，离线秒响)
  // ==========================================================================
  class HipHopAudioEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.isPlayingBgm = false;
      this.bgmTimer = null;
      this.beatStep = 0;
      this.audioElement = null;
      this.wasBgmPlayingBeforeVideo = false;
    }

    initContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    // 1.1 DJ 搓碟擦片声效 (Scratch SFX)
    playScratch() {
      this.initContext();
      if (this.isMuted || !this.ctx) return;

      const duration = 0.35;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // 生成带调制的噪声
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin(i / 15);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // 带通滤波扫频模拟唱针快速摩擦
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 4.0;
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(3200, this.ctx.currentTime + 0.12);
      filter.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.7, this.ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + duration);
    }

    // 1.2 纸张撕裂质感音效 (Paper Tear SFX)
    playTear() {
      this.initContext();
      if (this.isMuted || !this.ctx) return;

      const duration = 0.4;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // 模拟纸张纤维断裂的不规则爆破冲激
        const tearCrunch = Math.random() > 0.85 ? (Math.random() * 2 - 1) * 1.5 : (Math.random() * 2 - 1) * 0.3;
        data[i] = tearCrunch;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2800, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + duration);
    }

    // 1.3 808 重低音重锤印章音效 (808 Bass Kick Stamp SFX)
    playStamp() {
      this.initContext();
      if (this.isMuted || !this.ctx) return;

      const now = this.ctx.currentTime;

      // 808 Sub Kick 扫频
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.35);

      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.75);

      // 叠加打击瞬态扑面杂音 (Transient Punch Click)
      const clickBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
      const clickData = clickBuf.getChannelData(0);
      for (let i = 0; i < clickData.length; i++) {
        clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 80);
      }
      const clickSrc = this.ctx.createBufferSource();
      clickSrc.buffer = clickBuf;
      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.9, now);
      clickSrc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickSrc.start(now);
    }

    // 1.4 连击打 Call 敲击音效 (Crisp Percussion Tap SFX)
    playTap(comboCount = 0) {
      this.initContext();
      if (this.isMuted || !this.ctx) return;

      const now = this.ctx.currentTime;
      // 随 combo 上升微升音调
      const baseFreq = 420 + Math.min(comboCount * 18, 500);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    }

    // 1.5 原生程序化 Boom-Bap 律动合成器 (4/4 拍经典 Hip-Hop Beat)
    startBgm() {
      if (this.isPlayingBgm) return;
      this.isPlayingBgm = true;

      // 若配置了外部音频且能播放，优先播放外部音频
      if (CONFIG.bgm && CONFIG.bgm.trim() !== '') {
        try {
          if (!this.audioElement) {
            this.audioElement = new Audio(CONFIG.bgm);
            this.audioElement.loop = true;
          }
          this.audioElement.play().catch(() => {
            // 自动降级为原生合成律动
            this.startProceduralBgm();
          });
          return;
        } catch (e) {
          // fallback
        }
      }

      this.startProceduralBgm();
    }

    startProceduralBgm() {
      this.initContext();
      if (this.bgmTimer) clearInterval(this.bgmTimer);

      const bpm = 88; // 经典 Boom-Bap 黄金速度
      const stepMs = (60000 / bpm) / 4; // 16分音符步长 (~170ms)
      this.beatStep = 0;

      // 循环打击乐器时钟
      this.bgmTimer = setInterval(() => {
        if (this.isMuted || !this.ctx) return;

        const step = this.beatStep % 16;
        const now = this.ctx.currentTime;

        // 808 Kick 节奏 (第 0, 10 步)
        if (step === 0 || step === 10) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(130, now);
          osc.frequency.exponentialRampToValueAtTime(42, now + 0.22);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.32);
        }

        // Snare 军鼓节奏 (第 4, 12 步)
        if (step === 4 || step === 12) {
          const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.12, this.ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 1500);
          }
          const s = this.ctx.createBufferSource();
          s.buffer = buf;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 1800;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          s.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          s.start(now);
        }

        // Hi-Hat 闭镲节奏 (每个偶数步，带轻微力度变化)
        if (step % 2 === 0) {
          const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.04, this.ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) {
            d[i] = (Math.random() * 2 - 1);
          }
          const s = this.ctx.createBufferSource();
          s.buffer = buf;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 7500;
          const gain = this.ctx.createGain();
          const hatVol = (step % 4 === 0) ? 0.12 : 0.06;
          gain.gain.setValueAtTime(hatVol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          s.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          s.start(now);
        }

        // 808 Sub-Bass 律动 (步骤 0, 3, 6, 10, 14 构成经典 4/4 拍 Boom-Bap 贝斯走向)
        const bassNotes = { 0: 55, 3: 65.4, 6: 49, 10: 55, 14: 65.4 }; // A1, C2, G1, A1, C2
        if (bassNotes[step] !== undefined) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(bassNotes[step], now);
          bassGain.gain.setValueAtTime(0.18, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          bassOsc.connect(bassGain);
          bassGain.connect(this.ctx.destination);
          bassOsc.start(now);
          bassOsc.stop(now + 0.32);
        }

        this.beatStep++;
      }, stepMs);
    }

    pauseBgm() {
      this.isPlayingBgm = false;
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
      if (this.audioElement) {
        this.audioElement.pause();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.isMuted) {
        this.pauseBgm();
      } else {
        this.startBgm();
      }
      return !this.isMuted;
    }

    pauseBgmForVideo() {
      if (this.isPlayingBgm && !this.isMuted) {
        this.wasBgmPlayingBeforeVideo = true;
        this.pauseBgm();
      }
    }

    resumeBgmFromVideo() {
      if (this.wasBgmPlayingBeforeVideo && !this.isMuted) {
        this.wasBgmPlayingBeforeVideo = false;
        this.startBgm();
      }
    }
  }

  const audio = new HipHopAudioEngine();

  // ==========================================================================
  // 2. DOM 节点引用与核心状态管理
  // ==========================================================================
  const dom = {
    // 顶部与开机
    introOverlay: document.getElementById('introOverlay'),
    igniteBtn: document.getElementById('igniteBtn'),
    vinylToggle: document.getElementById('vinylToggle'),
    vinylDisc: document.getElementById('vinylDisc'),
    bgmStatusText: document.getElementById('bgmStatusText'),
    reelLeft: document.getElementById('reelLeft'),
    reelRight: document.getElementById('reelRight'),
    ticketSerialTag: document.getElementById('ticketSerialTag'),

    // 选项卡
    tabs: [
      document.getElementById('tab0'),
      document.getElementById('tab1'),
      document.getElementById('tab2')
    ],
    panels: [
      document.getElementById('panel0'),
      document.getElementById('panel1'),
      document.getElementById('panel2')
    ],

    // 票根一：排练档案
    rehearsalVideo: document.getElementById('rehearsalVideo'),
    rehearsalFallback: document.getElementById('rehearsalFallback'),
    rehearsalCanvas: document.getElementById('rehearsalCanvas'),
    rehearsalPlayOverlay: document.getElementById('rehearsalPlayOverlay'),
    rehearsalPlayBtn: document.getElementById('rehearsalPlayBtn'),
    rehearsalTogglePlayBtn: document.getElementById('rehearsalTogglePlayBtn'),
    vhsFilter: document.getElementById('vhsFilter'),
    vhsToggleBtn: document.getElementById('vhsToggleBtn'),
    vhsTimer: document.getElementById('vhsTimer'),
    rehearsalTitle: document.getElementById('rehearsalTitle'),
    rehearsalDesc: document.getElementById('rehearsalDesc'),

    // 票根二：齐舞主秀
    cheerStage: document.getElementById('cheerStage'),
    cheerTapZone: document.getElementById('cheerTapZone'),
    mainShowVideo: document.getElementById('mainShowVideo'),
    mainShowFallback: document.getElementById('mainShowFallback'),
    mainShowPlayBtn: document.getElementById('mainShowPlayBtn'),
    stageCanvas: document.getElementById('stageCanvas'),
    comboHud: document.getElementById('comboHud'),
    comboCountText: document.getElementById('comboCountText'),
    comboBadgeText: document.getElementById('comboBadgeText'),
    mainShowTitle: document.getElementById('mainShowTitle'),
    mainShowDesc: document.getElementById('mainShowDesc'),

    // 票根三：学员告白
    stubTop: document.getElementById('stubTop'),
    stubTeacherName: document.getElementById('stubTeacherName'),
    stubClassName: document.getElementById('stubClassName'),
    stubDate: document.getElementById('stubDate'),
    checkinStatusBadge: document.getElementById('checkinStatusBadge'),
    tearBtn: document.getElementById('tearBtn'),
    tearActionBox: document.getElementById('tearActionBox'),
    stampContainer: document.getElementById('stampContainer'),
    revealedSection: document.getElementById('revealedSection'),
    polaroidImg: document.getElementById('polaroidImg'),
    polaroidCaption: document.getElementById('polaroidCaption'),
    wishesContainer: document.getElementById('wishesContainer'),
    letterTitle: document.getElementById('letterTitle'),
    letterParagraphs: document.getElementById('letterParagraphs'),
    letterSign: document.getElementById('letterSign'),
    finalBarcodeText: document.getElementById('finalBarcodeText'),
    openMagazineBtn: document.getElementById('openMagazineBtn'),

    // 潮流杂志海报生成器 Modal
    magazineModal: document.getElementById('magazineModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    modeTeacherBtn: document.getElementById('modeTeacherBtn'),
    modeCrewBtn: document.getElementById('modeCrewBtn'),
    posterResultImg: document.getElementById('posterResultImg'),
    posterLoadingSpinner: document.getElementById('posterLoadingSpinner'),
    downloadPosterBtn: document.getElementById('downloadPosterBtn'),
    posterCanvas: document.getElementById('posterCanvas'),

    // 彩带 Canvas
    confettiCanvas: document.getElementById('confettiCanvas')
  };

  // 状态变量
  let currentTabIndex = 0;
  let isTornAndStamped = false;
  let cheerCombo = 0;
  let cheerComboTimeout = null;
  let activePosterMode = 'teacher'; // 'teacher' | 'crew'

  // ==========================================================================
  // 3. 开机破冰仪式：DROP THE BEAT
  // ==========================================================================
  function setupIntroIgnition() {
    // 渲染动态卡带标签与工牌序列号
    const tapeLabel = document.getElementById('introCassetteLabel');
    if (tapeLabel) {
      tapeLabel.textContent = `TAPE: 2026 教师节特别企划 · ${CONFIG.teacherName} 专场`;
    }
    if (dom.ticketSerialTag) {
      dom.ticketSerialTag.textContent = `${CONFIG.ticketNo || '#HIPHOP-2026-VIP'}`;
    }

    dom.igniteBtn.addEventListener('click', () => {
      // 激活 Web Audio 上下文
      audio.initContext();
      // 触发 DJ 搓碟与触感反馈
      audio.playScratch();
      if ('vibrate' in navigator) {
        try { navigator.vibrate([40, 60, 100]); } catch (e) {}
      }

      // 启动背景律动
      audio.startBgm();
      dom.vinylDisc.classList.add('spinning');
      dom.bgmStatusText.textContent = 'PLAYING';

      // 卡带磁带加速旋转
      dom.reelLeft.classList.add('rotating');
      dom.reelRight.classList.add('rotating');

      // 屏幕闪烁光晕，平滑卷起 Intro 界面
      dom.introOverlay.classList.add('dismissed');

      // 自动启动排练与舞台动效
      startRehearsalSimulation();
      startStageSimulation();
    });

    // 黑胶播放器点击交互
    dom.vinylToggle.addEventListener('click', () => {
      const isAudible = audio.toggleMute();
      if (isAudible) {
        dom.vinylDisc.classList.add('spinning');
        dom.bgmStatusText.textContent = 'PLAYING';
        audio.playScratch();
      } else {
        dom.vinylDisc.classList.remove('spinning');
        dom.bgmStatusText.textContent = 'MUTED';
      }
    });
  }

  // ==========================================================================
  // 4. 三联票根切换器与导航管理
  // ==========================================================================
  function switchTab(index) {
    if (index === currentTabIndex) return;
    currentTabIndex = index;

    // 播放轻微切票搓碟声
    audio.playScratch();

    // 切换离开时自动暂停正在播放的视频并恢复背景音乐
    if (index !== 0 && dom.rehearsalVideo && !dom.rehearsalVideo.paused) {
      dom.rehearsalVideo.pause();
    }
    if (index !== 1 && dom.mainShowVideo && !dom.mainShowVideo.paused) {
      dom.mainShowVideo.pause();
    }

    dom.tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });

    dom.panels.forEach((panel, i) => {
      panel.classList.toggle('active', i === index);
    });

    // 平滑滚动回顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupNavigation() {
    dom.tabs.forEach((tab, idx) => {
      tab.addEventListener('click', () => switchTab(idx));
    });

    // 底部“前往下一联”按键
    document.querySelectorAll('.next-pass-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = parseInt(btn.getAttribute('data-next'), 10);
        switchTab(next);
      });
    });
  }

  // ==========================================================================
  // 5. 票根一：排练档案特性 (VHS 滤镜 + 拟真排练动效回退)
  // ==========================================================================
  function setupRehearsalPass() {
    // 渲染文案
    if (CONFIG.rehearsalVideo) {
      dom.rehearsalTitle.textContent = CONFIG.rehearsalVideo.title;
      dom.rehearsalDesc.textContent = CONFIG.rehearsalVideo.description;
      if (CONFIG.rehearsalVideo.src) {
        dom.rehearsalVideo.src = CONFIG.rehearsalVideo.src;
        dom.rehearsalVideo.poster = CONFIG.rehearsalVideo.poster;
        dom.rehearsalFallback.style.display = 'none';
      } else {
        // 无视频链接时显示模拟画布
        if (dom.rehearsalPlayOverlay) dom.rehearsalPlayOverlay.classList.remove('playing');
      }
      dom.rehearsalVideo.addEventListener('error', () => {
        dom.rehearsalFallback.style.display = 'flex';
        dom.rehearsalVideo.style.display = 'none';
        if (dom.rehearsalPlayOverlay) dom.rehearsalPlayOverlay.classList.remove('playing');
      });
    }

    // 播放/暂停控制逻辑
    let isRehearsalPlaying = false;
    function toggleRehearsalPlay() {
      if (CONFIG.rehearsalVideo && CONFIG.rehearsalVideo.src) {
        if (dom.rehearsalVideo.paused) {
          dom.rehearsalVideo.play().catch(() => {});
        } else {
          dom.rehearsalVideo.pause();
        }
      } else {
        // 模拟模式下的播放状态切换反馈
        isRehearsalPlaying = !isRehearsalPlaying;
        dom.rehearsalTogglePlayBtn.textContent = isRehearsalPlaying ? '⏸ 暂停花絮' : '▶ 播放花絮';
        if (dom.rehearsalPlayOverlay) {
          dom.rehearsalPlayOverlay.classList.toggle('playing', isRehearsalPlaying);
        }
        audio.playTap();
      }
    }

    if (dom.rehearsalPlayBtn) dom.rehearsalPlayBtn.addEventListener('click', toggleRehearsalPlay);
    if (dom.rehearsalTogglePlayBtn) dom.rehearsalTogglePlayBtn.addEventListener('click', toggleRehearsalPlay);
    if (dom.rehearsalVideo) dom.rehearsalVideo.addEventListener('click', toggleRehearsalPlay);

    // 视频事件联动：自动避让 BGM，并在视频暂停/结束时无缝恢复
    dom.rehearsalVideo.addEventListener('play', () => {
      dom.rehearsalPlayOverlay.classList.add('playing');
      dom.rehearsalTogglePlayBtn.textContent = '⏸ 暂停花絮';
      audio.pauseBgmForVideo();
      dom.vinylDisc.classList.remove('spinning');
      dom.bgmStatusText.textContent = 'PAUSED';
    });

    dom.rehearsalVideo.addEventListener('pause', () => {
      dom.rehearsalPlayOverlay.classList.remove('playing');
      dom.rehearsalTogglePlayBtn.textContent = '▶ 播放花絮';
      audio.resumeBgmFromVideo();
      if (!audio.isMuted) {
        dom.vinylDisc.classList.add('spinning');
        dom.bgmStatusText.textContent = 'PLAYING';
      }
    });

    dom.rehearsalVideo.addEventListener('ended', () => {
      dom.rehearsalPlayOverlay.classList.remove('playing');
      dom.rehearsalTogglePlayBtn.textContent = '▶ 播放花絮';
      audio.resumeBgmFromVideo();
      if (!audio.isMuted) {
        dom.vinylDisc.classList.add('spinning');
        dom.bgmStatusText.textContent = 'PLAYING';
      }
    });

    // VHS 滤镜切换
    dom.vhsToggleBtn.addEventListener('click', () => {
      const isHidden = dom.vhsFilter.classList.toggle('hidden');
      dom.vhsToggleBtn.classList.toggle('active', !isHidden);
      dom.vhsToggleBtn.textContent = isHidden ? '📼 VHS 复古滤镜: 关' : '📼 VHS 复古滤镜: 开';
    });

    // VHS 计时器跳动
    setInterval(() => {
      const d = new Date();
      const s = String(d.getSeconds()).padStart(2, '0');
      const ms = String(Math.floor(d.getMilliseconds() / 10)).padStart(2, '0');
      dom.vhsTimer.textContent = `00:09:${s}.${ms}`;
    }, 100);
  }

  // 拟真排练动态画布 (自愈兜底：无真实视频时呈现卡点排练动画)
  function startRehearsalSimulation() {
    const canvas = dom.rehearsalCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const funQuotes = [
      "“手抬高！不要像在摸鱼！”",
      "“这是第5个八拍，谁又在划水？”",
      "“注意身体隔离 (Isolation)！”",
      "“下蹲下蹲！腿酸就对了！”",
      "“最后一组！真的是最后一组！”"
    ];
    let quoteIndex = 0;
    let quoteTimer = 0;

    function render() {
      frame++;
      ctx.fillStyle = '#0f111a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制舞房木地板与镜面网格透视
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 180);
        ctx.lineTo(x * 1.4 - 100, canvas.height);
        ctx.stroke();
      }

      // 绘制动感音波跳动
      const beatIntensity = Math.abs(Math.sin(frame * 0.1));
      ctx.fillStyle = 'rgba(204, 255, 0, 0.2)';
      for (let i = 0; i < 24; i++) {
        const h = Math.sin(frame * 0.15 + i * 0.5) * 20 + 25;
        ctx.fillRect(40 + i * 20, 160 - h, 12, h);
      }

      // 绘制街舞排练火柴人小人 Bounce 律动
      const bounce = Math.abs(Math.sin(frame * 0.12)) * 14;
      const legOffset = Math.sin(frame * 0.12) * 15;

      // 居中主小人
      ctx.save();
      ctx.translate(canvas.width / 2, 170 - bounce);
      ctx.strokeStyle = '#ccff00';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      // 头部
      ctx.beginPath();
      ctx.arc(0, -35, 12, 0, Math.PI * 2);
      ctx.stroke();
      // 鸭舌帽
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-12, -44, 28, 5);

      // 躯干
      ctx.beginPath();
      ctx.moveTo(0, -23);
      ctx.lineTo(0, 15);
      ctx.stroke();

      // 双臂 Bounce 摆动
      ctx.beginPath();
      ctx.moveTo(-25, -5 + bounce * 0.5);
      ctx.lineTo(0, -15);
      ctx.lineTo(25, -5 - bounce * 0.5);
      ctx.stroke();

      // 双腿马步
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(-18, 45);
      ctx.lineTo(-24 + legOffset, 75);
      ctx.moveTo(0, 15);
      ctx.lineTo(18, 45);
      ctx.lineTo(24 - legOffset, 75);
      ctx.stroke();
      ctx.restore();

      // 左侧顺拐对比小人 (顺拐中)
      ctx.save();
      ctx.translate(140, 180 - bounce * 0.6);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -30, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, 10);
      ctx.stroke();
      ctx.moveTo(-15, 0); ctx.lineTo(0, -10); ctx.lineTo(15, 0); ctx.stroke();
      ctx.moveTo(0, 10); ctx.lineTo(-12, 40); ctx.lineTo(-15, 65);
      ctx.moveTo(0, 10); ctx.lineTo(12, 40); ctx.lineTo(15, 65);
      ctx.stroke();
      ctx.fillStyle = '#00f0ff';
      ctx.font = '10px sans-serif';
      ctx.fillText('顺拐同学A', -24, 82);
      ctx.restore();

      // 气泡幽默排练语录
      quoteTimer++;
      if (quoteTimer > 180) {
        quoteIndex = (quoteIndex + 1) % funQuotes.length;
        quoteTimer = 0;
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(canvas.width / 2 - 120, 255, 240, 32);
      ctx.strokeStyle = '#ffb700';
      ctx.strokeRect(canvas.width / 2 - 120, 255, 240, 32);

      ctx.fillStyle = '#ffb700';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(funQuotes[quoteIndex], canvas.width / 2, 276);

      requestAnimationFrame(render);
    }
    render();
  }

  // ==========================================================================
  // 6. 票根二：齐舞主秀与连击打 Call 气氛组引擎
  // ==========================================================================
  function setupMainShowPass() {
    if (CONFIG.mainShowVideo) {
      dom.mainShowTitle.textContent = CONFIG.mainShowVideo.title;
      dom.mainShowDesc.textContent = CONFIG.mainShowVideo.description;
      if (CONFIG.mainShowVideo.src) {
        dom.mainShowVideo.src = CONFIG.mainShowVideo.src;
        dom.mainShowVideo.poster = CONFIG.mainShowVideo.poster;
        dom.mainShowFallback.style.display = 'none';
      }
      dom.mainShowVideo.addEventListener('error', () => {
        dom.mainShowFallback.style.display = 'flex';
        dom.mainShowVideo.style.display = 'none';
      });
    }

    // 齐舞大秀播放/暂停控制
    function toggleMainShowPlay() {
      if (CONFIG.mainShowVideo && CONFIG.mainShowVideo.src) {
        if (dom.mainShowVideo.paused) {
          dom.mainShowVideo.play().catch(() => {});
        } else {
          dom.mainShowVideo.pause();
        }
      } else {
        // 模拟模式下切换大片播放状态与卡点音效
        const isPlaying = dom.mainShowPlayBtn.classList.toggle('playing');
        dom.mainShowPlayBtn.textContent = isPlaying ? '⏸ 暂停齐舞大秀' : '▶ 播放齐舞大秀';
        audio.playTap();
      }
    }

    if (dom.mainShowPlayBtn) {
      dom.mainShowPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMainShowPlay();
      });
    }

    // 齐舞视频播放与 BGM 避让联动
    dom.mainShowVideo.addEventListener('play', () => {
      dom.mainShowPlayBtn.classList.add('playing');
      dom.mainShowPlayBtn.textContent = '⏸ 暂停齐舞大秀';
      audio.pauseBgmForVideo();
      dom.vinylDisc.classList.remove('spinning');
      dom.bgmStatusText.textContent = 'PAUSED';
    });

    dom.mainShowVideo.addEventListener('pause', () => {
      dom.mainShowPlayBtn.classList.remove('playing');
      dom.mainShowPlayBtn.textContent = '▶ 播放齐舞大秀';
      audio.resumeBgmFromVideo();
      if (!audio.isMuted) {
        dom.vinylDisc.classList.add('spinning');
        dom.bgmStatusText.textContent = 'PLAYING';
      }
    });

    dom.mainShowVideo.addEventListener('ended', () => {
      dom.mainShowPlayBtn.classList.remove('playing');
      dom.mainShowPlayBtn.textContent = '▶ 播放齐舞大秀';
      audio.resumeBgmFromVideo();
      if (!audio.isMuted) {
        dom.vinylDisc.classList.add('spinning');
        dom.bgmStatusText.textContent = 'PLAYING';
      }
    });

    // 连击打 Call 词库与色盘
    const SLANG_TERMS = [
      '🔥 RESPECT!', '💥 SWAG!', '⚡ POP!', 'SHEESH!', '太顶了!', 
      '💃 KILL IT!', 'SALUTE 🫡', '炸翻了 🧨', '🚀 FLY!', 'C位拉满!',
      '🔥 绝了!', '👑 导师带飞!', '💯 卡点狂魔', '✨ 炸场王'
    ];
    const COLORS = ['#ccff00', '#00f0ff', '#ff0055', '#ffb700', '#a855f7', '#00ff88'];

    function handleCheerTap(e) {
      // 阻止误触发拖动或缩放
      if (e.cancelable) e.preventDefault();

      const rect = dom.cheerStage.getBoundingClientRect();
      let clientX, clientY;

      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // 递增 Combo
      cheerCombo++;
      audio.playTap(cheerCombo);

      // 更新 Combo HUD
      dom.comboHud.classList.add('visible');
      dom.comboCountText.textContent = `x${cheerCombo}`;

      let badge = 'GET LIT!';
      if (cheerCombo >= 50) badge = '👑 GOD LEVEL DANCER!';
      else if (cheerCombo >= 30) badge = '🧨 炸穿地心!';
      else if (cheerCombo >= 15) badge = '🔥 齐舞封神!';
      else if (cheerCombo >= 6) badge = '⚡ SUPER SWAG!';
      dom.comboBadgeText.textContent = badge;

      // 重置 Combo 倒计时
      if (cheerComboTimeout) clearTimeout(cheerComboTimeout);
      cheerComboTimeout = setTimeout(() => {
        cheerCombo = 0;
        dom.comboHud.classList.remove('visible');
      }, 1500);

      // 舞台边缘霓虹闪光反馈
      dom.cheerStage.classList.add('active-hit');
      setTimeout(() => dom.cheerStage.classList.remove('active-hit'), 120);

      // 喷射街头俚语发光粒子
      const term = SLANG_TERMS[Math.floor(Math.random() * SLANG_TERMS.length)];
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const rot = (Math.random() * 30 - 15) + 'deg';
      const dx = (Math.random() * 60 - 30) + 'px';

      const particle = document.createElement('div');
      particle.className = 'cheer-particle';
      particle.textContent = term;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.color = color;
      particle.style.setProperty('--rot', rot);
      particle.style.setProperty('--dx', dx);

      dom.cheerStage.appendChild(particle);

      // 动画结束后自动销毁
      particle.addEventListener('animationend', () => {
        particle.remove();
      });
    }

    dom.cheerTapZone.addEventListener('touchstart', handleCheerTap, { passive: false });
    dom.cheerTapZone.addEventListener('mousedown', handleCheerTap);
  }

  // 齐舞舞台高能激光与剪影动效回退
  function startStageSimulation() {
    const canvas = dom.stageCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    function render() {
      frame++;
      ctx.fillStyle = '#090a12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 舞台顶端旋转激光扫射
      const laser1X = (Math.sin(frame * 0.04) * 0.5 + 0.5) * canvas.width;
      const laser2X = (Math.cos(frame * 0.05) * 0.5 + 0.5) * canvas.width;

      // 聚光灯光锥
      ctx.save();
      const grad1 = ctx.createRadialGradient(laser1X, 0, 10, laser1X, canvas.height, 220);
      grad1.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.moveTo(laser1X, 0);
      ctx.lineTo(laser1X - 100, canvas.height);
      ctx.lineTo(laser1X + 100, canvas.height);
      ctx.fill();

      const grad2 = ctx.createRadialGradient(laser2X, 0, 10, laser2X, canvas.height, 220);
      grad2.addColorStop(0, 'rgba(255, 0, 85, 0.35)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.moveTo(laser2X, 0);
      ctx.lineTo(laser2X - 120, canvas.height);
      ctx.lineTo(laser2X + 120, canvas.height);
      ctx.fill();
      ctx.restore();

      // 5 人编舞齐舞剪影姿态
      const syncBounce = Math.abs(Math.sin(frame * 0.14)) * 16;
      const crewX = [120, 210, 280, 350, 440];

      crewX.forEach((cx, idx) => {
        ctx.save();
        ctx.translate(cx, 200 - syncBounce);
        // C位导师发金色高光，其余学员发青蓝与粉紫
        ctx.strokeStyle = idx === 2 ? '#ffb700' : (idx % 2 === 0 ? '#00f0ff' : '#ccff00');
        ctx.lineWidth = idx === 2 ? 5 : 3.5;
        ctx.lineCap = 'round';

        // 头
        ctx.beginPath();
        ctx.arc(0, -32, idx === 2 ? 14 : 10, 0, Math.PI * 2);
        ctx.stroke();

        // 身体
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(0, 16);
        ctx.stroke();

        // 双手齐舞卡点 Pose
        const armWave = Math.sin(frame * 0.14 + idx * 0.4) * 20;
        ctx.beginPath();
        ctx.moveTo(-24, -10 + armWave);
        ctx.lineTo(0, -8);
        ctx.lineTo(24, -10 - armWave);
        ctx.stroke();

        // 双腿踩点
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(-14, 45);
        ctx.lineTo(-18, 70);
        ctx.moveTo(0, 16);
        ctx.lineTo(14, 45);
        ctx.lineTo(18, 70);
        ctx.stroke();
        ctx.restore();
      });

      // 底部舞台高光文字
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ NIGHT CREW SYNCHRONIZED ROUTINE ★', canvas.width / 2, 290);

      requestAnimationFrame(render);
    }
    render();
  }

  // ==========================================================================
  // 7. 票根三：学员告白与撕票盖章认证系统
  // ==========================================================================
  function setupRespectPass() {
    // 注入教师信息
    dom.stubTeacherName.textContent = CONFIG.teacherFullName || CONFIG.teacherName;
    dom.stubClassName.textContent = CONFIG.className;
    dom.stubDate.textContent = CONFIG.date;

    // 注入拍立得照片与容错兜底
    dom.polaroidImg.onerror = () => {
      if (window.TOUR_FALLBACKS && window.TOUR_FALLBACKS.groupPhoto) {
        dom.polaroidImg.src = window.TOUR_FALLBACKS.groupPhoto;
      }
    };
    dom.polaroidImg.src = CONFIG.groupPhoto;
    dom.polaroidCaption.textContent = `📸 ${CONFIG.className} · 毕业齐舞合照 · 祝最酷导师教师节快乐！`;

    // 注入学员手写留言卡片
    renderWishesWall();

    // 注入导师集体长信
    renderTributeLetter();

    // 撕票与盖章交互（支持点击或手指滑动撕开）
    dom.tearBtn.addEventListener('click', executeTearAndStamp);

    const tearDivider = document.querySelector('.tear-divider');
    if (tearDivider) {
      let touchStartX = 0;
      tearDivider.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
        }
      }, { passive: true });
      tearDivider.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches.length > 0) {
          const touchEndX = e.changedTouches[0].clientX;
          if (Math.abs(touchEndX - touchStartX) > 40) {
            executeTearAndStamp();
          }
        }
      }, { passive: true });
    }
  }

  function renderWishesWall() {
    dom.wishesContainer.innerHTML = '';
    const wishes = CONFIG.wishes || [];

    wishes.forEach(item => {
      const card = document.createElement('div');
      card.className = 'wish-card';

      card.innerHTML = `
        <div class="wish-header">
          <div class="wish-author">
            <span class="wish-avatar">${item.avatar || '🧢'}</span>
            <span class="wish-name">${item.name}</span>
          </div>
          <span class="wish-tag" style="background: ${item.tagColor}22; color: ${item.tagColor}; border: 1px solid ${item.tagColor}55;">
            #${item.tag}
          </span>
        </div>
        <div class="wish-body">${item.content}</div>
        <div class="wish-footer">
          <button class="like-btn" data-id="${item.id}">
            <span>❤️</span>
            <span class="like-count">${item.likes || 18}</span>
          </button>
        </div>
      `;

      // 点赞爱心交互
      const likeBtn = card.querySelector('.like-btn');
      likeBtn.addEventListener('click', () => {
        const isLiked = likeBtn.classList.toggle('liked');
        const countSpan = likeBtn.querySelector('.like-count');
        let currentLikes = parseInt(countSpan.textContent, 10);
        countSpan.textContent = isLiked ? currentLikes + 1 : currentLikes - 1;
        audio.playTap();
      });

      dom.wishesContainer.appendChild(card);
    });
  }

  function renderTributeLetter() {
    if (!CONFIG.tributeLetter) return;
    dom.letterTitle.textContent = CONFIG.tributeLetter.title || "TO OUR FAVORITE DANCE MENTOR";
    dom.letterParagraphs.innerHTML = '';

    const paras = CONFIG.tributeLetter.paragraphs || [];
    paras.forEach(text => {
      const p = document.createElement('p');
      p.textContent = text;
      dom.letterParagraphs.appendChild(p);
    });

    if (CONFIG.tributeLetter.sign) {
      dom.letterSign.textContent = CONFIG.tributeLetter.sign;
    }
  }

  function executeTearAndStamp() {
    if (isTornAndStamped) return;
    isTornAndStamped = true;

    // 1. 播放撕纸音效与纸张断裂动效
    audio.playTear();
    dom.stubTop.classList.add('torn');
    dom.tearActionBox.style.display = 'none';

    // 2. 延迟 220ms 触发 808 重锤盖章
    setTimeout(() => {
      audio.playStamp();

      // 屏幕震动
      document.body.classList.add('shake-screen');
      setTimeout(() => document.body.classList.remove('shake-screen'), 350);

      // 印章重重砸下
      dom.stampContainer.classList.add('stamped');
      dom.checkinStatusBadge.textContent = 'VERIFIED VIP';
      dom.checkinStatusBadge.style.color = '#00ff88';
      dom.checkinStatusBadge.style.background = 'rgba(0, 255, 136, 0.2)';
      dom.finalBarcodeText.textContent = 'CHECKED-IN // RESPECT FOREVER';

      if ('vibrate' in navigator) {
        try { navigator.vibrate([60, 40, 180]); } catch (e) {}
      }

      // 3. 展开学员留言与合照墙
      setTimeout(() => {
        dom.revealedSection.classList.add('expanded');
        // 全屏彩带雨燃放
        launchConfetti();
      }, 400);

    }, 220);
  }

  // ==========================================================================
  // 8. 终极彩蛋：Canvas 动态街舞潮流杂志封面生成器
  // ==========================================================================
  function setupMagazineCoverGenerator() {
    dom.openMagazineBtn.addEventListener('click', () => {
      if (!isTornAndStamped) {
        executeTearAndStamp();
      }
      dom.magazineModal.classList.add('active');
      audio.playScratch();
      generateMagazineCover(activePosterMode);
    });

    dom.closeModalBtn.addEventListener('click', () => {
      dom.magazineModal.classList.remove('active');
    });

    // 双模切换按键
    dom.modeTeacherBtn.addEventListener('click', () => {
      activePosterMode = 'teacher';
      dom.modeTeacherBtn.classList.add('active');
      dom.modeCrewBtn.classList.remove('active');
      audio.playTap();
      generateMagazineCover('teacher');
    });

    dom.modeCrewBtn.addEventListener('click', () => {
      activePosterMode = 'crew';
      dom.modeCrewBtn.classList.add('active');
      dom.modeTeacherBtn.classList.remove('active');
      audio.playTap();
      generateMagazineCover('crew');
    });

    // 下载按键
    dom.downloadPosterBtn.addEventListener('click', () => {
      const dataUrl = dom.posterResultImg.src;
      if (!dataUrl) return;
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Dance-Tour-Pass-VIP-Cover-${activePosterMode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  // 绘制程序化街舞潮流视觉（用于海报主图未提供或加载失败时的自愈兜底）
  function drawProceduralFallbackArt(ctx, mode, imgY, imgHeight, width) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(35, imgY, width - 70, imgHeight);
    ctx.clip();

    // 聚光灯深邃渐变
    const grad = ctx.createRadialGradient(width / 2, imgY + 200, 20, width / 2, imgY + 300, 360);
    grad.addColorStop(0, mode === 'teacher' ? 'rgba(204, 255, 0, 0.25)' : 'rgba(0, 240, 255, 0.25)');
    grad.addColorStop(0.6, 'rgba(255, 0, 85, 0.15)');
    grad.addColorStop(1, '#11131c');
    ctx.fillStyle = grad;
    ctx.fillRect(35, imgY, width - 70, imgHeight);

    // 舞台激光光束
    ctx.strokeStyle = mode === 'teacher' ? 'rgba(204, 255, 0, 0.4)' : 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, imgY); ctx.lineTo(width / 2, imgY + imgHeight);
    ctx.moveTo(width - 100, imgY); ctx.lineTo(width / 2, imgY + imgHeight);
    ctx.stroke();

    if (mode === 'teacher') {
      // 导师 Freeze 剪影
      ctx.strokeStyle = '#ccff00';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const cx = width / 2;
      const cy = imgY + 220;

      // 头与帽子
      ctx.beginPath();
      ctx.arc(cx, cy - 80, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#ccff00';
      ctx.fill();
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(cx - 30, cy - 100, 60, 10);

      // 躯干与街舞破招动作手臂
      ctx.beginPath();
      ctx.moveTo(cx, cy - 50); ctx.lineTo(cx - 20, cy + 50);
      ctx.moveTo(cx - 15, cy - 20); ctx.lineTo(cx - 85, cy + 30); ctx.lineTo(cx - 130, cy - 20);
      ctx.moveTo(cx - 15, cy - 20); ctx.lineTo(cx + 80, cy - 30); ctx.lineTo(cx + 120, cy + 40);
      // 腿部 Freeze 造型
      ctx.moveTo(cx - 20, cy + 50); ctx.lineTo(cx - 80, cy + 130); ctx.lineTo(cx - 140, cy + 100);
      ctx.moveTo(cx - 20, cy + 50); ctx.lineTo(cx + 60, cy + 140); ctx.lineTo(cx + 110, cy + 200);
      ctx.stroke();

      ctx.fillStyle = '#ccff00';
      ctx.font = '900 24px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ DANCE MENTOR MVP · SPECIAL STAGE ★', cx, imgY + imgHeight - 35);
    } else {
      // 齐舞 5 人群像剪影
      const crewColors = ['#00f0ff', '#ccff00', '#ffd700', '#ccff00', '#00f0ff'];
      const crewPos = [width / 2 - 190, width / 2 - 95, width / 2, width / 2 + 95, width / 2 + 190];

      crewPos.forEach((cx, i) => {
        const cy = imgY + 260;
        ctx.strokeStyle = crewColors[i];
        ctx.fillStyle = crewColors[i];
        ctx.lineWidth = i === 2 ? 12 : 9;
        ctx.lineCap = 'round';

        // 头部
        ctx.beginPath();
        ctx.arc(cx, cy - 65, i === 2 ? 20 : 16, 0, Math.PI * 2);
        ctx.fill();

        // 躯干与手臂
        ctx.beginPath();
        ctx.moveTo(cx, cy - 40); ctx.lineTo(cx, cy + 40);
        ctx.moveTo(cx, cy - 20); ctx.lineTo(cx - 45, cy); ctx.lineTo(cx - 50, cy - 35);
        ctx.moveTo(cx, cy - 20); ctx.lineTo(cx + 45, cy); ctx.lineTo(cx + 50, cy - 35);
        // 腿部
        ctx.moveTo(cx, cy + 40); ctx.lineTo(cx - 30, cy + 110);
        ctx.moveTo(cx, cy + 40); ctx.lineTo(cx + 30, cy + 110);
        ctx.stroke();
      });

      ctx.fillStyle = '#00f0ff';
      ctx.font = '900 22px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CREW ALL STARS · NIGHT CLASS GRADUATION', width / 2, imgY + imgHeight - 35);
    }
    ctx.restore();
  }

  // 高清 2x Canvas 合成潮流杂志海报
  function generateMagazineCover(mode) {
    const canvas = dom.posterCanvas;
    const ctx = canvas.getContext('2d');
    const width = 800;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;

    if (dom.posterLoadingSpinner) {
      dom.posterLoadingSpinner.classList.remove('hidden');
    }

    // 1. 底色：深灰黑街头质感渐变
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#10121a');
    bgGrad.addColorStop(0.5, '#171a26');
    bgGrad.addColorStop(1, '#090a0f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. 街头网格微线与装饰框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }

    // 外边框机能线
    ctx.strokeStyle = mode === 'teacher' ? '#ccff00' : '#00f0ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    const imgY = 170;
    const imgHeight = 540;

    function finish() {
      renderMagazineTypography(ctx, mode);
      dom.posterResultImg.src = canvas.toDataURL('image/png');
      if (dom.posterLoadingSpinner) {
        dom.posterLoadingSpinner.classList.add('hidden');
      }
    }

    // 3. 加载主视觉图片 (带自愈容错)
    const imgSrc = mode === 'teacher' ? CONFIG.teacherPhoto : CONFIG.groupPhoto;

    if (!imgSrc || imgSrc.trim() === '') {
      drawProceduralFallbackArt(ctx, mode, imgY, imgHeight, width);
      finish();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(35, imgY, width - 70, imgHeight);
      ctx.clip();
      ctx.drawImage(img, 35, imgY, width - 70, imgHeight);

      // 图片底部暗黑渐变融合
      const fadeGrad = ctx.createLinearGradient(0, imgY + imgHeight - 160, 0, imgY + imgHeight);
      fadeGrad.addColorStop(0, 'rgba(9, 10, 15, 0)');
      fadeGrad.addColorStop(1, '#171a26');
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(35, imgY, width - 70, imgHeight);
      ctx.restore();

      finish();
    };

    img.onerror = () => {
      // 外部图片加载失败时，自动绘制高保真街舞视觉兜底，防止出现裂图或黑洞
      drawProceduralFallbackArt(ctx, mode, imgY, imgHeight, width);
      finish();
    };

    img.src = imgSrc;
  }

  function renderMagazineTypography(ctx, mode) {
    const width = 800;
    const height = 1200;

    // 顶部顶条
    ctx.fillStyle = mode === 'teacher' ? '#ccff00' : '#00f0ff';
    ctx.fillRect(20, 20, width - 40, 28);

    ctx.fillStyle = '#000000';
    ctx.font = '900 13px Impact, -apple-system, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('SPECIAL ISSUE // 2026 TEACHERS\' DAY VIP EDITION // 夜校街舞特别企划', 34, 40);
    ctx.textAlign = 'right';
    ctx.fillText('NO. 01 / ALL STARS', width - 34, 40);
    ctx.textAlign = 'left';

    // 巨型杂志名：DANCE STYLE / NIGHT CREW
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 86px Impact, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(mode === 'teacher' ? 'DANCE STYLE' : 'NIGHT CREW', 36, 128);

    // 副标题标签
    ctx.fillStyle = mode === 'teacher' ? '#ff0055' : '#ffb700';
    ctx.font = 'bold 15px -apple-system, sans-serif';
    ctx.fillText('VOL. 09 · 2026 AUTUMN · 街舞导师高光特刊', 40, 152);

    // 底部主标与文案排版
    const botY = 740;

    if (mode === 'teacher') {
      // ================= 模式 A: MVP 导师封面 (精准排版，杜绝文字与印章重叠) =================
      ctx.fillStyle = '#ccff00';
      ctx.font = '900 38px Impact, -apple-system, sans-serif';
      ctx.fillText('BEST MENTOR OF THE YEAR', 40, botY + 25);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px -apple-system, "PingFang SC", sans-serif';
      // 限制宽度最大 480px，彻底避免撞击右侧 x=540 的官方认证印章
      ctx.fillText(`2026年度夜校最佳 Hip-Hop 领路人 · ${CONFIG.teacherName}`, 40, botY + 65, 480);

      ctx.fillStyle = '#ffb700';
      ctx.font = 'italic bold 15px -apple-system, sans-serif';
      ctx.fillText(`“${CONFIG.slogan || 'KEEP ON BOUNCING, NEVER STOP THE GROOVE!'}”`, 40, botY + 98, 480);

      ctx.fillStyle = '#9aa0b4';
      ctx.font = '13px -apple-system, sans-serif';
      ctx.fillText(`演出班级：${CONFIG.className}  |  席位等级：首席 C 位导师`, 40, botY + 128, 480);
      ctx.fillText(`演出日期：${CONFIG.date}  |  场馆：${CONFIG.venue || 'NIGHT STUDIO // 01号排练厅'}`, 40, botY + 152, 480);

      // 右侧专属官方认证钢印徽章 (x: 545..760, y: 765..895)
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 3;
      ctx.strokeRect(545, botY + 15, 215, 125);
      ctx.fillStyle = 'rgba(255, 0, 85, 0.08)';
      ctx.fillRect(545, botY + 15, 215, 125);

      ctx.fillStyle = '#ff0055';
      ctx.font = '900 16px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ OFFICIAL CERTIFIED ★', 652, botY + 45);
      ctx.font = 'bold 15px -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('终身名誉导师认证', 652, botY + 74);
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('VIP ALL ACCESS PASS', 652, botY + 98);
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillStyle = '#a0a5b8';
      ctx.fillText('2026.09.10 · 独家授予', 652, botY + 122);
      ctx.textAlign = 'left';

      // 导师学员真情寄语横幅 (y: 920..1015)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, botY + 180, width - 80, 80);
      ctx.fillRect(40, botY + 180, width - 80, 80);

      ctx.fillStyle = '#e2e6f0';
      ctx.font = '13px -apple-system, sans-serif';
      ctx.fillText('“从第1节课的同手同脚到齐舞卡点，感谢老师带我们找到身体的律动与自信生活态度！”', 56, botY + 215, width - 112);
      ctx.fillStyle = '#ccff00';
      ctx.font = 'bold 12px -apple-system, sans-serif';
      ctx.fillText(`—— ${CONFIG.className}全体学员 满分敬意献礼`, 56, botY + 242);

    } else {
      // ================= 模式 B: 厂牌大合照封面 (完整展示全员名册卡片墙) =================
      ctx.fillStyle = '#00f0ff';
      ctx.font = '900 38px Impact, -apple-system, sans-serif';
      ctx.fillText('THE NIGHT CREW GRADUATION', 40, botY + 25);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px -apple-system, "PingFang SC", sans-serif';
      ctx.fillText(`夜校最炸齐舞厂牌全员名册 · ${CONFIG.className}`, 40, botY + 65, 720);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'italic bold 15px -apple-system, sans-serif';
      ctx.fillText('“白天写字楼打工人，晚上齐舞大秀炸翻全场 · 属于我们的热血毕业季”', 40, botY + 98, 720);

      // 全员卡片徽章网格 (两列排布，完整展现全班同学与个性标签)
      const wishes = CONFIG.wishes || [];
      const startCardY = botY + 120;
      const cardW = 345;
      const cardH = 34;

      wishes.slice(0, 8).forEach((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cardX = col === 0 ? 40 : 415;
        const cardY = startCardY + row * 42;

        // 卡片底色
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.strokeStyle = (item.tagColor || '#00f0ff') + '55';
        ctx.lineWidth = 1;
        ctx.strokeRect(cardX, cardY, cardW, cardH);
        ctx.fillRect(cardX, cardY, cardW, cardH);

        // 学员头像与姓名
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px -apple-system, sans-serif';
        ctx.fillText(`${item.avatar || '🧢'} ${item.name}`, cardX + 10, cardY + 22);

        // 标签
        ctx.fillStyle = item.tagColor || '#00f0ff';
        ctx.font = 'bold 11px -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`#${item.tag}`, cardX + cardW - 10, cardY + 22);
        ctx.textAlign = 'left';
      });

      // 厂牌导师致敬标
      ctx.fillStyle = '#a0a5b8';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText(`领舞导师：${CONFIG.teacherFullName || CONFIG.teacherName}  |  期末全员齐舞通过 · RESPECT FOREVER`, 40, startCardY + 4 * 42 + 22);
    }

    // 5. 底部防伪条形码与日期序列
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(35, height - 80);
    ctx.lineTo(width - 35, height - 80);
    ctx.stroke();

    // 仿真实体条形码
    ctx.fillStyle = '#ffffff';
    let bx = 40;
    const barcodeWidths = [2, 4, 1, 5, 2, 6, 3, 2, 4, 1, 3, 5, 2, 4, 2, 6, 1, 3, 4, 2, 5, 2, 4, 3, 1, 4];
    barcodeWidths.forEach(bw => {
      ctx.fillRect(bx, height - 68, bw, 32);
      bx += bw + 3;
    });

    ctx.font = '11px monospace';
    ctx.fillStyle = '#7a8196';
    ctx.fillText(`${CONFIG.ticketNo || '#HIPHOP-2026-VIP'} // OFFICIAL TOUR PASS // EDITION 2026`, 40, height - 18);

    ctx.textAlign = 'right';
    ctx.font = 'bold 13px Impact, sans-serif';
    ctx.fillStyle = '#ccff00';
    ctx.fillText('DANCE TOUR VIP ALL ACCESS · 2026.09.10', width - 40, height - 32);
    ctx.textAlign = 'left';
  }

  // ==========================================================================
  // 9. 金色彩带纸雨特效引擎 (Confetti Canvas)
  // ==========================================================================
  function launchConfetti() {
    const canvas = dom.confettiCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ffd700', '#ff0055', '#00f0ff', '#ccff00', '#ffffff', '#ffb700'];
    const count = 90;
    const particles = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height * 0.5,
        w: Math.random() * 10 + 6,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: Math.random() * 4 + 3,
        vx: (Math.random() - 0.5) * 2,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10
      });
    }

    let durationFrames = 220;
    function renderConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        p.rot += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      durationFrames--;
      if (durationFrames > 0) {
        requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    renderConfetti();
  }

  // ==========================================================================
  // 10. 初始化入口
  // ==========================================================================
  function init() {
    setupIntroIgnition();
    setupNavigation();
    setupRehearsalPass();
    setupMainShowPass();
    setupRespectPass();
    setupMagazineCoverGenerator();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
