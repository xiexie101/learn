// Wind Meter UI Controller
class WindMeter {
    constructor() {
        this.meterArc = document.getElementById('meter-arc');
        this.meterValue = document.getElementById('meter-value');
        this.maxDashOffset = 251.2; // Circumference of the arc
        this.currentValue = 0;
        this.targetValue = 0;
    }

    update(windForce) {
        this.targetValue = windForce;

        // Smooth animation
        this.currentValue += (this.targetValue - this.currentValue) * 0.2;

        // Update arc
        const offset = this.maxDashOffset - (this.currentValue / 100) * this.maxDashOffset;
        this.meterArc.style.strokeDashoffset = offset;

        // Update text value
        this.meterValue.textContent = Math.round(this.currentValue);

        // Add glow effect at high values
        if (this.currentValue > 70) {
            this.meterArc.style.filter = 'drop-shadow(0 0 20px rgba(255, 0, 128, 0.8))';
        } else if (this.currentValue > 40) {
            this.meterArc.style.filter = 'drop-shadow(0 0 15px rgba(255, 0, 255, 0.6))';
        } else {
            this.meterArc.style.filter = 'drop-shadow(0 0 10px rgba(0, 245, 255, 0.5))';
        }
    }

    reset() {
        this.currentValue = 0;
        this.targetValue = 0;
        this.update(0);
    }
}

// Export for use in main app
window.WindMeter = WindMeter;
