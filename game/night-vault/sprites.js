// Night Vault - Procedural Pixel Art Sprite Renderer
// 100% Canvas procedural pixel art matching Boris Cherny's original gameplay video.

export class SpriteRenderer {
  constructor() {
    this.sparkleTimer = 0;
  }

  // --- Brick Tile ---
  // Staggered 2-row red masonry bricks with 3D bevels and mortar seams
  drawBrick(ctx, x, y, w, h, hole = null) {
    if (hole) {
      // Tile is currently a dug hole
      const progress = hole.timer / hole.maxTimer; // 1 -> 0
      const willClose = hole.timer < 1.5;

      // Dark pit background
      ctx.fillStyle = '#0a0d1b';
      ctx.fillRect(x, y, w, h);

      // Crumbling jagged edges on sides
      ctx.fillStyle = '#541c14';
      ctx.fillRect(x, y + h * 0.75, w * 0.2, h * 0.25);
      ctx.fillRect(x + w * 0.8, y + h * 0.75, w * 0.2, h * 0.25);

      // Warning flash when about to reform
      if (willClose) {
        const flash = Math.sin(Date.now() * 0.02) > 0;
        if (flash) {
          ctx.fillStyle = 'rgba(230, 80, 60, 0.45)';
          ctx.fillRect(x, y, w, h);
          // Crackle lines
          ctx.strokeStyle = '#ff9988';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + 2, y + 2);
          ctx.lineTo(x + w * 0.5, y + h * 0.5);
          ctx.lineTo(x + w - 2, y + h - 2);
          ctx.stroke();
        }
      }
      return;
    }

    // Solid red brick block
    // Mortar background
    ctx.fillStyle = '#1c0806';
    ctx.fillRect(x, y, w, h);

    const halfH = Math.floor(h / 2);
    const rowH = halfH - 1;

    // Row 1: 2 bricks
    const w1 = Math.floor(w / 2) - 1;
    this.drawSingleBrick(ctx, x + 1, y + 1, w1, rowH);
    this.drawSingleBrick(ctx, x + w1 + 2, y + 1, w - w1 - 3, rowH);

    // Row 2: staggered (half, full, half)
    const quarterW = Math.floor(w / 4);
    const middleW = Math.floor(w / 2) - 1;
    this.drawSingleBrick(ctx, x + 1, y + halfH + 1, quarterW, h - halfH - 2);
    this.drawSingleBrick(ctx, x + quarterW + 2, y + halfH + 1, middleW, h - halfH - 2);
    this.drawSingleBrick(ctx, x + quarterW + middleW + 3, y + halfH + 1, w - (quarterW + middleW + 4), h - halfH - 2);
  }

  drawSingleBrick(ctx, bx, by, bw, bh) {
    if (bw <= 0 || bh <= 0) return;
    // Base brick red
    ctx.fillStyle = '#aa392b';
    ctx.fillRect(bx, by, bw, bh);

    // Top & left bevel highlight
    ctx.fillStyle = '#cf5642';
    ctx.fillRect(bx, by, bw, 1);
    ctx.fillRect(bx, by, 1, bh);

    // Bottom & right bevel shadow
    ctx.fillStyle = '#651c14';
    ctx.fillRect(bx, by + bh - 1, bw, 1);
    ctx.fillRect(bx + bw - 1, by, 1, bh);
  }

  // --- Steel Block ---
  // Undiggable vault steel wall block with rivets and bevel
  drawSteel(ctx, x, y, w, h) {
    // Outer border
    ctx.fillStyle = '#1e2436';
    ctx.fillRect(x, y, w, h);

    // Bevel outer
    ctx.fillStyle = '#59698f';
    ctx.fillRect(x + 1, y + 1, w - 2, 1);
    ctx.fillRect(x + 1, y + 1, 1, h - 2);

    ctx.fillStyle = '#22283a';
    ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
    ctx.fillRect(x + w - 2, y + 1, 1, h - 2);

    // Inner plate
    ctx.fillStyle = '#394460';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

    // Inset inner groove
    ctx.fillStyle = '#262d40';
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

    ctx.fillStyle = '#445173';
    ctx.fillRect(x + 5, y + 5, w - 10, h - 10);

    // 4 Corner Rivets
    ctx.fillStyle = '#8396c0';
    const rSize = Math.max(1, Math.floor(w * 0.08));
    ctx.fillRect(x + 3, y + 3, rSize, rSize);
    ctx.fillRect(x + w - 3 - rSize, y + 3, rSize, rSize);
    ctx.fillRect(x + 3, y + h - 3 - rSize, rSize, rSize);
    ctx.fillRect(x + w - 3 - rSize, y + h - 3 - rSize, rSize, rSize);

    // Center indentation
    ctx.fillStyle = '#1e2436';
    ctx.fillRect(x + Math.floor(w / 2) - 1, y + Math.floor(h / 2) - 1, 2, 2);
  }

  // --- Ladder ---
  // Classic golden-yellow rung ladder
  drawLadder(ctx, x, y, w, h, isExit = false, pulseTime = 0) {
    const railW = Math.max(2, Math.floor(w * 0.12));
    const leftRailX = x + Math.floor(w * 0.2);
    const rightRailX = x + Math.floor(w * 0.8) - railW;

    let railColor = '#e6c86e';
    let rungColor = '#f3dc8e';
    let shadowColor = '#9a7b2c';

    if (isExit) {
      // Exit ladder glows and shimmers
      const glow = (Math.sin(pulseTime * 5) + 1) * 0.5;
      railColor = glow > 0.5 ? '#fff2a8' : '#ffd700';
      rungColor = '#ffffff';
      shadowColor = '#d4af37';

      // Subtle glow bloom
      ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
      ctx.fillRect(x, y, w, h);
    }

    // Left Rail
    ctx.fillStyle = railColor;
    ctx.fillRect(leftRailX, y, railW, h);
    ctx.fillStyle = shadowColor;
    ctx.fillRect(leftRailX + railW - 1, y, 1, h);

    // Right Rail
    ctx.fillStyle = railColor;
    ctx.fillRect(rightRailX, y, railW, h);
    ctx.fillStyle = shadowColor;
    ctx.fillRect(rightRailX + railW - 1, y, 1, h);

    // Horizontal Rungs (3 rungs per tile)
    const rungCount = 3;
    const step = h / rungCount;
    for (let i = 0; i < rungCount; i++) {
      const ry = Math.floor(y + i * step + step * 0.5);
      const rw = rightRailX - (leftRailX + railW);
      // Rung shadow
      ctx.fillStyle = shadowColor;
      ctx.fillRect(leftRailX + railW, ry + 1, rw, 1);
      // Rung top
      ctx.fillStyle = rungColor;
      ctx.fillRect(leftRailX + railW, ry, rw, 1);
    }
  }

  // --- Monkey Bar / Rope ---
  // Horizontal steel suspension line
  drawRope(ctx, x, y, w, h) {
    const ropeY = Math.floor(y + h * 0.3);
    // Rope shadow
    ctx.fillStyle = '#151b2c';
    ctx.fillRect(x, ropeY + 2, w, 1);
    // Main cable
    ctx.fillStyle = '#899bbd';
    ctx.fillRect(x, ropeY, w, 2);
    // Metallic ridges
    ctx.fillStyle = '#d2dff6';
    for (let rx = x + 2; rx < x + w; rx += 4) {
      ctx.fillRect(rx, ropeY, 1, 1);
    }
  }

  // --- Gold Bullion Bar ---
  // Glowing trapezoidal gold ingot resting on floor
  drawGold(ctx, x, y, w, h, time = 0) {
    const barW = Math.floor(w * 0.65);
    const barH = Math.floor(h * 0.38);
    const bx = Math.floor(x + (w - barW) / 2);
    const by = Math.floor(y + h - barH - 1);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(bx - 1, by + barH - 1, barW + 2, 2);

    // Gold bar trapezoid
    // Base / sides
    ctx.fillStyle = '#d48806';
    ctx.beginPath();
    ctx.moveTo(bx, by + barH);
    ctx.lineTo(bx + 3, by);
    ctx.lineTo(bx + barW - 3, by);
    ctx.lineTo(bx + barW, by + barH);
    ctx.closePath();
    ctx.fill();

    // Front face
    ctx.fillStyle = '#f5a623';
    ctx.beginPath();
    ctx.moveTo(bx + 1, by + barH);
    ctx.lineTo(bx + 3, by + 3);
    ctx.lineTo(bx + barW - 3, by + 3);
    ctx.lineTo(bx + barW - 1, by + barH);
    ctx.closePath();
    ctx.fill();

    // Top reflective face
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.moveTo(bx + 3, by);
    ctx.lineTo(bx + barW - 3, by);
    ctx.lineTo(bx + barW - 4, by + 2);
    ctx.lineTo(bx + 4, by + 2);
    ctx.closePath();
    ctx.fill();

    // Occasional sparkle
    const sparkleCycle = (time * 1.5) % 3;
    if (sparkleCycle < 0.4) {
      const sparkleAlpha = Math.sin((sparkleCycle / 0.4) * Math.PI);
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha * 0.9})`;
      const sx = bx + barW - 4;
      const sy = by + 1;
      ctx.fillRect(sx - 1, sy, 3, 1);
      ctx.fillRect(sx, sy - 1, 1, 3);
    }
  }

  // --- Player Character ---
  // Red cap, pale face, white shirt, blue jeans, animated retro thief
  drawPlayer(ctx, x, y, w, h, state = 'idle', facing = 1, animFrame = 0) {
    ctx.save();
    // Center character horizontally in tile
    const charW = Math.floor(w * 0.7);
    const charH = Math.floor(h * 0.92);
    const cx = Math.floor(x + (w - charW) / 2);
    const cy = Math.floor(y + h - charH);

    // Flip if facing left
    if (facing < 0) {
      ctx.translate(cx + charW / 2, cy + charH / 2);
      ctx.scale(-1, 1);
      ctx.translate(-(cx + charW / 2), -(cy + charH / 2));
    }

    const headH = Math.floor(charH * 0.35);
    const torsoH = Math.floor(charH * 0.35);
    const legsH = charH - headH - torsoH;

    // 1. Cap & Head
    // Red cap
    ctx.fillStyle = '#e03020';
    ctx.fillRect(cx + 2, cy, charW - 4, headH * 0.55);
    // Cap visor (pointing right)
    ctx.fillRect(cx + charW - 3, cy + headH * 0.25, 4, 2);

    // Face skin
    ctx.fillStyle = '#ffcf9e';
    ctx.fillRect(cx + 3, cy + headH * 0.45, charW - 5, headH * 0.55);
    // Eye
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(cx + charW - 3, cy + headH * 0.6, 2, 2);

    // 2. Torso (White Shirt)
    const torsoY = cy + headH;
    ctx.fillStyle = '#f0f0f5';
    ctx.fillRect(cx + 2, torsoY, charW - 4, torsoH);

    // Red suspenders / shirt accent
    ctx.fillStyle = '#d03020';
    ctx.fillRect(cx + 3, torsoY, 2, torsoH);

    // Arms
    ctx.fillStyle = '#ffcf9e'; // Hands skin
    if (state === 'climb') {
      // Alternating climbing arms
      const armOffset = (animFrame % 2 === 0) ? -3 : 3;
      ctx.fillRect(cx - 1, torsoY + armOffset, 2, 5);
      ctx.fillRect(cx + charW - 1, torsoY - armOffset, 2, 5);
    } else if (state === 'rope') {
      // Arms reaching up to rope
      ctx.fillRect(cx + 1, torsoY - 4, 3, 5);
      ctx.fillRect(cx + charW - 4, torsoY - 4, 3, 5);
    } else if (state === 'dig') {
      // Arm extended pointing down-forward with laser blast
      ctx.fillRect(cx + charW - 1, torsoY + 2, 4, 3);
    } else {
      // Running / idle arms
      const armSwing = state === 'run' ? Math.sin(animFrame * Math.PI) * 3 : 0;
      ctx.fillRect(cx + 1, torsoY + 2 - armSwing, 2, 4);
      ctx.fillRect(cx + charW - 3, torsoY + 2 + armSwing, 2, 4);
    }

    // 3. Legs (Blue Jeans) & Shoes
    const legsY = torsoY + torsoH;
    ctx.fillStyle = '#2c5898';

    if (state === 'run') {
      const legCycle = animFrame % 4;
      if (legCycle === 0) {
        // Stride forward
        ctx.fillRect(cx + 1, legsY, 3, legsH - 1);
        ctx.fillRect(cx + charW - 4, legsY, 3, legsH);
      } else if (legCycle === 1) {
        // Passing
        ctx.fillRect(cx + 3, legsY, charW - 6, legsH);
      } else if (legCycle === 2) {
        // Stride back
        ctx.fillRect(cx + charW - 4, legsY, 3, legsH - 1);
        ctx.fillRect(cx + 1, legsY, 3, legsH);
      } else {
        ctx.fillRect(cx + 3, legsY, charW - 6, legsH);
      }
    } else if (state === 'climb') {
      // Climbing legs
      const legStep = (animFrame % 2 === 0) ? 2 : -2;
      ctx.fillRect(cx + 2, legsY + legStep, 3, legsH - Math.abs(legStep));
      ctx.fillRect(cx + charW - 5, legsY - legStep, 3, legsH - Math.abs(legStep));
    } else if (state === 'fall') {
      // Flailing legs in air
      ctx.fillRect(cx, legsY, 3, legsH - 2);
      ctx.fillRect(cx + charW - 3, legsY, 3, legsH - 2);
    } else {
      // Idle standing
      ctx.fillRect(cx + 2, legsY, 3, legsH);
      ctx.fillRect(cx + charW - 5, legsY, 3, legsH);
    }

    // Shoes (Black)
    ctx.fillStyle = '#111111';
    ctx.fillRect(cx + 1, cy + charH - 2, 4, 2);
    ctx.fillRect(cx + charW - 5, cy + charH - 2, 4, 2);

    ctx.restore();
  }

  // --- Guard Character ---
  // Green cap and uniform, white gloves, animated enemy patrol
  drawGuard(ctx, x, y, w, h, state = 'run', facing = 1, animFrame = 0, hasGold = false) {
    ctx.save();
    const charW = Math.floor(w * 0.72);
    const charH = Math.floor(h * 0.92);
    const cx = Math.floor(x + (w - charW) / 2);
    const cy = Math.floor(y + h - charH);

    // If trapped in a hole, draw struggling in pit
    if (state === 'trapped') {
      // Lower body hidden inside hole, upper torso & waving hands visible
      const trapY = cy + Math.floor(charH * 0.35);
      // Head with green cap
      ctx.fillStyle = '#1e7e48';
      ctx.fillRect(cx + 2, trapY, charW - 4, 5);
      ctx.fillStyle = '#ffcf9e';
      ctx.fillRect(cx + 3, trapY + 3, charW - 6, 4);

      // Flailing arms above hole rim (\o/)
      const wave = (animFrame % 2 === 0) ? -2 : 2;
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(cx - 2, trapY - 4 + wave, 2, 5);
      ctx.fillRect(cx + charW, trapY - 4 - wave, 2, 5);

      // White gloves
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 3, trapY - 6 + wave, 3, 3);
      ctx.fillRect(cx + charW, trapY - 6 - wave, 3, 3);

      ctx.restore();
      return;
    }

    // Flip if facing left
    if (facing < 0) {
      ctx.translate(cx + charW / 2, cy + charH / 2);
      ctx.scale(-1, 1);
      ctx.translate(-(cx + charW / 2), -(cy + charH / 2));
    }

    const headH = Math.floor(charH * 0.35);
    const torsoH = Math.floor(charH * 0.35);
    const legsH = charH - headH - torsoH;

    // 1. Guard Cap (Forest Green)
    ctx.fillStyle = '#186337';
    ctx.fillRect(cx + 2, cy, charW - 4, headH * 0.55);
    // Gold badge on cap
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(cx + charW - 4, cy + 1, 2, 2);
    // Black visor
    ctx.fillStyle = '#111111';
    ctx.fillRect(cx + charW - 3, cy + headH * 0.25, 4, 2);

    // Face skin
    ctx.fillStyle = '#ffcf9e';
    ctx.fillRect(cx + 3, cy + headH * 0.45, charW - 5, headH * 0.55);
    // Guard dark eye
    ctx.fillStyle = '#111111';
    ctx.fillRect(cx + charW - 3, cy + headH * 0.6, 2, 2);

    // 2. Uniform Torso (Vibrant Green Jacket)
    const torsoY = cy + headH;
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(cx + 2, torsoY, charW - 4, torsoH);

    // Tie / belt
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(cx + 4, torsoY, 2, torsoH - 1);
    ctx.fillRect(cx + 2, torsoY + torsoH - 2, charW - 4, 2);

    // Arms & White Gloves
    ctx.fillStyle = '#1e7e48';
    if (state === 'climb') {
      const armOff = (animFrame % 2 === 0) ? -3 : 3;
      ctx.fillRect(cx - 1, torsoY + armOff, 2, 4);
      ctx.fillRect(cx + charW - 1, torsoY - armOff, 2, 4);
      // Gloves
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 2, torsoY + armOff - 1, 3, 2);
      ctx.fillRect(cx + charW - 1, torsoY - armOff - 1, 3, 2);
    } else {
      const armSwing = Math.sin(animFrame * Math.PI) * 2.5;
      ctx.fillRect(cx + 1, torsoY + 2 - armSwing, 2, 4);
      ctx.fillRect(cx + charW - 3, torsoY + 2 + armSwing, 2, 4);
      // White Gloves
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx, torsoY + 5 - armSwing, 3, 2);
      ctx.fillRect(cx + charW - 3, torsoY + 5 + armSwing, 3, 2);
    }

    // 3. Dark Pants
    const legsY = torsoY + torsoH;
    ctx.fillStyle = '#1b2838';

    if (state === 'run') {
      const legCycle = animFrame % 4;
      if (legCycle === 0) {
        ctx.fillRect(cx + 1, legsY, 3, legsH);
        ctx.fillRect(cx + charW - 4, legsY, 3, legsH - 1);
      } else if (legCycle === 1) {
        ctx.fillRect(cx + 3, legsY, charW - 6, legsH);
      } else if (legCycle === 2) {
        ctx.fillRect(cx + charW - 4, legsY, 3, legsH);
        ctx.fillRect(cx + 1, legsY, 3, legsH - 1);
      } else {
        ctx.fillRect(cx + 3, legsY, charW - 6, legsH);
      }
    } else if (state === 'climb') {
      const legStep = (animFrame % 2 === 0) ? 2 : -2;
      ctx.fillRect(cx + 2, legsY + legStep, 3, legsH - Math.abs(legStep));
      ctx.fillRect(cx + charW - 5, legsY - legStep, 3, legsH - Math.abs(legStep));
    } else {
      ctx.fillRect(cx + 2, legsY, 3, legsH);
      ctx.fillRect(cx + charW - 5, legsY, 3, legsH);
    }

    // Boots (Dark)
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(cx + 1, cy + charH - 2, 4, 2);
    ctx.fillRect(cx + charW - 5, cy + charH - 2, 4, 2);

    // If carrying gold, draw small gold bar on back
    if (hasGold) {
      ctx.fillStyle = '#f5a623';
      ctx.fillRect(cx - 3, torsoY + 2, 4, 5);
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(cx - 3, torsoY + 2, 4, 1);
    }

    ctx.restore();
  }

  // --- Dig Laser Beam & Particles ---
  drawLaser(ctx, startX, startY, targetX, targetY, progress) {
    ctx.save();
    // High-tech laser drill beam
    ctx.strokeStyle = '#ffdd44';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Core bright beam
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Target impact sparks
    ctx.fillStyle = '#ff8800';
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 8;
      ctx.fillRect(targetX + Math.cos(angle) * dist, targetY + Math.sin(angle) * dist, 2, 2);
    }

    ctx.restore();
  }
}
