/**
 * CloudRoam Active - Main Controller
 */

import { PoseDetector } from './pose.js';
import { GameEngine } from './game.js';

class App {
    constructor() {
        this.videoElement = document.getElementsByClassName('input_video')[0];
        this.canvasElement = document.getElementsByClassName('output_canvas')[0];

        // Fullscreen Canvas Setup
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.canvasCtx = this.canvasElement.getContext('2d');

        this.debugInfoElement = document.getElementById('debug-info');
        this.startBtn = document.getElementById('start-btn');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.restartBtn = document.getElementById('restart-btn');
        this.finalScoreElement = document.getElementById('final-score');

        this.poseDetector = new PoseDetector();
        this.gameEngine = new GameEngine(
            this.canvasCtx,
            this.canvasElement.width,
            this.canvasElement.height,
            this.onGameOver.bind(this) // Pass callback
        );

        this.lastFrameTime = 0;

        this.init();
    }

    resizeCanvas() {
        this.canvasElement.width = window.innerWidth;
        this.canvasElement.height = window.innerHeight;
    }

    async init() {
        // Event Listeners
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => {
            this.gameOverScreen.classList.remove('active');
            this.startGame();
        });

        // Initialize Pose Detector
        await this.poseDetector.init(this.videoElement, this.canvasElement);

        // Set up callback (This drives the loop!)
        this.poseDetector.setCallback(this.onPoseResults.bind(this));

        // Start basic UI / Stats Loop
        this.uiLoop();
    }

    startGame() {
        this.startScreen.classList.remove('active');
        this.gameOverScreen.classList.remove('active');
        this.poseDetector.calibrate();
        console.log("Game Started");
        this.gameEngine.start();
    }

    onGameOver(finalScore) {
        console.log("Game Over! Final Score:", finalScore);
        this.finalScoreElement.innerText = finalScore;
        this.gameOverScreen.classList.add('active');
    }

    onPoseResults(results, signal) {
        // This is called every frame processed by MediaPipe
        const now = performance.now();
        const dt = now - (this.lastFrameTime || now);
        this.lastFrameTime = now;

        // 1. Clear & Draw Background (Camera Feed)
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        // Draw Camera (Mirrored)
        this.canvasCtx.save();
        this.canvasCtx.translate(this.canvasElement.width, 0);
        this.canvasCtx.scale(-1, 1);
        this.canvasCtx.globalAlpha = 0.3;
        this.canvasCtx.drawImage(
            results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasCtx.restore();

        // 2. Game Update & Draw
        if (this.gameEngine.isPlaying) {
            this.gameEngine.input(signal);
            this.gameEngine.update(dt);
            this.gameEngine.draw();
        }

        this.canvasCtx.restore();
    }

    uiLoop() {
        // Update debug info
        this.debugInfoElement.innerText = this.poseDetector.getDebugInfo();
        requestAnimationFrame(this.uiLoop.bind(this));
    }
}

// Start App
window.onload = () => {
    new App();
};
