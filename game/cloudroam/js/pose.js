/**
 * CloudRoam Active - Pose Detection Module
 * Handles MediaPipe Pose initialization and logic for detecting body sway.
 */

export class PoseDetector {
    constructor() {
        this.pose = null;
        this.camera = null;
        this.onResultsCallback = null;

        // Calibration State
        this.isCalibrated = false;
        this.neutralX = 0; // The difference (Nose.x - MidHip.x) when standing straight

        // Configuration
        this.leanThreshold = 0.05; // Sensitivity for detecting leans

        // Current Control Signal
        // 0: Center, -1: Left, 1: Right
        this.currentSignal = 0;
        this.rawDiff = 0;

        // Debug info
        this.debugInfo = {
            noseX: 0,
            midHipX: 0,
            status: 'Initializing...'
        };
    }

    async init(videoElement, canvasElement) {
        // Initialize MediaPipe Pose
        this.pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });

        this.pose.setOptions({
            modelComplexity: 1, // 0=Lite, 1=Full, 2=Heavy. 1 is good balance for mobile.
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.pose.onResults(this.onResults.bind(this));

        // Initialize Camera
        this.camera = new Camera(videoElement, {
            onFrame: async () => {
                await this.pose.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });

        await this.camera.start();
        this.debugInfo.status = 'Camera Started';
    }

    setCallback(callback) {
        this.onResultsCallback = callback;
    }

    calibrate() {
        // Reset calibration based on current frame (assumes user is standing straight)
        // This will be called when user hits "Start"
        this.isCalibrated = true;
        // The actual calibration value will be captured in the next onResults loop
        // Or we can just grab the current rawDiff if available. 
        // For simplicity, let's assume rawDiff is constantly updated.
        this.neutralX = this.rawDiff;
        console.log("Calibrated! Neutral Offset:", this.neutralX);
    }

    onResults(results) {
        if (!results.poseLandmarks) {
            return;
        }

        // 1. Get Landmarks
        // Nose: 0
        // Left Hip: 23, Right Hip: 24
        const nose = results.poseLandmarks[0];
        const leftHip = results.poseLandmarks[23];
        const rightHip = results.poseLandmarks[24];

        if (nose && leftHip && rightHip) {
            // Calculate Mid-Hip X
            const midHipX = (leftHip.x + rightHip.x) / 2;

            // Calculate Raw Difference (Nose relative to Hips)
            // If user leans Left (screen left), Nose.x decreases (closer to 0).
            // But verify coordinate system: MediaPipe x is 0 (left) to 1 (right).

            // Standard Front camera (Mirrored usually? MediaPipe output handles mirroring if configured?)
            // Usually we treat the image as we see it on screen (Mirror mode).
            // Let's calculate purely based on coordinates first.

            // Example: Standing straight, simple vertical line. Nose.x ~= MidHip.x
            // Leaning Left (User's Left, Screen Right if mirrored): Nose.x > MidHip.x
            // Leaning Right (User's Right, Screen Left if mirrored): Nose.x < MidHip.x

            // Let's stick to the visual screen direction for now.
            // Screen Left Lean: Nose moves Left (x decreases) relative to Hips.
            // Screen Right Lean: Nose moves Right (x increases) relative to Hips.

            this.rawDiff = nose.x - midHipX;

            this.debugInfo.noseX = nose.x.toFixed(3);
            this.debugInfo.midHipX = midHipX.toFixed(3);

            // 2. Determine Control Signal
            if (this.isCalibrated) {
                // Adjust by neutral position
                const adjustedDiff = this.rawDiff - this.neutralX;

                if (adjustedDiff < -this.leanThreshold) {
                    this.currentSignal = 1; // Camera Left -> User Right
                } else if (adjustedDiff > this.leanThreshold) {
                    this.currentSignal = -1; // Camera Right -> User Left
                } else {
                    this.currentSignal = 0; // Center
                }
            } else {
                // Pre-calibration, just update raw diff for reference
                this.neutralX = this.rawDiff; // Continuous auto-calibration before start? 
                // No, let's wait for explicit calibration.
            }
        }

        // Draw for debug (optional, can be delegated)
        if (this.onResultsCallback) {
            this.onResultsCallback(results, this.currentSignal);
        }
    }

    // Getter for game loop to poll
    getControlSignal() {
        return this.currentSignal;
    }

    getDebugInfo() {
        return `N:${this.debugInfo.noseX} H:${this.debugInfo.midHipX} D:${(this.rawDiff - this.neutralX).toFixed(3)} Sig:${this.currentSignal}`;
    }
}
