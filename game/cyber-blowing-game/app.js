// Main Application Controller
class CyberBlowingGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.audioProcessor = null;
        this.windMeter = null;
        this.currentMode = null;
        this.modes = {};
        this.activeModeName = 'candle';
        this.lastTime = 0;
        this.isSwitchingMode = false; // Flag to pause wind detection during switch
        this.switchTransitionTime = 0; // Transition timer
    }

    async init() {
        // Show permission modal
        const modal = document.getElementById('permission-modal');
        const grantBtn = document.getElementById('grant-permission');

        grantBtn.addEventListener('click', async () => {
            // Initialize audio
            this.audioProcessor = new AudioProcessor();
            const success = await this.audioProcessor.initialize();

            if (success) {
                modal.classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');
                this.setupScene();
                this.setupControls();
                this.setupModes();
                this.switchMode('candle');
                this.animate();
            }
        });
    }

    setupScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e27);
        this.scene.fog = new THREE.Fog(0x0a0e27, 5, 15);

        // Create camera
        const canvas = document.getElementById('game-canvas');
        const aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 1, 4);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0x00f5ff, 0.3);
        backLight.position.set(-5, 3, -5);
        this.scene.add(backLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupControls() {
        // Wind meter
        this.windMeter = new WindMeter();

        // Sensitivity slider
        const sensitivitySlider = document.getElementById('sensitivity');
        const sensitivityValue = document.getElementById('sensitivity-value');

        sensitivitySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.audioProcessor.setSensitivity(value);
            sensitivityValue.textContent = value.toFixed(1) + 'x';
        });

        // Mode buttons
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;

                // Prevent switching if already switching
                if (this.isSwitchingMode) return;

                // Don't switch if already in this mode
                if (mode === this.activeModeName) return;

                this.switchMode(mode);

                // Update active state
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    setupModes() {
        // Initialize all game modes
        this.modes = {
            candle: new CandleMode(this.scene),
            bubble: new BubbleMode(this.scene),
            pinwheel: new PinwheelMode(this.scene),
            dandelion: new DandelionMode(this.scene)
        };
    }

    switchMode(modeName) {
        // Set switching flag to pause wind detection
        this.isSwitchingMode = true;
        this.switchTransitionTime = 0.3; // 300ms transition

        // Reset wind meter to 0
        this.windMeter.reset();

        // Reset and dispose current mode properly
        if (this.currentMode) {
            // Call reset first to stop ongoing animations
            if (this.currentMode.reset) {
                this.currentMode.reset();
            }
            // Then dispose to clean up
            this.currentMode.dispose();
        }

        // Initialize new mode
        this.activeModeName = modeName;
        this.currentMode = this.modes[modeName];
        this.currentMode.init();

        // Update instruction text
        const instructions = {
            candle: '对着麦克风吹气来熄灭蜡烛！',
            bubble: '轻轻吹气制造美丽的泡泡！',
            pinwheel: '用力吹气让风车转得更快！',
            dandelion: '吹散蒲公英的种子，让它们飞向远方！'
        };

        document.getElementById('mode-instruction').textContent =
            instructions[modeName] || '对着麦克风吹气开始游戏！';
    }

    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));

        // Calculate delta time
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Handle mode switching transition
        if (this.isSwitchingMode) {
            this.switchTransitionTime -= deltaTime;
            if (this.switchTransitionTime <= 0) {
                this.isSwitchingMode = false;
            }
        }

        // Get wind force from microphone (pause during mode switch)
        const windForce = this.isSwitchingMode ? 0 : this.audioProcessor.getWindForce();

        // Update wind meter
        this.windMeter.update(windForce);

        // Update current game mode
        if (this.currentMode) {
            this.currentMode.update(windForce, deltaTime);
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const canvas = document.getElementById('game-canvas');
        const aspect = canvas.clientWidth / canvas.clientHeight;

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new CyberBlowingGame();
    game.init();
});
