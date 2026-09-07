// Ballpoint Pen Stickman Rig & Ascent Enemies for INKFALL

class BallpointStickman {
    constructor(scene, isPlayer = true, colorHex = '#162a56') {
        this.scene = scene;
        this.isPlayer = isPlayer;
        this.colorHex = colorHex;

        // Position & Physics
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.width = 0.8;
        this.height = 1.8;
        this.facing = 1; // 1: right, -1: left

        // Animation State
        this.state = 'idle'; // 'idle' | 'run' | 'jump' | 'fall' | 'wallslide' | 'dash' | 'crouch'
        this.animTime = 0;
        this.wobblePhase = 0;

        // Player Mechanics
        this.isGrounded = false;
        this.isWallSliding = false;
        this.wallSide = 0; // -1: left wall, 1: right wall
        this.canDoubleJump = true;
        this.canDash = true; // reset on landing or wall touch
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDuration = 0.18;
        this.dashSpeed = 22.0;
        this.dashDir = { x: 1, y: 0 };
        this.aimAngle = 0;
        this.invulnerableTimer = 0;

        // Gun & Firing
        this.fireCooldown = 0;
        this.isFiring = false;

        // Create 2D Canvas Sprite / Texture for Hand-drawn Ballpoint Pen Aesthetic
        this.canvas = document.createElement('canvas');
        this.canvas.width = 256;
        this.canvas.height = 256;
        this.ctx = this.canvas.getContext('2d');

        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;

        const geo = new THREE.PlaneGeometry(2.4, 2.4);
        const mat = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.set(this.x, this.y, 0.2);
        this.scene.add(this.mesh);

        // Render initial frame
        this.renderFrame();
    }

    // Set Stickman World Position
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.mesh.position.set(x, y, 0.2);
    }

    // Draw hand-drawn ballpoint pen line with organic jitter
    drawPenLine(ctx, x1, y1, x2, y2, lineWidth = 3.5, color = this.colorHex) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Organic pen pressure and micro-wobble
        const midX = (x1 + x2) / 2 + (Math.sin(this.wobblePhase * 4) * 0.8);
        const midY = (y1 + y2) / 2 + (Math.cos(this.wobblePhase * 3) * 0.8);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.stroke();

        // Second faint ballpoint bleed stroke
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = lineWidth * 0.7;
        ctx.beginPath();
        ctx.moveTo(x1 + 0.5, y1 + 0.5);
        ctx.lineTo(x2 - 0.5, y2 - 0.5);
        ctx.stroke();

        ctx.restore();
    }

    // Draw Circle (Head / Joints)
    drawPenCircle(ctx, cx, cy, r, color = this.colorHex) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // Inner pen crosshair/sketch dot
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Render Stickman Pose based on State
    renderFrame() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 256, 256);

        // Center is (128, 128)
        ctx.save();
        ctx.translate(128, 128);

        // Flip horizontally based on facing direction
        if (this.facing < 0) {
            ctx.scale(-1, 1);
        }

        // Flashing when invulnerable
        if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 20) % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }

        // Skeleton Landmarks in local canvas space
        const headY = -48;
        const neckY = -34;
        const hipY = 12;
        const headR = 14;

        // Pose calculation
        let leftKnee = { x: -10, y: 38 };
        let leftFoot = { x: -14, y: 64 };
        let rightKnee = { x: 10, y: 38 };
        let rightFoot = { x: 14, y: 64 };
        let leftElbow = { x: -12, y: -10 };
        let leftHand = { x: -18, y: 6 };
        let rightElbow = { x: 14, y: -14 };
        let rightHand = { x: 26, y: -10 };

        if (this.state === 'run') {
            const runCycle = Math.sin(this.animTime * 14);
            const runCos = Math.cos(this.animTime * 14);

            leftKnee = { x: -runCycle * 18, y: 32 + Math.abs(runCos) * 8 };
            leftFoot = { x: -runCycle * 28, y: 58 - runCos * 10 };
            rightKnee = { x: runCycle * 18, y: 32 + Math.abs(runCos) * 8 };
            rightFoot = { x: runCycle * 28, y: 58 + runCos * 10 };

            leftElbow = { x: runCos * 14, y: -8 };
            leftHand = { x: runCos * 22, y: 4 };
        } else if (this.state === 'jump') {
            // Legs tucked up in air
            leftKnee = { x: -18, y: 26 };
            leftFoot = { x: -24, y: 44 };
            rightKnee = { x: 12, y: 22 };
            rightFoot = { x: 8, y: 42 };
        } else if (this.state === 'fall') {
            // Legs spread descending
            leftKnee = { x: -14, y: 36 };
            leftFoot = { x: -20, y: 66 };
            rightKnee = { x: 14, y: 34 };
            rightFoot = { x: 18, y: 62 };
        } else if (this.state === 'wallslide') {
            // One hand braced against wall, legs tucked
            leftKnee = { x: -12, y: 30 };
            leftFoot = { x: -6, y: 52 };
            rightKnee = { x: 10, y: 28 };
            rightFoot = { x: 16, y: 50 };
            leftHand = { x: -26, y: -20 }; // Touching wall
        } else if (this.state === 'dash') {
            // Extreme dynamic dash pose
            leftKnee = { x: -24, y: 20 };
            leftFoot = { x: -42, y: 32 };
            rightKnee = { x: -10, y: 16 };
            rightFoot = { x: -28, y: 24 };

            // Motion lines behind stickman
            ctx.save();
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2.0;
            ctx.setLineDash([8, 4]);
            for (let m = -2; m <= 2; m++) {
                ctx.beginPath();
                ctx.moveTo(-50, m * 14);
                ctx.lineTo(-80 - Math.random() * 20, m * 14);
                ctx.stroke();
            }
            ctx.restore();
        } else if (this.state === 'crouch') {
            // Crouching / sliding low
            leftKnee = { x: -20, y: 30 };
            leftFoot = { x: -32, y: 50 };
            rightKnee = { x: 16, y: 28 };
            rightFoot = { x: 28, y: 48 };
        }

        // Draw Legs
        this.drawPenLine(ctx, 0, hipY, leftKnee.x, leftKnee.y);
        this.drawPenLine(ctx, leftKnee.x, leftKnee.y, leftFoot.x, leftFoot.y);
        this.drawPenLine(ctx, 0, hipY, rightKnee.x, rightKnee.y);
        this.drawPenLine(ctx, rightKnee.x, rightKnee.y, rightFoot.x, rightFoot.y);

        // Draw Torso (Spine)
        this.drawPenLine(ctx, 0, neckY, 0, hipY, 3.8);

        // Draw Head
        this.drawPenCircle(ctx, 0, headY, headR);

        // Draw Aiming Arm & Gun (RIPPER)
        // Convert world aimAngle into local canvas coordinates
        let gunAng = this.facing >= 0 
            ? -this.aimAngle 
            : (this.aimAngle > 0 ? this.aimAngle - Math.PI : this.aimAngle + Math.PI);
        const gunDist = 28;
        const gunX = Math.cos(gunAng) * gunDist;
        const gunY = Math.sin(gunAng) * gunDist - 20;

        // Front Arm
        this.drawPenLine(ctx, 0, neckY + 4, gunX * 0.5, gunY * 0.5);
        this.drawPenLine(ctx, gunX * 0.5, gunY * 0.5, gunX, gunY);

        // Back Arm
        this.drawPenLine(ctx, 0, neckY + 4, leftElbow.x, leftElbow.y);
        this.drawPenLine(ctx, leftElbow.x, leftElbow.y, leftHand.x, leftHand.y);

        // Draw Gun: Mechanical Pen Barrel ("RIPPER")
        ctx.save();
        ctx.translate(gunX, gunY);
        ctx.rotate(gunAng);

        ctx.strokeStyle = this.colorHex;
        ctx.fillStyle = '#f6f4ee';
        ctx.lineWidth = 2.5;

        // Pen barrel rectangle
        ctx.fillRect(0, -5, 22, 10);
        ctx.strokeRect(0, -5, 22, 10);

        // Pen nib tip
        ctx.beginPath();
        ctx.moveTo(22, -5);
        ctx.lineTo(30, 0);
        ctx.lineTo(22, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pen grip hatching
        ctx.beginPath();
        for (let h = 4; h <= 16; h += 4) {
            ctx.moveTo(h, -5);
            ctx.lineTo(h + 2, 5);
        }
        ctx.stroke();

        // Muzzle scribble flash when firing
        if (this.fireCooldown > 0.08) {
            ctx.save();
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(36, 0, 8, 0, Math.PI * 2);
            ctx.stroke();
            // Flash rays
            for (let r = 0; r < 6; r++) {
                const a = (r / 6) * Math.PI * 2;
                ctx.moveTo(34 + Math.cos(a) * 4, Math.sin(a) * 4);
                ctx.lineTo(34 + Math.cos(a) * 12, Math.sin(a) * 12);
            }
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
        ctx.restore();

        this.texture.needsUpdate = true;
    }

    update(dt) {
        this.animTime += dt;
        this.wobblePhase = (this.wobblePhase + dt * 8) % (Math.PI * 2);

        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }
        if (this.fireCooldown > 0) {
            this.fireCooldown -= dt;
        }

        // Periodic hand-drawn re-render (creates authentic stop-motion jitter)
        this.renderFrame();
    }

    dispose() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        if (this.texture) this.texture.dispose();
    }
}

// Red Stickman Sniper / Gunner (Ascent Enemy)
class RedStickmanEnemy {
    constructor(scene, x, y, platform) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.platform = platform;
        this.hp = 2;
        this.maxHp = 2;
        this.facing = -1;
        this.shootCooldown = Math.random() * 1.5 + 1.2;
        this.shootTimer = this.shootCooldown;
        this.aimAngle = 0;
        this.isAlive = true;

        this.stickman = new BallpointStickman(scene, false, '#b91c1c');
        this.stickman.setPosition(x, y);

        // Laser Aiming Line
        const laserMat = new THREE.LineDashedMaterial({
            color: 0xdc2626,
            dashSize: 0.3,
            gapSize: 0.2,
            opacity: 0.65,
            transparent: true
        });
        const laserGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        ]);
        this.laserLine = new THREE.Line(laserGeo, laserMat);
        this.laserLine.computeLineDistances();
        this.scene.add(this.laserLine);
    }

    update(dt, player, bullets) {
        if (!this.isAlive) return;

        // Face player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.facing = dx >= 0 ? 1 : -1;
        this.stickman.facing = this.facing;
        this.aimAngle = Math.atan2(dy, dx);
        this.stickman.aimAngle = this.aimAngle;
        this.stickman.state = 'idle';
        this.stickman.update(dt);
        this.stickman.setPosition(this.x, this.y);

        // Update Laser Aiming Line (connects directly to player, telegraphing before firing)
        const distToPlayer = Math.hypot(dx, dy);
        const targetDist = Math.min(distToPlayer, 14.0);
        const start = new THREE.Vector3(this.x, this.y + 0.1, 0.1);
        const end = new THREE.Vector3(this.x + Math.cos(this.aimAngle) * targetDist, this.y + 0.1 + Math.sin(this.aimAngle) * targetDist, 0.1);
        this.laserLine.geometry.setFromPoints([start, end]);
        this.laserLine.computeLineDistances();
        
        if (this.shootTimer < 0.6) {
            this.laserLine.material.opacity = 0.85 + Math.sin(this.shootTimer * 30) * 0.15;
            this.laserLine.material.dashSize = 0.8;
            this.laserLine.material.gapSize = 0.08;
        } else {
            this.laserLine.material.opacity = Math.min(0.65, (2.2 - this.shootTimer) * 0.4);
            this.laserLine.material.dashSize = 0.3;
            this.laserLine.material.gapSize = 0.2;
        }

        // Firing logic
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            this.shootTimer = 2.2 + Math.random() * 0.8;
            this.shootBullet(bullets);
        }
    }

    shootBullet(bullets) {
        if (window.InkSound) {
            window.InkSound.playShoot(false);
        }
        const spd = 7.5;
        bullets.push({
            x: this.x + Math.cos(this.aimAngle) * 0.6,
            y: this.y + 0.1 + Math.sin(this.aimAngle) * 0.6,
            vx: Math.cos(this.aimAngle) * spd,
            vy: Math.sin(this.aimAngle) * spd,
            isPlayer: false,
            isReflected: false,
            radius: 0.22,
            life: 6.0,
            colorHex: '#dc2626'
        });
    }

    takeDamage(dmg, splatters) {
        this.hp -= dmg;
        splatters.spawnPaintExplosion(this.x, this.y, 25, false);
        splatters.addFloatingText(`-${dmg * 50}`, this.x, this.y + 0.8, '#dc2626');
        if (this.hp <= 0) {
            this.die(splatters);
        }
    }

    die(splatters) {
        this.isAlive = false;
        splatters.spawnPaintExplosion(this.x, this.y, 60, true);
        splatters.addFloatingText('击败 +100', this.x, this.y + 1.2, '#1a3365', true);
        this.dispose();
    }

    dispose() {
        if (this.stickman) this.stickman.dispose();
        if (this.laserLine && this.laserLine.parent) {
            this.laserLine.parent.remove(this.laserLine);
        }
    }
}

// Geometric Floating Glyph Sentinel (Ascent Flying Enemy)
class GlyphSentinel {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.hp = 3;
        this.maxHp = 3;
        this.time = Math.random() * Math.PI * 2;
        this.shootTimer = 1.8 + Math.random() * 1.0;
        this.isAlive = true;

        // Three.js Line / Ring Geometry
        this.group = new THREE.Group();
        this.group.position.set(x, y, 0.2);

        // Outer Ring
        const ringGeo = new THREE.RingGeometry(0.55, 0.62, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x162a56, side: THREE.DoubleSide });
        this.outerRing = new THREE.Mesh(ringGeo, ringMat);
        this.group.add(this.outerRing);

        // Inner Diamond
        const diamondGeo = new THREE.RingGeometry(0.25, 0.32, 4);
        const diamondMat = new THREE.MeshBasicMaterial({ color: 0x1e40af, side: THREE.DoubleSide });
        this.innerDiamond = new THREE.Mesh(diamondGeo, diamondMat);
        this.group.add(this.innerDiamond);

        // Central Red Eye
        const eyeGeo = new THREE.CircleGeometry(0.12, 12);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
        this.eye = new THREE.Mesh(eyeGeo, eyeMat);
        this.group.add(this.eye);

        this.scene.add(this.group);
    }

    update(dt, player, bullets) {
        if (!this.isAlive) return;

        this.time += dt;
        // Floating oscillation
        this.x = this.originX + Math.sin(this.time * 1.5) * 1.2;
        this.y = this.originY + Math.cos(this.time * 2.0) * 0.6;
        this.group.position.set(this.x, this.y, 0.2);

        // Spin geometry
        this.outerRing.rotation.z += 1.2 * dt;
        this.innerDiamond.rotation.z -= 2.4 * dt;

        // Pulse scale
        const pulse = 1.0 + Math.sin(this.time * 6) * 0.08;
        this.group.scale.set(pulse, pulse, 1);

        // Radial Ring Shooting
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            this.shootTimer = 2.8 + Math.random() * 0.8;
            this.fireRadialRing(bullets);
        }
    }

    fireRadialRing(bullets) {
        if (window.InkSound) {
            window.InkSound.playShoot(false);
        }
        const bulletCount = 6;
        const spd = 4.2;
        for (let i = 0; i < bulletCount; i++) {
            const ang = (i / bulletCount) * Math.PI * 2 + this.time;
            bullets.push({
                x: this.x + Math.cos(ang) * 0.7,
                y: this.y + Math.sin(ang) * 0.7,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                isPlayer: false,
                isReflected: false,
                radius: 0.2,
                life: 6.0,
                colorHex: '#dc2626'
            });
        }
    }

    takeDamage(dmg, splatters) {
        this.hp -= dmg;
        splatters.spawnPaintExplosion(this.x, this.y, 25, false);
        splatters.addFloatingText(`-${dmg * 50}`, this.x, this.y + 0.8, '#0284c7');
        if (this.hp <= 0) {
            this.die(splatters);
        }
    }

    die(splatters) {
        this.isAlive = false;
        splatters.spawnPaintExplosion(this.x, this.y, 75, true);
        splatters.addFloatingText('哨兵摧毁 +250', this.x, this.y + 1.2, '#1a3365', true);
        this.dispose();
    }

    dispose() {
        if (this.group && this.group.parent) {
            this.group.parent.remove(this.group);
        }
    }
}

window.BallpointStickman = BallpointStickman;
window.RedStickmanEnemy = RedStickmanEnemy;
window.GlyphSentinel = GlyphSentinel;
