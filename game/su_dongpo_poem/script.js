document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('ink-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;

    // Resize canvas
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        drawScene();
    }
    window.addEventListener('resize', resize);

    // Simple noise function for mountains
    function noise(x) {
        return Math.sin(x * 0.01) + Math.sin(x * 0.03) * 0.5 + Math.sin(x * 0.1) * 0.1;
    }

    function drawMountain(yBase, amplitude, color, speed) {
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 5) {
            const y = yBase - Math.abs(noise(x + Date.now() * speed * 0.0005)) * amplitude;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.fillStyle = color;
        ctx.fill();
    }

    let animationId;
    function drawScene() {
        ctx.clearRect(0, 0, width, height);

        // Draw mist/background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#f4f4f4');
        gradient.addColorStop(1, '#e0e0e0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw mountains (layered)
        // Far
        drawMountain(height * 0.6, 100, 'rgba(150, 160, 160, 0.3)', 0.5);
        // Mid
        drawMountain(height * 0.7, 150, 'rgba(100, 110, 110, 0.5)', 1);
        // Near
        drawMountain(height * 0.85, 200, 'rgba(43, 43, 43, 0.8)', 2);

        animationId = requestAnimationFrame(drawScene);
    }

    // Initial draw
    resize();

    // Poem Animation Logic
    const lines = document.querySelectorAll('.poem-line');
    const hint = document.getElementById('interaction-hint');
    const resetBtn = document.getElementById('reset-btn');
    const overlay = document.getElementById('overlay');
    const body = document.body;

    function showInitialState() {
        // Reset classes
        lines.forEach(line => {
            line.classList.remove('visible');
            line.classList.remove('hidden');
            line.style.display = ''; // Clear inline display
        });

        // Hide last two lines initially
        lines[2].classList.add('hidden');
        lines[3].classList.add('hidden');

        // Reset hint and button
        hint.style.opacity = '0';
        hint.style.pointerEvents = 'none'; // Temporarily disable
        hint.style.display = 'flex';

        resetBtn.classList.remove('visible');
        body.classList.remove('state-realized');

        // Animate in
        setTimeout(() => {
            lines[0].classList.add('visible');
        }, 500);
        setTimeout(() => {
            lines[1].classList.add('visible');
        }, 2000);

        // Show hint after text
        setTimeout(() => {
            hint.style.opacity = '1';
            hint.style.pointerEvents = 'auto';
            hint.style.animation = 'fadeIn 2s ease forwards';
        }, 3500);
    }

    // Initial Load
    showInitialState();

    // Interaction
    hint.addEventListener('click', () => {
        // Transition effect
        overlay.classList.add('active');
        hint.style.opacity = '0';
        hint.style.pointerEvents = 'none';

        setTimeout(() => {
            // Switch content

            // Wait for fade out
            setTimeout(() => {
                lines[0].classList.remove('visible');
                lines[1].classList.remove('visible');
                lines[0].style.display = 'none';
                lines[1].style.display = 'none';
                lines[2].classList.remove('hidden');
                lines[3].classList.remove('hidden');
                lines[2].style.display = 'block';
                lines[3].style.display = 'block';

                // Trigger reflow
                void lines[2].offsetWidth;

                // Fade in new lines
                lines[2].classList.add('visible');
                setTimeout(() => {
                    lines[3].classList.add('visible');
                }, 1500);

                // Show reset button
                setTimeout(() => {
                    resetBtn.classList.add('visible');
                }, 3000);

            }, 500);

            // Remove overlay to reveal new state
            overlay.classList.remove('active');
            body.classList.add('state-realized');

        }, 2000); // Wait for overlay to be fully white
    });

    // Reset Interaction
    resetBtn.addEventListener('click', () => {
        overlay.classList.add('active');
        resetBtn.classList.remove('visible');

        setTimeout(() => {
            showInitialState();
            overlay.classList.remove('active');
        }, 2000);
    });
});
