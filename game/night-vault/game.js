// Night Vault - Core Game Engine
import { VAULTS, TOTAL_VAULTS } from './levels.js';
import { sound } from './audio.js';
import { SpriteRenderer } from './sprites.js';

export class NightVaultGame {
  constructor(canvas, uiCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = uiCallbacks;
    this.sprite = new SpriteRenderer();

    this.cols = 20;
    this.rows = 14;
    this.tileW = 0;
    this.tileH = 0;

    this.vaultIndex = 0;
    this.vault = null;
    this.tiles = [];
    this.holes = [];
    this.guards = [];
    this.particles = [];

    this.player = null;
    this.goldCollected = 0;
    this.targetGold = 0;
    this.exitUnlocked = false;

    this.startTime = 0;
    this.elapsedTime = 0;
    this.caughtCount = 0;

    this.isPaused = false;
    this.isGameOver = false;
    this.isLevelComplete = false;
    this.activeToast = null;
    this.toastTimer = 0;

    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      digLeft: false,
      digRight: false
    };

    this.lastFrameTime = 0;
    this.animTimer = 0;
    this.screenShake = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
    this.tileW = rect.width / this.cols;
    this.tileH = rect.height / this.rows;
  }

  loadVault(index) {
    if (index < 0 || index >= TOTAL_VAULTS) index = 0;
    this.vaultIndex = index;
    this.vault = VAULTS[index];
    this.goldCollected = 0;
    this.targetGold = this.vault.targetGold || 5;
    this.exitUnlocked = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isLevelComplete = false;
    this.activeToast = null;
    this.holes = [];
    this.guards = [];
    this.particles = [];
    this.tiles = [];

    // Parse map
    const map = this.vault.map;
    let guardId = 0;

    for (let r = 0; r < this.rows; r++) {
      const rowStr = (map[r] || '').padEnd(this.cols, ' ');
      const rowArr = [];
      for (let c = 0; c < this.cols; c++) {
        const char = rowStr[c] || ' ';
        if (char === 'P') {
          this.player = {
            col: c,
            row: r,
            x: c,
            y: r,
            vx: 0,
            vy: 0,
            facing: 1,
            state: 'idle',
            animFrame: 0,
            isDigging: false,
            digTime: 0
          };
          rowArr.push('.');
        } else if (char === 'G') {
          this.guards.push({
            id: guardId++,
            spawnCol: c,
            spawnRow: r,
            col: c,
            row: r,
            x: c,
            y: r,
            facing: -1,
            state: 'run',
            animFrame: 0,
            hasGold: false,
            isTrapped: false,
            trappedTimer: 0,
            respawnTimer: 0
          });
          rowArr.push('.');
        } else if (char === '$') {
          rowArr.push('$');
        } else if (char === 'H') {
          rowArr.push('H');
        } else if (char === 'X') {
          rowArr.push('X');
        } else if (char === '-') {
          rowArr.push('-');
        } else if (char === 'S') {
          rowArr.push('S');
        } else if (char === '#') {
          rowArr.push('#');
        } else {
          rowArr.push('.');
        }
      }
      this.tiles.push(rowArr);
    }

    if (!this.player) {
      this.player = { col: 2, row: 12, x: 2, y: 12, facing: 1, state: 'idle', animFrame: 0, isDigging: false, digTime: 0 };
    }

    this.startTime = performance.now();
    this.elapsedTime = 0;

    if (this.ui && this.ui.onVaultLoaded) {
      this.ui.onVaultLoaded(this.vault, this.vaultIndex, this.goldCollected, this.targetGold);
    }
  }

  showToast(title, message, duration = 3.5) {
    this.activeToast = { title, message, timer: duration };
  }

  // --- Tile Queries ---
  getTile(c, r) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return 'S';
    return this.tiles[r][c];
  }

  isSolid(c, r) {
    if (r < 0 || c < 0 || c >= this.cols) return false;
    if (r >= this.rows) return true; // bottom border solid
    const t = this.tiles[r][c];
    if (t === 'S') return true;
    if (t === '#') {
      // Check if hole currently open
      const hole = this.holes.find(h => h.col === c && h.row === r);
      if (hole) {
        // If a trapped guard is in the hole, player can walk on guard!
        if (hole.trappedGuard) return true;
        return false;
      }
      return true;
    }
    return false;
  }

  isLadder(c, r) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return false;
    const t = this.tiles[r][c];
    if (t === 'H') return true;
    if (t === 'X' && this.exitUnlocked) return true;
    return false;
  }

  isRope(c, r) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return false;
    return this.tiles[r][c] === '-';
  }

  // --- Input Handlers ---
  handleInput(dir, pressed) {
    if (this.isPaused || this.isGameOver || this.isLevelComplete) return;

    if (dir === 'digLeft' && pressed) {
      this.dig(-1);
      return;
    }
    if (dir === 'digRight' && pressed) {
      this.dig(1);
      return;
    }
    if (dir in this.input) {
      this.input[dir] = pressed;
    }
  }

  dig(dir) {
    if (!this.player || this.player.isDigging) return;
    const p = this.player;

    // Check if player is on solid ground, ladder, or rope (not in free fall)
    const onSolid = this.isSolid(p.col, p.row + 1) || this.isLadder(p.col, p.row) || this.isRope(p.col, p.row);
    if (!onSolid) return;

    const targetCol = p.col + dir;
    const targetRow = p.row + 1;
    const aboveCol = p.col + dir;
    const aboveRow = p.row;

    // Cannot dig out of bounds
    if (targetCol < 0 || targetCol >= this.cols || targetRow >= this.rows) return;

    // Space above must be passable (cannot dig through solid wall)
    if (this.isSolid(aboveCol, aboveRow)) return;

    // Target must be a diggable brick '#' and not already a hole
    if (this.getTile(targetCol, targetRow) !== '#') return;
    if (this.holes.some(h => h.col === targetCol && h.row === targetRow)) return;

    // Execute dig!
    p.isDigging = true;
    p.digTime = 0.22;
    p.facing = dir;
    p.state = 'dig';

    sound.playDig();

    this.holes.push({
      col: targetCol,
      row: targetRow,
      timer: 5.0,
      maxTimer: 5.0,
      trappedGuard: null
    });

    // Particle burst
    const px = (targetCol + 0.5) * this.tileW;
    const py = (targetRow + 0.3) * this.tileH;
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 60,
        vy: -Math.random() * 80 - 20,
        color: '#c85642',
        size: Math.random() * 3 + 2,
        life: 0.4
      });
    }
  }

  // --- Main Update Loop ---
  update(dt) {
    if (this.isPaused || this.isGameOver || this.isLevelComplete) return;

    this.elapsedTime += dt;
    this.animTimer += dt;

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.activeToast = null;
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 3);
    }

    // 1. Update Holes
    for (let i = this.holes.length - 1; i >= 0; i--) {
      const h = this.holes[i];
      h.timer -= dt;

      if (h.timer <= 0) {
        // Hole is closing back up!
        if (h.trappedGuard) {
          // Crush trapped guard!
          sound.playCrush();
          h.trappedGuard.isTrapped = false;
          h.trappedGuard.respawnTimer = 2.5;
          h.trappedGuard.state = 'crushed';
          // If guard had gold, place it above
          if (h.trappedGuard.hasGold) {
            h.trappedGuard.hasGold = false;
            if (h.row > 0 && this.tiles[h.row - 1][h.col] === '.') {
              this.tiles[h.row - 1][h.col] = '$';
            }
          }
        }

        // Check if player is caught in hole
        if (Math.round(this.player.x) === h.col && Math.round(this.player.y) === h.row) {
          this.triggerBusted('Crushed inside closing vault wall!');
          return;
        }

        this.holes.splice(i, 1);
      }
    }

    // 2. Update Player
    this.updatePlayer(dt);

    // 3. Update Guards
    this.updateGuards(dt);

    // 4. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt; // gravity
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  updatePlayer(dt) {
    const p = this.player;
    const speed = 4.8; // tiles per second
    const fallSpeed = 7.5;

    if (p.isDigging) {
      p.digTime -= dt;
      if (p.digTime <= 0) {
        p.isDigging = false;
        p.state = 'idle';
      }
      return;
    }

    const curCol = Math.round(p.x);
    const curRow = Math.round(p.y);
    p.col = curCol;
    p.row = curRow;

    const inLadder = this.isLadder(curCol, curRow);
    const inRope = this.isRope(curCol, curRow);
    const belowSolid = this.isSolid(curCol, curRow + 1) || this.isLadder(curCol, curRow + 1);

    // Check Falling
    const isFalling = !inLadder && !inRope && !belowSolid;

    if (isFalling) {
      p.state = 'fall';
      p.y += fallSpeed * dt;
      // Clamp to next floor
      const nextRow = Math.floor(p.y);
      if (this.isSolid(curCol, nextRow + 1) || this.isLadder(curCol, nextRow + 1)) {
        if (p.y >= nextRow) {
          p.y = nextRow;
          p.state = 'idle';
        }
      }
      this.checkPlayerGold();
      return;
    }

    // Moving on Ladder
    if (inLadder) {
      if (this.input.up) {
        p.y -= speed * dt;
        p.state = 'climb';
        p.animFrame += dt * 8;
        sound.playLadder();
      } else if (this.input.down) {
        if (!this.isSolid(curCol, Math.floor(p.y + 1))) {
          p.y += speed * dt;
          p.state = 'climb';
          p.animFrame += dt * 8;
          sound.playLadder();
        }
      }
    }

    // Moving on Rope
    if (inRope) {
      p.state = 'rope';
      if (this.input.down) {
        // Drop from rope
        p.y += 0.2;
        p.state = 'fall';
      }
    }

    // Horizontal Movement
    let movedH = false;
    if (this.input.left) {
      p.facing = -1;
      const targetX = p.x - speed * dt;
      const checkCol = Math.floor(targetX);
      if (!this.isSolid(checkCol, curRow)) {
        p.x = targetX;
        movedH = true;
      }
    } else if (this.input.right) {
      p.facing = 1;
      const targetX = p.x + speed * dt;
      const checkCol = Math.ceil(targetX);
      if (!this.isSolid(checkCol, curRow)) {
        p.x = targetX;
        movedH = true;
      }
    }

    if (movedH) {
      if (!inLadder && !inRope) {
        p.state = 'run';
        p.animFrame += dt * 10;
        sound.playStep();
      }
    } else if (!inLadder && !inRope) {
      p.state = 'idle';
    }

    // Clamp coordinates inside screen
    p.x = Math.max(0, Math.min(this.cols - 1, p.x));
    p.y = Math.max(-1, Math.min(this.rows - 1, p.y));

    // Check Gold Pickup
    this.checkPlayerGold();

    // Check Exit Victory
    if (this.exitUnlocked && p.y <= 0 && this.isLadder(Math.round(p.x), 0)) {
      this.triggerVictory();
    }
  }

  checkPlayerGold() {
    const p = this.player;
    const c = Math.round(p.x);
    const r = Math.round(p.y);

    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      if (this.tiles[r][c] === '$') {
        this.tiles[r][c] = '.';
        this.goldCollected++;
        sound.playGold();

        // Sparkle particles
        const gx = (c + 0.5) * this.tileW;
        const gy = (r + 0.5) * this.tileH;
        for (let i = 0; i < 10; i++) {
          this.particles.push({
            x: gx,
            y: gy,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            color: '#ffd700',
            size: Math.random() * 3 + 2,
            life: 0.5
          });
        }

        if (this.ui && this.ui.onGoldCollected) {
          this.ui.onGoldCollected(this.goldCollected, this.targetGold);
        }

        // Check if all gold collected
        if (this.goldCollected >= this.targetGold && !this.exitUnlocked) {
          this.exitUnlocked = true;
          sound.playExitOpen();
          this.showToast('EXIT OPEN', 'A ladder appeared. Climb it off the top of the board.', 4.0);
        }
      }
    }
  }

  updateGuards(dt) {
    const p = this.player;
    const guardSpeed = 3.2; // tiles per second

    for (const g of this.guards) {
      // Respawn timer
      if (g.respawnTimer > 0) {
        g.respawnTimer -= dt;
        if (g.respawnTimer <= 0) {
          g.x = g.spawnCol;
          g.y = g.spawnRow;
          g.col = g.spawnCol;
          g.row = g.spawnRow;
          g.state = 'run';
          g.isTrapped = false;
        }
        continue;
      }

      const curCol = Math.round(g.x);
      const curRow = Math.round(g.y);
      g.col = curCol;
      g.row = curRow;

      // Check if guard is falling into an active hole
      const hole = this.holes.find(h => h.col === curCol && h.row === curRow);
      if (hole && !g.isTrapped) {
        g.isTrapped = true;
        g.state = 'trapped';
        g.trappedTimer = 3.6;
        hole.trappedGuard = g;
        sound.playTrap();
        // Drop gold
        if (g.hasGold) {
          g.hasGold = false;
          if (curRow > 0 && this.tiles[curRow - 1][curCol] === '.') {
            this.tiles[curRow - 1][curCol] = '$';
          }
        }
      }

      if (g.isTrapped) {
        g.trappedTimer -= dt;
        g.animFrame += dt * 4;
        if (g.trappedTimer <= 0) {
          // Climb out of hole
          g.isTrapped = false;
          g.y -= 1.0;
          g.state = 'run';
          if (hole) hole.trappedGuard = null;
        }
        continue;
      }

      // Check guard pickup gold
      if (curRow >= 0 && curRow < this.rows && curCol >= 0 && curCol < this.cols) {
        if (this.tiles[curRow][curCol] === '$' && !g.hasGold) {
          this.tiles[curRow][curCol] = '.';
          g.hasGold = true;
        }
      }

      // Check collision with player
      const distToPlayer = Math.hypot(p.x - g.x, p.y - g.y);
      if (distToPlayer < 0.65 && !g.isTrapped) {
        this.triggerBusted('Caught by security guard!');
        return;
      }

      // Guard Navigation AI towards player
      const inLadder = this.isLadder(curCol, curRow);
      const belowSolid = this.isSolid(curCol, curRow + 1) || this.isLadder(curCol, curRow + 1);

      if (!inLadder && !belowSolid) {
        // Guard falls
        g.state = 'fall';
        g.y += 6.5 * dt;
        continue;
      }

      const dy = p.y - g.y;
      const dx = p.x - g.x;

      if (inLadder && Math.abs(dy) > 0.4) {
        // On ladder: move towards player's vertical elevation
        g.state = 'climb';
        g.animFrame += dt * 6;
        if (dy > 0 && !this.isSolid(curCol, curRow + 1)) {
          g.y += guardSpeed * dt;
        } else if (dy < 0) {
          g.y -= guardSpeed * dt;
        }
      } else {
        // Move horizontally towards player
        g.state = 'run';
        g.animFrame += dt * 7;
        const dir = dx > 0 ? 1 : -1;
        g.facing = dir;
        const nextX = g.x + dir * guardSpeed * dt;
        const testCol = Math.round(nextX);
        if (!this.isSolid(testCol, curRow)) {
          g.x = nextX;
        }
      }
    }
  }

  triggerBusted(reason) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.caughtCount++;
    this.screenShake = 1.0;
    sound.playBusted();

    if (this.ui && this.ui.onBusted) {
      this.ui.onBusted(reason, this.caughtCount);
    }
  }

  triggerVictory() {
    if (this.isLevelComplete) return;
    this.isLevelComplete = true;
    sound.playWin();

    const elapsedSeconds = Math.floor(this.elapsedTime);

    // Save best time
    let bestTime = elapsedSeconds;
    try {
      const savedKey = `night_vault_best_${this.vaultIndex + 1}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        bestTime = Math.min(elapsedSeconds, parseInt(saved, 10));
      }
      localStorage.setItem(savedKey, String(bestTime));

      // Unlock next vault
      const unlocked = parseInt(localStorage.getItem('night_vault_unlocked') || '1', 10);
      if (this.vaultIndex + 2 > unlocked) {
        localStorage.setItem('night_vault_unlocked', String(Math.min(TOTAL_VAULTS, this.vaultIndex + 2)));
      }
    } catch (e) {}

    if (this.ui && this.ui.onVictory) {
      this.ui.onVictory({
        vaultNum: this.vault.vaultNum,
        vaultName: this.vault.name,
        timeSeconds: elapsedSeconds,
        bestSeconds: bestTime,
        caught: this.caughtCount
      });
    }
  }

  // --- Rendering ---
  render() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;
    const tw = this.tileW;
    const th = this.tileH;

    ctx.save();

    // Apply screen shake
    if (this.screenShake > 0) {
      const shakeMag = this.screenShake * 5;
      const sx = (Math.random() - 0.5) * shakeMag;
      const sy = (Math.random() - 0.5) * shakeMag;
      ctx.translate(sx, sy);
    }

    // Deep midnight vault background
    ctx.fillStyle = '#0c0f1d';
    ctx.fillRect(0, 0, w, h);

    // Subtle background grid / vault panel pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= this.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * tw, 0);
      ctx.lineTo(c * tw, h);
      ctx.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * th);
      ctx.lineTo(w, r * th);
      ctx.stroke();
    }

    const time = performance.now() * 0.001;

    // 1. Draw Board Tiles
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * tw;
        const y = r * th;
        const tile = this.tiles[r][c];

        if (tile === '#') {
          const hole = this.holes.find(hl => hl.col === c && hl.row === r);
          this.sprite.drawBrick(ctx, x, y, tw, th, hole);
        } else if (tile === 'S') {
          this.sprite.drawSteel(ctx, x, y, tw, th);
        } else if (tile === 'H') {
          this.sprite.drawLadder(ctx, x, y, tw, th, false, time);
        } else if (tile === 'X') {
          if (this.exitUnlocked) {
            this.sprite.drawLadder(ctx, x, y, tw, th, true, time);
          }
        } else if (tile === '-') {
          this.sprite.drawRope(ctx, x, y, tw, th);
        } else if (tile === '$') {
          this.sprite.drawGold(ctx, x, y, tw, th, time);
        }
      }
    }

    // 2. Draw Guards
    for (const g of this.guards) {
      if (g.respawnTimer > 0) continue;
      const gx = g.x * tw;
      const gy = g.y * th;
      this.sprite.drawGuard(ctx, gx, gy, tw, th, g.state, g.facing, Math.floor(g.animFrame), g.hasGold);
    }

    // 3. Draw Player
    if (this.player) {
      const p = this.player;
      const px = p.x * tw;
      const py = p.y * th;
      this.sprite.drawPlayer(ctx, px, py, tw, th, p.state, p.facing, Math.floor(p.animFrame));

      // If digging, draw laser blast
      if (p.isDigging) {
        const targetX = (p.col + p.facing + 0.5) * tw;
        const targetY = (p.row + 1.5) * th;
        const startX = (p.x + 0.5 + p.facing * 0.3) * tw;
        const startY = (p.y + 0.6) * th;
        this.sprite.drawLaser(ctx, startX, startY, targetX, targetY, p.digTime / 0.22);
      }
    }

    // 4. Draw Particles
    for (const pt of this.particles) {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
    }

    // 5. Toast / In-game Notification Banner
    if (this.activeToast) {
      this.drawToastBanner(ctx, w, h);
    }

    ctx.restore();
  }

  drawToastBanner(ctx, w, h) {
    const bw = Math.min(380, w * 0.9);
    const bh = 56;
    const bx = (w - bw) / 2;
    const by = 16;

    // Banner dark card with gold border
    ctx.fillStyle = 'rgba(15, 20, 38, 0.94)';
    ctx.strokeStyle = 'rgba(245, 166, 35, 0.4)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.stroke();

    // Banner Title
    ctx.fillStyle = '#f5a623';
    ctx.font = 'bold 12px "Press Start 2P", monospace, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(this.activeToast.title, w / 2, by + 20);

    // Banner Message
    ctx.fillStyle = '#d2d9ec';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(this.activeToast.message, w / 2, by + 40);
  }
}
