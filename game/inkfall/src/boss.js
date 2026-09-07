// The Winged Ink God: THE HOLLOW SAINT for INKFALL

class HollowSaintBoss {
    constructor(scene, baseY = 188.0) {
        this.scene = scene;
        this.baseY = baseY;
        this.x = 0;
        this.y = baseY;
        this.targetX = 0;
        this.targetY = baseY;
        this.hp = 1000;
        this.maxHp = 1000;
        this.phase = 1; // 1: BOUND I, 2: UNBOUND II, 3: APOCALYPSE III
        this.isAlive = true;
        this.isDefeated = false;
        this.defeatTimer = 0;

        this.time = 0;
        this.attackTimer = 2.0;
        this.attackPattern = 0;
        this.facing = -1;

        // Wing Animation State
        this.wingFlap = 0;
        this.wingSpread = 1.0;

        // 3D Group Hierarchy
        this.group = new THREE.Group();
        this.group.position.set(this.x, this.y, 0.2);

        // Canvas for Rendering Dynamic Ballpoint Boss Body & Wings
        this.canvas = document.createElement('canvas');
        this.canvas.width = 512;
        this.canvas.height = 512;
        this.ctx = this.canvas.getContext('2d');

        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;

        const bossGeo = new THREE.PlaneGeometry(7.5, 7.5);
        const bossMat = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this.mesh = new THREE.Mesh(bossGeo, bossMat);
        this.group.add(this.mesh);

        // Glowing Core / Red Eye
        const eyeGeo = new THREE.CircleGeometry(0.25, 16);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
        this.eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
        this.eyeMesh.position.set(0, 0.2, 0.05);
        this.group.add(this.eyeMesh);

        this.scene.add(this.group);
        this.renderBossGraphic();
    }

    // Set Position in Arena
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.group.position.set(x, y, 0.2);
    }

    // Helper: Draw Hatch Fill (Classic ballpoint pen diagonal lines)
    drawPenHatch(ctx, x, y, w, h, step = 6, color = '#162a56') {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = -h; i < w; i += step) {
            ctx.moveTo(x + i, y);
            ctx.lineTo(x + i + h, y + h);
        }
        ctx.stroke();
        ctx.restore();
    }

    // Render Boss Ballpoint Artwork onto Canvas
    renderBossGraphic() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 512, 512);

        ctx.save();
        ctx.translate(256, 256);

        const penBlue = '#162a56';
        const penRed = '#dc2626';

        // Flapping motion
        const flap = Math.sin(this.wingFlap) * 0.25;
        const spread = this.wingSpread;

        // 1. Draw Massive Slatted Ink Wings
        // Left Wing & Right Wing
        const numFeathers = this.phase === 3 ? 12 : 9;
        const wingColors = this.phase === 3 ? [penRed, '#b91c1c'] : [penBlue, '#1e3a8a'];

        for (let side = -1; side <= 1; side += 2) {
            ctx.save();
            ctx.scale(side, 1);
            ctx.translate(35, -20);
            ctx.rotate(flap * 0.4);

            // Main wing bone / arm
            ctx.strokeStyle = wingColors[0];
            ctx.lineWidth = 4.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(75 * spread, -35 - (flap * 20));
            ctx.lineTo(165 * spread, -10 + (flap * 15));
            ctx.stroke();

            // Slatted Feathers with Ballpoint Hatching
            for (let f = 0; f < numFeathers; f++) {
                const fProgress = f / numFeathers;
                const fx = 35 + fProgress * 125 * spread;
                const fy = -25 + fProgress * 25;
                const fLength = 65 + Math.sin(fProgress * Math.PI) * 55;
                const fAngle = 0.55 + fProgress * 0.65 + flap * 0.3;

                ctx.save();
                ctx.translate(fx, fy);
                ctx.rotate(fAngle);

                // Feather outer stroke
                ctx.strokeStyle = (this.phase >= 2 && f % 2 === 1) ? penRed : wingColors[0];
                ctx.fillStyle = '#f8f6f0';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.rect(-10, 0, 20, fLength);
                ctx.fill();
                ctx.stroke();

                // Inner feather diagonal pen hatch
                ctx.beginPath();
                for (let h = 6; h < fLength - 4; h += 7) {
                    ctx.moveTo(-9, h);
                    ctx.lineTo(9, h + 5);
                }
                ctx.strokeStyle = (this.phase >= 2 && f % 2 === 1) ? '#ef4444' : '#2563eb';
                ctx.lineWidth = 1.4;
                ctx.stroke();

                ctx.restore();
            }
            ctx.restore();
        }

        // 2. Halo (Concentric Elliptical Pen Rings)
        ctx.save();
        ctx.translate(0, -115);
        const haloR = 52;
        const haloSquash = 0.32;
        const haloRot = this.time * 0.8;

        if (this.phase === 1) {
            // Intact Sacred Halo
            ctx.strokeStyle = penRed;
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            ctx.ellipse(0, 0, haloR, haloR * haloSquash, haloRot, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = penBlue;
            ctx.lineWidth = 2.0;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.ellipse(0, 0, haloR * 1.25, haloR * 1.25 * haloSquash, -haloRot, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            // Shattered / Unbound Halo Fragments
            const shards = 8;
            for (let s = 0; s < shards; s++) {
                const ang = (s / shards) * Math.PI * 2 + this.time * 2.0;
                const dist = haloR * (1.1 + Math.sin(ang * 2) * 0.25);
                ctx.save();
                ctx.translate(Math.cos(ang) * dist, Math.sin(ang) * dist * haloSquash);
                ctx.rotate(ang + Math.PI / 2);
                ctx.strokeStyle = penRed;
                ctx.lineWidth = 2.8;
                ctx.strokeRect(-12, -4, 24, 8);
                ctx.restore();
            }
        }
        ctx.restore();

        // 3. Central God Body / Stickman Torso
        // Head
        ctx.strokeStyle = penBlue;
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.arc(0, -65, 20, 0, Math.PI * 2);
        ctx.stroke();

        // Spine
        ctx.beginPath();
        ctx.moveTo(0, -45);
        ctx.lineTo(0, 50);
        ctx.stroke();

        // Celestial Ribcage Hatching
        ctx.beginPath();
        for (let rib = -25; rib <= 30; rib += 10) {
            const w = 24 - Math.abs(rib) * 0.3;
            ctx.moveTo(-w, rib);
            ctx.lineTo(w, rib);
        }
        ctx.strokeStyle = penBlue;
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // Long Flowing Tapering Robes / Ink Tendrils
        ctx.strokeStyle = penBlue;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.quadraticCurveTo(-35 + Math.sin(this.time * 3) * 15, 120, -25, 180);
        ctx.moveTo(0, 50);
        ctx.quadraticCurveTo(35 - Math.sin(this.time * 3) * 15, 120, 25, 180);
        ctx.moveTo(0, 50);
        ctx.lineTo(0, 195);
        ctx.stroke();

        // Red Hazard Markings in Phase 3
        if (this.phase === 3) {
            ctx.strokeStyle = penRed;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, -65, 26, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
        this.texture.needsUpdate = true;
    }

    // Boss State Machine Update
    update(dt, player, bullets, splatters) {
        if (!this.isAlive) return;

        this.time += dt;
        this.wingFlap += dt * 3.5;

        // Phase Transitions
        const hpPct = this.hp / this.maxHp;
        if (hpPct <= 0.33 && this.phase < 3) {
            this.phase = 3;
            this.wingSpread = 1.4;
            if (window.InkSound) window.InkSound.playBossPhase(3);
            splatters.spawnPaintExplosion(this.x, this.y, 80, true);
        } else if (hpPct <= 0.66 && this.phase < 2) {
            this.phase = 2;
            this.wingSpread = 1.2;
            if (window.InkSound) window.InkSound.playBossPhase(2);
            splatters.spawnPaintExplosion(this.x, this.y, 60, true);
        }

        // Floating Physics / Hovering around Target
        this.x += (this.targetX - this.x) * 2.5 * dt;
        this.y += (this.targetY - this.y) * 2.5 * dt;
        this.setPosition(this.x, this.y);

        // Hover bob
        this.targetY = this.baseY + Math.sin(this.time * 1.8) * 1.2;
        if (Math.abs(this.targetX - this.x) < 0.2) {
            this.targetX = (Math.sin(this.time * 0.8) * 5.5);
        }

        // Pulse Eye Mesh
        const eyeScale = 1.0 + Math.sin(this.time * 8) * 0.25;
        this.eyeMesh.scale.set(eyeScale, eyeScale, 1);

        // Attack Loop
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
            this.executeAttack(player, bullets, splatters);
            this.attackTimer = this.phase === 3 ? 1.4 : (this.phase === 2 ? 1.8 : 2.4);
        }

        // Re-render boss texture periodically for animation
        this.renderBossGraphic();
    }

    // Execute Attacks Based on Current Phase
    executeAttack(player, bullets, splatters) {
        this.attackPattern = (this.attackPattern + 1) % 3;

        if (this.phase === 1) {
            // BOUND I Attacks
            if (this.attackPattern === 0) {
                // Spread of 5 aimed ink needles
                if (window.InkSound) window.InkSound.playShoot(true);
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const baseAng = Math.atan2(dy, dx);
                for (let i = -2; i <= 2; i++) {
                    const ang = baseAng + i * 0.22;
                    bullets.push({
                        x: this.x + Math.cos(ang) * 1.2,
                        y: this.y + Math.sin(ang) * 1.2,
                        vx: Math.cos(ang) * 6.0,
                        vy: Math.sin(ang) * 6.0,
                        isPlayer: false,
                        isReflected: false,
                        radius: 0.24,
                        life: 6.0,
                        colorHex: '#dc2626'
                    });
                }
            } else if (this.attackPattern === 1) {
                // Ring pulse from halo
                if (window.InkSound) window.InkSound.playShoot(false);
                const count = 10;
                for (let i = 0; i < count; i++) {
                    const ang = (i / count) * Math.PI * 2;
                    bullets.push({
                        x: this.x + Math.cos(ang) * 1.4,
                        y: this.y + Math.sin(ang) * 1.4,
                        vx: Math.cos(ang) * 4.5,
                        vy: Math.sin(ang) * 4.5,
                        isPlayer: false,
                        isReflected: false,
                        radius: 0.22,
                        life: 6.0,
                        colorHex: '#b91c1c'
                    });
                }
            } else {
                // Feather barrage from wings
                for (let side = -1; side <= 1; side += 2) {
                    const wingX = this.x + side * 2.8;
                    const wingY = this.y + 1.2;
                    const dx = player.x - wingX;
                    const dy = player.y - wingY;
                    const ang = Math.atan2(dy, dx);
                    bullets.push({
                        x: wingX,
                        y: wingY,
                        vx: Math.cos(ang) * 7.5,
                        vy: Math.sin(ang) * 7.5,
                        isPlayer: false,
                        isReflected: false,
                        radius: 0.25,
                        life: 6.0,
                        colorHex: '#dc2626'
                    });
                }
            }
        } else if (this.phase === 2) {
            // UNBOUND II Attacks (Halo broken, Floor hazardous)
            if (this.attackPattern === 0) {
                // Spiral bullet hell spray
                const bulletsPerSpray = 14;
                for (let i = 0; i < bulletsPerSpray; i++) {
                    const ang = (i / bulletsPerSpray) * Math.PI * 2 + this.time * 3.0;
                    bullets.push({
                        x: this.x + Math.cos(ang) * 1.5,
                        y: this.y + Math.sin(ang) * 1.5,
                        vx: Math.cos(ang) * 5.2,
                        vy: Math.sin(ang) * 5.2,
                        isPlayer: false,
                        isReflected: false,
                        radius: 0.24,
                        life: 6.0,
                        colorHex: '#dc2626'
                    });
                }
            } else if (this.attackPattern === 1) {
                // Homing halo fragments
                for (let i = 0; i < 4; i++) {
                    const ang = (i / 4) * Math.PI * 2 + this.time;
                    bullets.push({
                        x: this.x + Math.cos(ang) * 2.0,
                        y: this.y + Math.sin(ang) * 2.0,
                        vx: Math.cos(ang) * 3.5,
                        vy: Math.sin(ang) * 3.5,
                        isPlayer: false,
                        isReflected: false,
                        isHoming: true,
                        radius: 0.28,
                        life: 7.0,
                        colorHex: '#b91c1c'
                    });
                }
            } else {
                // Rapid 7-bullet fan
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const baseAng = Math.atan2(dy, dx);
                for (let i = -3; i <= 3; i++) {
                    const ang = baseAng + i * 0.18;
                    bullets.push({
                        x: this.x + Math.cos(ang) * 1.4,
                        y: this.y + Math.sin(ang) * 1.4,
                        vx: Math.cos(ang) * 6.5,
                        vy: Math.sin(ang) * 6.5,
                        isPlayer: false,
                        isReflected: false,
                        radius: 0.22,
                        life: 6.0,
                        colorHex: '#dc2626'
                    });
                }
            }
        } else {
            // APOCALYPSE III (Maximum bullet hell + aggressive streams)
            const count = 18;
            for (let i = 0; i < count; i++) {
                const ang = (i / count) * Math.PI * 2 + Math.sin(this.time * 4);
                bullets.push({
                    x: this.x + Math.cos(ang) * 1.5,
                    y: this.y + Math.sin(ang) * 1.5,
                    vx: Math.cos(ang) * 5.8,
                    vy: Math.sin(ang) * 5.8,
                    isPlayer: false,
                    isReflected: false,
                    radius: 0.24,
                    life: 6.0,
                    colorHex: '#dc2626'
                });
            }
            // Direct aimed burst
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const baseAng = Math.atan2(dy, dx);
            for (let i = -2; i <= 2; i++) {
                const ang = baseAng + i * 0.15;
                bullets.push({
                    x: this.x + Math.cos(ang) * 1.8,
                    y: this.y + Math.sin(ang) * 1.8,
                    vx: Math.cos(ang) * 8.5,
                    vy: Math.sin(ang) * 8.5,
                    isPlayer: false,
                    isReflected: false,
                    radius: 0.26,
                    life: 6.0,
                    colorHex: '#ff2d75'
                });
            }
        }
    }

    takeDamage(dmg, splatters, isReflected = false) {
        if (!this.isAlive) return;

        const mult = isReflected ? 3.0 : 1.0;
        const actualDmg = dmg * mult;
        this.hp = Math.max(0, this.hp - actualDmg);

        // Paint splatter burst on boss body
        const hitX = this.x + (Math.random() - 0.5) * 2.5;
        const hitY = this.y + (Math.random() - 0.5) * 3.0;
        splatters.spawnPaintExplosion(hitX, hitY, isReflected ? 45 : 18, isReflected);

        // Floating damage number
        const dmgText = Math.floor(actualDmg);
        splatters.addFloatingText(
            isReflected ? `暴击 ${dmgText}!` : `${dmgText}`,
            hitX, hitY + 0.8,
            isReflected ? '#ff2d75' : '#1a3365',
            isReflected
        );

        // Defeat Check
        if (this.hp <= 0 && !this.isDefeated) {
            this.triggerDefeat(splatters);
        }
    }

    triggerDefeat(splatters) {
        this.isDefeated = true;
        this.isAlive = false;

        if (window.InkSound) {
            window.InkSound.playVictory();
            window.InkSound.setBgmPhase('victory');
        }

        // Colossal Rainbow Paint Fireworks Explosion!
        for (let b = 0; b < 6; b++) {
            setTimeout(() => {
                const ox = this.x + (Math.random() - 0.5) * 5;
                const oy = this.y + (Math.random() - 0.5) * 5;
                splatters.spawnPaintExplosion(ox, oy, 120, true);
            }, b * 180);
        }

        splatters.addFloatingText('神只是一幅画，', this.x, this.y + 2.5, '#162a56', true);
        splatters.addFloatingText('而你带来了橡皮擦。', this.x, this.y + 1.6, '#dc2626', false);

        // Fade out boss mesh
        let fadeStep = 0;
        const fadeInterval = setInterval(() => {
            fadeStep++;
            if (this.mesh) {
                this.mesh.material.opacity = Math.max(0, 1 - fadeStep / 30);
            }
            if (fadeStep >= 30) {
                clearInterval(fadeInterval);
                this.dispose();
            }
        }, 50);
    }

    dispose() {
        if (this.group && this.group.parent) {
            this.group.parent.remove(this.group);
        }
        if (this.texture) this.texture.dispose();
    }
}

window.HollowSaintBoss = HollowSaintBoss;
