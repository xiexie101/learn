// Splatter, Gouache Paint, Decal, and Floating Text Particle Engine for INKFALL

const PAINT_COLORS = [
    { hex: '#ff2d75', r: 1.0, g: 0.176, b: 0.459 },  // Hot Pink / Magenta
    { hex: '#00f0ff', r: 0.0, g: 0.941, b: 1.0 },    // Electric Cyan
    { hex: '#ffde00', r: 1.0, g: 0.871, b: 0.0 },    // Bright Yellow
    { hex: '#ff6b00', r: 1.0, g: 0.420, b: 0.0 },    // Tangerine Orange
    { hex: '#10b981', r: 0.063, g: 0.725, b: 0.506 },// Vivid Lime
    { hex: '#a855f7', r: 0.659, g: 0.333, b: 0.969 },// Violet Purple
];

class SplatterEngine {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.shockwaves = [];
        this.floatingTexts = [];
        this.persistentSplats = []; // Canvas-rendered paint decals on paper/platforms

        // Dedicated World-Space Decal InstancedMesh for permanent paint stains on platforms
        this.maxDecals = 800;
        this.decalCount = 0;
        this.decalGeo = new THREE.CircleGeometry(0.25, 10);
        this.decalMat = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
            depthWrite: false
        });
        this.decalInstanced = new THREE.InstancedMesh(this.decalGeo, this.decalMat, this.maxDecals);
        this.decalInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.decalColors = new Float32Array(this.maxDecals * 3);
        this.decalInstanced.instanceColor = new THREE.InstancedBufferAttribute(this.decalColors, 3);
        this.decalInstanced.instanceColor.setUsage(THREE.DynamicDrawUsage);
        this.decalInstanced.position.z = 0.05;
        this.scene.add(this.decalInstanced);
        this.decalDummy = new THREE.Object3D();

        for (let i = 0; i < this.maxDecals; i++) {
            this.decalDummy.position.set(0, -9999, 0);
            this.decalDummy.scale.set(0, 0, 0);
            this.decalDummy.updateMatrix();
            this.decalInstanced.setMatrixAt(i, this.decalDummy.matrix);
        }
        this.decalInstanced.instanceMatrix.needsUpdate = true;

        // Instanced mesh or dynamic points for 3D flying paint droplets
        this.maxDroplets = 1200;
        this.dropletGeo = new THREE.CircleGeometry(0.12, 8);
        this.dropletMat = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false
        });
        this.dropletInstanced = new THREE.InstancedMesh(this.dropletGeo, this.dropletMat, this.maxDroplets);
        this.dropletInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.colors = new Float32Array(this.maxDroplets * 3);
        this.dropletInstanced.instanceColor = new THREE.InstancedBufferAttribute(this.colors, 3);
        this.dropletInstanced.instanceColor.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.dropletInstanced);

        this.dummy = new THREE.Object3D();
        this.freeAllDroplets();
    }

    freeAllDroplets() {
        this.particles = [];
        for (let i = 0; i < this.maxDroplets; i++) {
            this.dummy.position.set(0, -9999, 0);
            this.dummy.scale.set(0, 0, 0);
            this.dummy.updateMatrix();
            this.dropletInstanced.setMatrixAt(i, this.dummy.matrix);
        }
        this.dropletInstanced.instanceMatrix.needsUpdate = true;
    }

    // Spawn a vibrant multi-colored paint explosion
    spawnPaintExplosion(x, y, count = 45, isMajor = false, preferredColor = null) {
        if (window.InkSound) {
            window.InkSound.playPaintSplat(isMajor);
        }

        // Add concentric shockwave ring
        this.shockwaves.push({
            x, y,
            radius: 0.2,
            maxRadius: isMajor ? 3.5 : 1.8,
            life: 1.0,
            decay: isMajor ? 1.8 : 2.5,
            color: preferredColor ? preferredColor.hex : '#162a56'
        });

        // Spawn droplets
        const num = isMajor ? count * 2 : count;
        for (let i = 0; i < num; i++) {
            if (this.particles.length >= this.maxDroplets) {
                this.particles.shift();
            }

            const col = preferredColor || PAINT_COLORS[Math.floor(Math.random() * PAINT_COLORS.length)];
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 5 + 3) * (isMajor ? 1.6 : 1.0);
            const size = Math.random() * 0.22 + 0.08;

            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed + (Math.random() * 2),
                size,
                scale: 1.0,
                color: col,
                life: 1.0,
                decay: Math.random() * 0.5 + 0.35,
                gravity: 12.0
            });
        }
    }

    // Permanent Paint Splat on Surfaces in World Space (never follows camera)
    addSurfaceDecal(worldX, worldY, colorHex, radius = 0.4) {
        const threeCol = new THREE.Color(colorHex);
        const addSplat = (x, y, r) => {
            const idx = this.decalCount % this.maxDecals;
            this.decalCount++;
            this.decalDummy.position.set(x, y, 0.05);
            this.decalDummy.rotation.z = Math.random() * Math.PI * 2;
            const s = Math.max(0.12, r * (0.85 + Math.random() * 0.4));
            this.decalDummy.scale.set(s, s * (0.8 + Math.random() * 0.4), 1);
            this.decalDummy.updateMatrix();
            this.decalInstanced.setMatrixAt(idx, this.decalDummy.matrix);
            this.decalInstanced.setColorAt(idx, threeCol);
        };

        // Main splatter puddle
        addSplat(worldX, worldY, radius);

        // 1-3 satellite droplets
        const numSatellites = Math.floor(Math.random() * 3) + 1;
        for (let s = 0; s < numSatellites; s++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = radius * (0.6 + Math.random() * 1.0);
            addSplat(worldX + Math.cos(angle) * dist, worldY + Math.sin(angle) * dist * 0.3, radius * 0.35);
        }

        this.decalInstanced.instanceMatrix.needsUpdate = true;
        if (this.decalInstanced.instanceColor) {
            this.decalInstanced.instanceColor.needsUpdate = true;
        }
    }

    // Add Floating Combat Text
    addFloatingText(text, x, y, color = '#1a3365', isBig = false) {
        this.floatingTexts.push({
            text,
            x, y,
            vx: (Math.random() - 0.5) * 0.5,
            vy: isBig ? 1.8 : 1.2,
            life: 1.0,
            decay: isBig ? 0.9 : 1.4,
            color,
            isBig
        });
    }

    // Pen Scribble Dash Trail / Afterimage
    addDashTrail(x, y, facing, gunAngle) {
        this.floatingTexts.push({
            isTrail: true,
            x, y,
            facing,
            gunAngle,
            life: 0.25,
            decay: 1.0,
            color: '#1a3365'
        });
    }

    update(dt, platforms = [], cameraY = 0) {
        // Update paint droplets
        const gravity = 14.0;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy -= gravity * dt;
            p.vx *= 0.98;
            p.life -= p.decay * dt;

            // Check collision with platforms to splat and stick!
            for (let k = 0; k < platforms.length; k++) {
                const plat = platforms[k];
                if (p.x >= plat.x - plat.w / 2 && p.x <= plat.x + plat.w / 2) {
                    if (p.y <= plat.y + 0.15 && p.y >= plat.y - 0.3 && p.vy < 0) {
                        // Splat permanently onto world platform surface!
                        this.addSurfaceDecal(p.x, plat.y, p.color.hex, p.size * 1.5);
                        p.life = 0; // Destroy particle upon sticking
                        break;
                    }
                }
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update InstancedMesh matrices and colors
        for (let i = 0; i < this.maxDroplets; i++) {
            if (i < this.particles.length) {
                const p = this.particles[i];
                this.dummy.position.set(p.x, p.y, 0.1);
                const s = Math.max(0, p.size * (p.life > 0.3 ? 1.0 : p.life / 0.3));
                this.dummy.scale.set(s, s, 1);
                this.dummy.updateMatrix();
                this.dropletInstanced.setMatrixAt(i, this.dummy.matrix);

                const col = p.color;
                this.dropletInstanced.setColorAt(i, new THREE.Color(col.r, col.g, col.b));
            } else {
                this.dummy.position.set(0, -9999, 0);
                this.dummy.scale.set(0, 0, 0);
                this.dummy.updateMatrix();
                this.dropletInstanced.setMatrixAt(i, this.dummy.matrix);
            }
        }
        this.dropletInstanced.instanceMatrix.needsUpdate = true;
        if (this.dropletInstanced.instanceColor) {
            this.dropletInstanced.instanceColor.needsUpdate = true;
        }

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += (sw.maxRadius - sw.radius) * 10 * dt;
            sw.life -= sw.decay * dt;
            if (sw.life <= 0) {
                this.shockwaves.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.x += (ft.vx || 0) * dt;
            ft.y += (ft.vy || 0) * dt;
            ft.life -= ft.decay * dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    // Render 2D overlays (shockwaves, floating texts, blueprint callouts) onto canvas
    renderOverlay(ctx, camera) {
        const cw = ctx.canvas.width;
        const ch = ctx.canvas.height;

        // Helper to convert Three.js world coord to canvas screen coord
        const toScreen = (wx, wy) => {
            const v = new THREE.Vector3(wx, wy, 0);
            v.project(camera);
            return {
                x: ((v.x + 1) / 2) * cw,
                y: ((-v.y + 1) / 2) * ch
            };
        };

        // Render Shockwave Rings (Ballpoint Pen Stitches & Concentric Circles)
        for (const sw of this.shockwaves) {
            const s = toScreen(sw.x, sw.y);
            const edge = toScreen(sw.x + sw.radius, sw.y);
            const rPix = Math.abs(edge.x - s.x);

            ctx.save();
            ctx.strokeStyle = sw.color;
            ctx.globalAlpha = Math.max(0, sw.life * 0.7);
            ctx.lineWidth = 2.5;

            // Outer ring with slight pen wobble
            ctx.beginPath();
            ctx.arc(s.x, s.y, rPix, 0, Math.PI * 2);
            ctx.stroke();

            // Inner dashed pen ring
            if (rPix > 15) {
                ctx.beginPath();
                ctx.setLineDash([6, 4]);
                ctx.arc(s.x, s.y, rPix * 0.7, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Expanding spiky burst rays
            ctx.setLineDash([]);
            const rays = 12;
            for (let k = 0; k < rays; k++) {
                const ang = (k / rays) * Math.PI * 2;
                const r1 = rPix * 0.85;
                const r2 = rPix * 1.15;
                ctx.beginPath();
                ctx.moveTo(s.x + Math.cos(ang) * r1, s.y + Math.sin(ang) * r1);
                ctx.lineTo(s.x + Math.cos(ang) * r2, s.y + Math.sin(ang) * r2);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Render Floating Text & Damage Numbers
        for (const ft of this.floatingTexts) {
            const s = toScreen(ft.x, ft.y);
            ctx.save();
            ctx.globalAlpha = Math.max(0, ft.life);

            if (ft.isTrail) {
                // Sketched stickman dash trail
                ctx.strokeStyle = '#1e3a8a';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(s.x - 10, s.y - 18, 20, 36);
            } else {
                ctx.font = ft.isBig 
                    ? '900 18px "Courier New", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif' 
                    : 'bold 14px "Courier New", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
                ctx.fillStyle = ft.color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // Pen outline
                ctx.shadowColor = 'rgba(255,255,255,0.8)';
                ctx.shadowBlur = 4;
                ctx.fillText(ft.text, s.x, s.y);
            }
            ctx.restore();
        }
    }
}

window.SplatterEngine = SplatterEngine;
