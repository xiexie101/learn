/**
 * CloudRoam Active - Game Engine
 */

export class GameEngine {
    constructor(canvasCtx, width, height, onGameOver) {
        this.ctx = canvasCtx;
        this.width = width;
        this.height = height;
        this.onGameOver = onGameOver;

        // Game State
        this.isPlaying = false;
        this.score = 0;

        // Player State
        this.playerX = 0; // -1 to 1 normalized position
        this.playerSpeed = 0.05; // Lateral speed

        // Entities (Road, Items, Obstacles)
        this.objects = [];
        this.spawnTimer = 0;
        this.worldSpeed = 0.015; // How fast objects move towards player

        // Assets
        this.images = {};
        this.loadAssets();
    }

    loadAssets() {
        const assets = {
            player: 'assets/images/player.png',
            item: 'assets/images/item.png',
            obstacle: 'assets/images/obstacle.png',
            background: 'assets/images/background.png'
        };

        for (let key in assets) {
            const img = new Image();
            img.src = assets[key];
            this.images[key] = img;
        }
    }

    start() {
        this.isPlaying = true;
        this.score = 0;
        this.objects = [];
        this.updateScoreUI();
    }

    stop() {
        this.isPlaying = false;
    }

    input(controlSignal) {
        // Control Signal: -1 (Left), 0 (Center), 1 (Right)
        if (controlSignal === -1) {
            this.playerX = Math.max(this.playerX - this.playerSpeed, -1);
        } else if (controlSignal === 1) {
            this.playerX = Math.min(this.playerX + this.playerSpeed, 1);
        } else {
            // Auto-return to center friction
            if (this.playerX > 0.02) this.playerX -= 0.02;
            else if (this.playerX < -0.02) this.playerX += 0.02;
            else this.playerX = 0;
        }
    }

    update(dt) {
        if (!this.isPlaying) return;

        // Spawn Logic
        this.spawnTimer++;
        if (this.spawnTimer > 60) { // Every ~1s
            this.spawnObject();
            this.spawnTimer = 0;
        }

        // Update Objects
        for (let i = this.objects.length - 1; i >= 0; i--) {
            let obj = this.objects[i];
            obj.z -= this.worldSpeed; // Move closer (z goes from 1 to 0)

            // Collision Detection when close
            if (obj.z <= 0.1 && obj.z >= 0) {
                // Check X alignment
                // Player "Lane" vs Object Lane
                const playerLane = this.getPlayerLane();
                if (playerLane === obj.lane) {
                    this.handleCollision(obj);
                    this.objects.splice(i, 1);
                    continue;
                }
            }

            // Remove if passed
            if (obj.z < -0.1) {
                this.objects.splice(i, 1);
            }
        }
    }

    spawnObject() {
        const type = Math.random() > 0.4 ? 'item' : 'obstacle';
        // Random Lane: -1, 0, 1
        const lane = Math.floor(Math.random() * 3) - 1;

        this.objects.push({
            type: type,
            lane: lane,
            z: 1.0 // Far away
        });
    }

    getPlayerLane() {
        // Map continuous X to discrete lane for simple collision
        // Lane 0: -0.33 to 0.33
        if (this.playerX < -0.33) return -1;
        if (this.playerX > 0.33) return 1;
        return 0;
    }

    handleCollision(obj) {
        if (obj.type === 'item') {
            this.score += 10;
            console.log("Collected! Score:", this.score);
        } else {
            // Obstacle
            console.log("Hit Obstacle!");
            this.score -= 5; // Penalty
            // Optional: Shake effect trigger?
        }
        this.updateScoreUI();

        if (this.score < 0) {
            this.stop();
            if (this.onGameOver) this.onGameOver(this.score);
        }
    }

    updateScoreUI() {
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.innerText = this.score;
    }

    draw() {
        const w = this.ctx.canvas.width;
        const h = this.ctx.canvas.height;

        // Draw Background
        if (this.images.background && this.images.background.complete && this.images.background.naturalWidth !== 0) {
            // Scale to cover or contain? Cover.
            this.ctx.drawImage(this.images.background, 0, 0, w, h);
        } else {
            // Fallback
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, w, h);
        }

        // Draw Road (Trapezoid) with gradient
        const horizon = h * 0.4;
        const roadGradient = this.ctx.createLinearGradient(0, horizon, 0, h);
        // Make road slightly transparent to show background texture if needed? No, standard road.
        roadGradient.addColorStop(0, '#555');
        roadGradient.addColorStop(1, '#333');

        this.ctx.fillStyle = roadGradient;
        this.ctx.beginPath();
        // Bottom width
        const roadW_Bottom = w * 0.8;
        const roadW_Top = w * 0.1;

        this.ctx.moveTo((w - roadW_Bottom) / 2, h); // Bottom Left
        this.ctx.lineTo((w + roadW_Bottom) / 2, h); // Bottom Right
        this.ctx.lineTo((w + roadW_Top) / 2, horizon); // Top Right
        this.ctx.lineTo((w - roadW_Top) / 2, horizon); // Top Left
        this.ctx.fill();

        // Draw Objects
        this.objects.sort((a, b) => b.z - a.z); // Far first
        this.objects.forEach(obj => {
            this.drawObject(obj, w, h, horizon);
        });

        // Draw Player
        const playerScreenX = w / 2 + (this.playerX * (w * 0.4)); // Move within road limits
        const playerY = h - 120; // Slightly higher
        const playerSize = 120; // Larger size for image

        if (this.images.player && this.images.player.complete && this.images.player.naturalWidth !== 0) {
            this.ctx.save();
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
            // Draw centered at playerScreenX, playerY
            this.ctx.drawImage(this.images.player,
                playerScreenX - playerSize / 2, playerY - playerSize / 2,
                playerSize, playerSize);
            this.ctx.restore();
        } else {
            // Fallback
            this.ctx.fillStyle = '#FFD700'; // Gold Player
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'white';
            this.ctx.beginPath();
            this.ctx.arc(playerScreenX, playerY, 30, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawObject(obj, w, h, horizon) {
        const scale = (1 - obj.z);
        const currentY = horizon + (h - horizon) * scale;

        const spread = (scale * w * 0.4);
        const centerX = w / 2 + (obj.lane * spread * 0.8);
        const size = 40 + (scale * 80);

        const img = (obj.type === 'item') ? this.images.item : this.images.obstacle;

        if (img && img.complete && img.naturalWidth !== 0) {
            this.ctx.drawImage(img, centerX - size / 2, currentY - size, size, size);
        } else {
            // Fallback
            if (obj.type === 'item') {
                this.ctx.fillStyle = '#00FF00';
                this.ctx.fillRect(centerX - size / 2, currentY - size, size, size);
            } else {
                this.ctx.fillStyle = '#FF0000';
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, currentY - size);
                this.ctx.lineTo(centerX + size / 2, currentY);
                this.ctx.lineTo(centerX - size / 2, currentY);
                this.ctx.fill();
            }
        }
    }
}
