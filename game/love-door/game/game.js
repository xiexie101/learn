/**
 * LoveDoor - 表白迷宫游戏
 * 纯 Canvas 实现
 */
(() => {
  // ============ CONFIG ============
  const PLAYER_NAME = new URLSearchParams(location.search).get('name') || 'you';

  // ============ CANVAS SETUP ============
  const canvas = document.getElementById('GameCanvas');
  const ctx = canvas.getContext('2d');

  let W, H, SCALE;
  // design size (portrait phone)
  const DW = 400, DH = 720;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    SCALE = Math.min(W / DW, H / DH);
  }
  resize();
  window.addEventListener('resize', resize);

  // ============ INPUT ============
  const pointer = { down: false, x: 0, y: 0, startX: 0, startY: 0 };

  canvas.addEventListener('pointerdown', e => {
    pointer.down = true;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.startX = e.clientX;
    pointer.startY = e.clientY;
  });
  canvas.addEventListener('pointermove', e => {
    if (pointer.down) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    }
  });
  canvas.addEventListener('pointerup', () => { pointer.down = false; });
  canvas.addEventListener('pointercancel', () => { pointer.down = false; });

  // ============ SCENE MANAGER ============
  let currentScene = null;

  function setScene(scene) {
    currentScene = scene;
    if (scene.init) scene.init();
  }

  // ============ DRAWING HELPERS ============
  function drawDoor(cx, cy, w, h, color) {
    ctx.save();
    // door body
    ctx.fillStyle = color || '#555';
    ctx.beginPath();
    ctx.moveTo(cx - w/2, cy - h/2);
    ctx.lineTo(cx + w/2, cy - h/2);
    ctx.lineTo(cx + w/2, cy + h/2);
    ctx.lineTo(cx - w/2, cy + h/2);
    ctx.closePath();
    ctx.fill();
    // perspective lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h/2);
    ctx.lineTo(cx, cy + h/2);
    ctx.stroke();
    // keyhole
    ctx.fillStyle = '#111';
    const kr = w * 0.12;
    ctx.beginPath();
    ctx.arc(cx, cy - h*0.05, kr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - kr*0.5, cy - h*0.05, kr, h*0.15);
    // shadow beneath
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + h/2 + 4, w*0.65, 6, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function drawStickFigure(cx, cy, size, color) {
    ctx.save();
    ctx.strokeStyle = color || '#222';
    ctx.fillStyle = color || '#222';
    ctx.lineWidth = 2.5 * (size / 30);
    ctx.lineCap = 'round';

    const s = size;
    // head
    ctx.beginPath();
    ctx.arc(cx, cy - s*1.1, s*0.35, 0, Math.PI*2);
    ctx.stroke();
    // body
    ctx.beginPath();
    ctx.moveTo(cx, cy - s*0.75);
    ctx.lineTo(cx, cy + s*0.2);
    ctx.stroke();
    // arms (slightly down)
    ctx.beginPath();
    ctx.moveTo(cx - s*0.45, cy - s*0.35);
    ctx.lineTo(cx + s*0.45, cy - s*0.35);
    ctx.stroke();
    // legs
    ctx.beginPath();
    ctx.moveTo(cx, cy + s*0.2);
    ctx.lineTo(cx - s*0.3, cy + s*0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + s*0.2);
    ctx.lineTo(cx + s*0.3, cy + s*0.85);
    ctx.stroke();
    ctx.restore();
  }

  function drawKey(cx, cy, size, color) {
    ctx.save();
    ctx.strokeStyle = color || '#d4a017';
    ctx.fillStyle = color || '#d4a017';
    ctx.lineWidth = 2.5 * (size / 20);
    ctx.lineCap = 'round';
    // ring
    const r = size * 0.35;
    ctx.beginPath();
    ctx.arc(cx - size*0.3, cy, r, 0, Math.PI*2);
    ctx.stroke();
    // shaft
    ctx.beginPath();
    ctx.moveTo(cx - size*0.3 + r, cy);
    ctx.lineTo(cx + size*0.55, cy);
    ctx.stroke();
    // teeth
    ctx.beginPath();
    ctx.moveTo(cx + size*0.55, cy);
    ctx.lineTo(cx + size*0.55, cy + size*0.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + size*0.35, cy);
    ctx.lineTo(cx + size*0.35, cy + size*0.2);
    ctx.stroke();
    ctx.restore();
  }

  function drawHourglass(cx, cy, size, progress, color) {
    ctx.save();
    ctx.strokeStyle = color || '#aaa';
    ctx.lineWidth = 2 * (size / 30);
    ctx.lineCap = 'round';
    const hw = size * 0.4;
    const hh = size * 0.7;

    // top triangle
    ctx.beginPath();
    ctx.moveTo(cx - hw, cy - hh);
    ctx.lineTo(cx + hw, cy - hh);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.stroke();
    // bottom triangle
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - hw, cy + hh);
    ctx.lineTo(cx + hw, cy + hh);
    ctx.closePath();
    ctx.stroke();

    // sand in bottom (fills with progress)
    if (progress > 0) {
      const fillH = hh * Math.min(progress, 1);
      ctx.fillStyle = color || '#aaa';
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      const topY = cy + hh - fillH;
      const topW = hw * (fillH / hh);
      ctx.moveTo(cx - topW, topY);
      ctx.lineTo(cx + topW, topY);
      ctx.lineTo(cx + hw, cy + hh);
      ctx.lineTo(cx - hw, cy + hh);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // sand in top (drains)
    if (progress < 1) {
      const remain = 1 - progress;
      const fillH = hh * remain;
      ctx.fillStyle = color || '#aaa';
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(cx - hw, cy - hh);
      ctx.lineTo(cx + hw, cy - hh);
      const botW = hw * (fillH / hh);
      ctx.lineTo(cx + botW, cy - hh + fillH);
      ctx.lineTo(cx - botW, cy - hh + fillH);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // ============ SCENE: SPLASH ============
  const splashScene = {
    alpha: 0,
    init() { this.alpha = 0; },
    update(dt) {
      this.alpha = Math.min(1, this.alpha + dt * 1.5);
    },
    draw() {
      // bg
      ctx.fillStyle = '#ddd';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(W/2, H/2 - 30 * SCALE);

      // door
      drawDoor(0, 0, 55*SCALE, 80*SCALE, '#555');

      // text
      ctx.fillStyle = '#222';
      ctx.font = `bold ${22*SCALE}px 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('点击以开始...', 0, 70*SCALE);

      ctx.font = `${13*SCALE}px 'Courier New', monospace`;
      ctx.fillStyle = '#888';
      ctx.fillText('(开启声音以获得最佳体验)', 0, 92*SCALE);

      ctx.restore();
    },
    onTap() {
      setScene(tutorialScene);
    }
  };

  // ============ SCENE: TUTORIAL ============
  const tutorialScene = {
    page: 0,
    pages: 3,
    init() { this.page = 0; },
    update() {},
    draw() {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, W, H);

      const cx = W/2, cy = H/2 - 40*SCALE;
      const mapW = 280*SCALE, mapH = 280*SCALE;

      if (this.page === 0) {
        this.drawMiniMap(cx, cy, mapW, mapH);
        // joystick demo
        this.drawJoystickDemo(cx + 90*SCALE, cy + mapH/2 + 80*SCALE);
        ctx.fillStyle = '#ccc';
        ctx.font = `${14*SCALE}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('"轮盘移动小人"', cx + 90*SCALE, cy + mapH/2 + 130*SCALE);
      } else if (this.page === 1) {
        ctx.fillStyle = '#eee';
        ctx.font = `bold ${20*SCALE}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('找到金色钥匙 🔑', cx, cy - 40*SCALE);
        drawKey(cx, cy + 20*SCALE, 50*SCALE, '#d4a017');
        ctx.fillStyle = '#888';
        ctx.font = `${14*SCALE}px 'Courier New', monospace`;
        ctx.fillText('移动小人拾取钥匙', cx, cy + 80*SCALE);
      } else if (this.page === 2) {
        ctx.fillStyle = '#eee';
        ctx.font = `bold ${20*SCALE}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('打开那扇门 🚪', cx, cy - 40*SCALE);
        drawDoor(cx, cy + 20*SCALE, 40*SCALE, 60*SCALE, '#666');
        ctx.fillStyle = '#888';
        ctx.font = `${14*SCALE}px 'Courier New', monospace`;
        ctx.fillText('拿到钥匙后走到门前', cx, cy + 90*SCALE);
        // start button
        ctx.fillStyle = '#d4a017';
        ctx.font = `bold ${18*SCALE}px 'Courier New', monospace`;
        ctx.fillText('[ 点击开始游戏 ]', cx, cy + 140*SCALE);
      }

      // dots
      this.drawDots(cx, cy + mapH/2 + 40*SCALE);
    },
    drawMiniMap(cx, cy, w, h) {
      // bg
      ctx.fillStyle = '#333';
      ctx.fillRect(cx - w/2, cy - h/2, w, h);
      // circles (obstacles)
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(cx - w*0.25, cy + h*0.1, w*0.22, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + w*0.25, cy + h*0.1, w*0.22, 0, Math.PI*2);
      ctx.fill();
      // door
      drawDoor(cx, cy - h*0.3, 28*SCALE, 42*SCALE, '#555');
      // key
      drawKey(cx, cy, 24*SCALE, '#d4a017');
      // player
      drawStickFigure(cx, cy + h*0.3, 16*SCALE, '#ccc');
      // hourglass
      drawHourglass(cx, cy - h/2 - 24*SCALE, 22*SCALE, 0, '#888');
    },
    drawJoystickDemo(cx, cy) {
      // outer
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(cx, cy, 40*SCALE, 0, Math.PI*2);
      ctx.fill();
      // inner ring
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.arc(cx, cy, 28*SCALE, 0, Math.PI*2);
      ctx.fill();
      // knob
      ctx.fillStyle = '#eee';
      ctx.beginPath();
      ctx.arc(cx, cy, 14*SCALE, 0, Math.PI*2);
      ctx.fill();
    },
    drawDots(cx, cy) {
      for (let i = 0; i < this.pages; i++) {
        ctx.beginPath();
        ctx.arc(cx + (i - 1) * 24*SCALE, cy, 6*SCALE, 0, Math.PI*2);
        if (i === this.page) {
          ctx.fillStyle = '#eee';
          ctx.fill();
        } else {
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    },
    onTap() {
      if (this.page < this.pages - 1) {
        this.page++;
      } else {
        setScene(new MazeScene(0));
      }
    }
  };

  // ============ MAZE LEVELS ============
  // Each level: obstacles (circles), key pos, door pos, player start, time limit
  const LEVELS = [
    {
      obstacles: [
        { x: 0.25, y: 0.45, r: 0.22 },
        { x: 0.75, y: 0.45, r: 0.22 },
      ],
      key:    { x: 0.5,  y: 0.4 },
      door:   { x: 0.5,  y: 0.12 },
      player: { x: 0.5,  y: 0.8 },
      time: 25,
    },
    {
      obstacles: [
        { x: 0.3, y: 0.35, r: 0.24 },
        { x: 0.7, y: 0.35, r: 0.24 },
        { x: 0.5, y: 0.75, r: 0.18 },
      ],
      key:    { x: 0.5,  y: 0.35 },
      door:   { x: 0.5,  y: 0.08 },
      player: { x: 0.5,  y: 0.92 },
      time: 30,
    },
    {
      obstacles: [
        { x: 0.5, y: 0.5, r: 0.38 },
      ],
      key:    { x: 0.5,  y: 0.92 },
      door:   { x: 0.88, y: 0.12 },
      player: { x: 0.12, y: 0.5 },
      time: 30,
    },
  ];

  // ============ SCENE: MAZE ============
  class MazeScene {
    constructor(levelIdx) {
      this.levelIdx = levelIdx;
    }

    init() {
      const level = LEVELS[this.levelIdx];
      this.mapSize = Math.min(W, H * 0.55);
      this.mapX = (W - this.mapSize) / 2;
      this.mapY = H * 0.17;

      // obstacles in pixel coords
      this.obstacles = level.obstacles.map(o => ({
        x: this.mapX + o.x * this.mapSize,
        y: this.mapY + o.y * this.mapSize,
        r: o.r * this.mapSize
      }));

      // entities
      this.keyPos = {
        x: this.mapX + level.key.x * this.mapSize,
        y: this.mapY + level.key.y * this.mapSize,
      };
      this.doorPos = {
        x: this.mapX + level.door.x * this.mapSize,
        y: this.mapY + level.door.y * this.mapSize,
      };
      this.player = {
        x: this.mapX + level.player.x * this.mapSize,
        y: this.mapY + level.player.y * this.mapSize,
        size: 14 * SCALE,
      };

      this.hasKey = false;
      this.timeLimit = level.time;
      this.timeElapsed = 0;
      this.gameOver = false;
      this.won = false;

      // joystick
      this.joyCenter = { x: W - 80*SCALE, y: H - 100*SCALE };
      this.joyRadius = 50 * SCALE;
      this.joyKnobRadius = 18 * SCALE;
      this.joyOffset = { x: 0, y: 0 };
      this.joyActive = false;

      // transition
      this.fadeIn = 0;
    }

    update(dt) {
      this.fadeIn = Math.min(1, this.fadeIn + dt * 3);
      if (this.gameOver) return;

      // timer
      this.timeElapsed += dt;
      if (this.timeElapsed >= this.timeLimit) {
        this.gameOver = true;
        // timeout - restart level after delay
        setTimeout(() => {
          setScene(new MazeScene(this.levelIdx));
        }, 1500);
        return;
      }

      // joystick input
      if (pointer.down) {
        const dx = pointer.x - this.joyCenter.x;
        const dy = pointer.y - this.joyCenter.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < this.joyRadius * 2.5) {
          this.joyActive = true;
          const maxDist = this.joyRadius * 0.7;
          const clampDist = Math.min(dist, maxDist);
          const angle = Math.atan2(dy, dx);
          this.joyOffset.x = Math.cos(angle) * clampDist;
          this.joyOffset.y = Math.sin(angle) * clampDist;
        }
      } else {
        this.joyActive = false;
        this.joyOffset.x *= 0.7;
        this.joyOffset.y *= 0.7;
      }

      // move player
      const speed = 160 * SCALE * dt;
      const normJoy = Math.sqrt(this.joyOffset.x**2 + this.joyOffset.y**2);
      if (normJoy > 1) {
        const nx = this.joyOffset.x / normJoy;
        const ny = this.joyOffset.y / normJoy;
        const moveStr = Math.min(normJoy / (this.joyRadius * 0.7), 1);
        let newX = this.player.x + nx * speed * moveStr;
        let newY = this.player.y + ny * speed * moveStr;

        // clamp to map
        const pr = this.player.size * 0.5;
        newX = Math.max(this.mapX + pr, Math.min(this.mapX + this.mapSize - pr, newX));
        newY = Math.max(this.mapY + pr, Math.min(this.mapY + this.mapSize - pr, newY));

        // collision with obstacles
        let blocked = false;
        for (const obs of this.obstacles) {
          const dx2 = newX - obs.x;
          const dy2 = newY - obs.y;
          const dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);
          if (dist2 < obs.r + pr) {
            // push out
            const pushAngle = Math.atan2(dy2, dx2);
            newX = obs.x + Math.cos(pushAngle) * (obs.r + pr + 1);
            newY = obs.y + Math.sin(pushAngle) * (obs.r + pr + 1);
          }
        }

        this.player.x = newX;
        this.player.y = newY;
      }

      // pick up key
      if (!this.hasKey) {
        const dkx = this.player.x - this.keyPos.x;
        const dky = this.player.y - this.keyPos.y;
        if (Math.sqrt(dkx*dkx + dky*dky) < 20*SCALE) {
          this.hasKey = true;
        }
      }

      // door
      if (this.hasKey) {
        const ddx = this.player.x - this.doorPos.x;
        const ddy = this.player.y - this.doorPos.y;
        if (Math.sqrt(ddx*ddx + ddy*ddy) < 25*SCALE) {
          this.won = true;
          this.gameOver = true;
          setTimeout(() => {
            if (this.levelIdx < LEVELS.length - 1) {
              setScene(new MazeScene(this.levelIdx + 1));
            } else {
              setScene(victoryScene);
            }
          }, 600);
        }
      }
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.fadeIn;

      // black bg
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, W, H);

      // map area (white)
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.mapX, this.mapY, this.mapSize, this.mapSize);

      // obstacles (black circles)
      ctx.fillStyle = '#111';
      for (const obs of this.obstacles) {
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // door
      const doorColor = this.hasKey ? '#4a4' : '#555';
      drawDoor(this.doorPos.x, this.doorPos.y, 28*SCALE, 42*SCALE, doorColor);

      // key
      if (!this.hasKey) {
        drawKey(this.keyPos.x, this.keyPos.y, 22*SCALE, '#d4a017');
      }

      // player
      drawStickFigure(this.player.x, this.player.y, this.player.size, '#222');

      // hourglass
      const progress = Math.min(this.timeElapsed / this.timeLimit, 1);
      drawHourglass(W/2, this.mapY - 30*SCALE, 24*SCALE, progress, '#ccc');

      // joystick
      this.drawJoystick();

      // dots for level indicator
      this.drawLevelDots();

      // game over overlay
      if (this.gameOver && !this.won) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${28*SCALE}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('超时了!', W/2, H/2);
        ctx.font = `${14*SCALE}px 'Courier New', monospace`;
        ctx.fillText('重新开始...', W/2, H/2 + 30*SCALE);
      }

      ctx.restore();
    }

    drawJoystick() {
      const cx = this.joyCenter.x;
      const cy = this.joyCenter.y;
      // outer circle
      ctx.fillStyle = 'rgba(80,80,80,0.6)';
      ctx.beginPath();
      ctx.arc(cx, cy, this.joyRadius, 0, Math.PI*2);
      ctx.fill();
      // mid ring
      ctx.fillStyle = 'rgba(120,120,120,0.4)';
      ctx.beginPath();
      ctx.arc(cx, cy, this.joyRadius * 0.65, 0, Math.PI*2);
      ctx.fill();
      // knob
      ctx.fillStyle = 'rgba(240,240,240,0.9)';
      ctx.beginPath();
      ctx.arc(cx + this.joyOffset.x, cy + this.joyOffset.y, this.joyKnobRadius, 0, Math.PI*2);
      ctx.fill();
    }

    drawLevelDots() {
      const cx = W/2;
      const cy = this.mapY + this.mapSize + 22*SCALE;
      for (let i = 0; i < LEVELS.length; i++) {
        ctx.beginPath();
        ctx.arc(cx + (i - 1) * 20*SCALE, cy, 5*SCALE, 0, Math.PI*2);
        if (i <= this.levelIdx) {
          ctx.fillStyle = '#eee';
          ctx.fill();
        } else {
          ctx.strokeStyle = '#555';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }

    onTap() {
      // tap anywhere activates joystick vicinity
    }
  }

  // ============ SCENE: VICTORY (name bubble) ============
  const victoryScene = {
    t: 0,
    bubbleScale: 0,
    init() {
      this.t = 0;
      this.bubbleScale = 0;
    },
    update(dt) {
      this.t += dt;
      // bubble grows
      if (this.t > 0.5) {
        this.bubbleScale = Math.min(1, this.bubbleScale + dt * 2.5);
      }
      // transition to love scene
      if (this.t > 4) {
        setScene(loveScene);
      }
    },
    draw() {
      // white bg
      ctx.fillStyle = '#f5f2ed';
      ctx.fillRect(0, 0, W, H);

      const cx = W/2 - 30*SCALE;
      const cy = H/2 + 80*SCALE;

      // stick figure (big)
      drawStickFigure(cx, cy, 50*SCALE, '#222');

      // speech bubble
      if (this.bubbleScale > 0) {
        ctx.save();
        ctx.translate(cx + 40*SCALE, cy - 130*SCALE);
        ctx.scale(this.bubbleScale, this.bubbleScale);

        // bubble body
        const bw = Math.max(100*SCALE, PLAYER_NAME.length * 22*SCALE + 40*SCALE);
        const bh = 60*SCALE;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 3 * SCALE;
        ctx.beginPath();
        // rounded rect
        const rx = -bw/2, ry = -bh/2, rw = bw, rh = bh, rr = 16*SCALE;
        ctx.moveTo(rx + rr, ry);
        ctx.lineTo(rx + rw - rr, ry);
        ctx.arcTo(rx + rw, ry, rx + rw, ry + rr, rr);
        ctx.lineTo(rx + rw, ry + rh - rr);
        ctx.arcTo(rx + rw, ry + rh, rx + rw - rr, ry + rh, rr);
        ctx.lineTo(rx + rr, ry + rh);
        ctx.arcTo(rx, ry + rh, rx, ry + rh - rr, rr);
        ctx.lineTo(rx, ry + rr);
        ctx.arcTo(rx, ry, rx + rr, ry, rr);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // tail
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(-12*SCALE, bh/2);
        ctx.lineTo(-20*SCALE, bh/2 + 18*SCALE);
        ctx.lineTo(4*SCALE, bh/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // cover line overlap
        ctx.fillStyle = '#fff';
        ctx.fillRect(-13*SCALE, bh/2 - 2, 18*SCALE, 4);

        // text
        ctx.fillStyle = '#222';
        ctx.font = `bold ${24*SCALE}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(PLAYER_NAME, 0, 0);

        ctx.restore();
      }
    },
    onTap() {}
  };

  // ============ SCENE: I ❤ U ANIMATION ============
  const loveScene = {
    t: 0,
    paths: [],
    currentPath: 0,
    drawProgress: 0,
    init() {
      this.t = 0;
      this.currentPath = 0;
      this.drawProgress = 0;
      this.buildPaths();
    },
    buildPaths() {
      const cx = W / 2;
      const cy = H / 2;
      const s = SCALE * 1.2;

      // "I" - a curved line like the original
      const iPath = [];
      const iX = cx;
      const iTopY = cy - 180*s;
      const iBotY = cy - 100*s;
      for (let t = 0; t <= 1; t += 0.02) {
        iPath.push({
          x: iX + Math.sin(t * Math.PI * 0.8) * 15*s,
          y: iTopY + t * (iBotY - iTopY)
        });
      }

      // heart shape
      const heartPath = [];
      const hCx = cx;
      const hCy = cy + 10*s;
      const hSize = 80 * s;
      // parametric heart curve
      for (let t = 0; t <= 1; t += 0.008) {
        const angle = t * Math.PI * 2;
        const hx = hSize * 0.9 * Math.pow(Math.sin(angle), 3);
        const hy = -hSize * 0.75 * (
          0.8125 * Math.cos(angle)
          - 0.3125 * Math.cos(2*angle)
          - 0.125 * Math.cos(3*angle)
          - 0.0625 * Math.cos(4*angle)
        );
        heartPath.push({ x: hCx + hx, y: hCy + hy });
      }

      // "U" shape
      const uPath = [];
      const uCx = cx;
      const uTopY = cy + 140*s;
      const uBotY = cy + 220*s;
      const uW = 60*s;
      // left side down
      for (let t = 0; t <= 1; t += 0.03) {
        uPath.push({
          x: uCx - uW,
          y: uTopY + t * (uBotY - uTopY)
        });
      }
      // bottom curve
      for (let t = 0; t <= 1; t += 0.02) {
        const angle = Math.PI + t * Math.PI;
        uPath.push({
          x: uCx + Math.cos(angle) * uW,
          y: uBotY + Math.sin(angle) * (-uW * 0.3)
        });
      }
      // right side up
      for (let t = 0; t <= 1; t += 0.03) {
        uPath.push({
          x: uCx + uW,
          y: uBotY - t * (uBotY - uTopY)
        });
      }

      this.paths = [iPath, heartPath, uPath];
    },
    update(dt) {
      this.t += dt;
      if (this.currentPath < this.paths.length) {
        this.drawProgress += dt * 1.2;
        if (this.drawProgress >= 1) {
          this.drawProgress = 0;
          this.currentPath++;
        }
      }
    },
    draw() {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, W, H);

      const pink = '#ff69b4';
      ctx.strokeStyle = pink;
      ctx.lineWidth = 4.5 * SCALE;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let p = 0; p <= this.currentPath && p < this.paths.length; p++) {
        const path = this.paths[p];
        const progress = p < this.currentPath ? 1 : this.drawProgress;
        const count = Math.floor(path.length * progress);
        if (count < 2) continue;

        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < count; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      }
    },
    onTap() {}
  };

  // ============ GAME LOOP ============
  let lastTime = 0;

  function gameLoop(ts) {
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    if (currentScene) {
      currentScene.update(dt);
      currentScene.draw();
    }

    requestAnimationFrame(gameLoop);
  }

  // ============ TAP HANDLER ============
  let tapStart = 0;
  canvas.addEventListener('pointerdown', () => { tapStart = Date.now(); });
  canvas.addEventListener('pointerup', (e) => {
    const elapsed = Date.now() - tapStart;
    const dx = Math.abs(e.clientX - pointer.startX);
    const dy = Math.abs(e.clientY - pointer.startY);
    // short tap and small movement
    if (elapsed < 400 && dx < 15 && dy < 15) {
      if (currentScene && currentScene.onTap) {
        currentScene.onTap(e.clientX, e.clientY);
      }
    }
  });

  // ============ START ============
  setScene(splashScene);
  requestAnimationFrame(gameLoop);
})();
