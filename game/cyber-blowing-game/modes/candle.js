// Candle Mode - Blow to extinguish the flame (Enhanced Version)
class CandleMode {
    constructor(scene) {
        this.scene = scene;
        this.candle = null;
        this.flame = null;
        this.flameParticles = null;
        this.smokeParticles = null;
        this.isExtinguished = false;
        this.extinguishThreshold = 60;
        this.blowAccumulator = 0;
        this.particleVelocities = [];
        this.smokeVelocities = [];
    }

    init() {
        const candleGroup = new THREE.Group();

        // Create candle body with gradient color
        const candleGeometry = new THREE.CylinderGeometry(0.3, 0.35, 2, 32);
        const candleMaterial = new THREE.MeshStandardMaterial({
            color: 0xf4e4c1,
            roughness: 0.7,
            metalness: 0.1,
            emissive: 0xffd700,
            emissiveIntensity: 0.05
        });
        this.candle = new THREE.Mesh(candleGeometry, candleMaterial);
        candleGroup.add(this.candle);

        // Add wax drips for realism
        this.addWaxDrips(candleGroup);

        // Create wick with better material
        const wickGeometry = new THREE.CylinderGeometry(0.025, 0.02, 0.35, 8);
        const wickMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.9
        });
        const wick = new THREE.Mesh(wickGeometry, wickMaterial);
        wick.position.y = 1.15;
        candleGroup.add(wick);

        // Create particle-based flame
        this.createFlameParticles(candleGroup);

        // Add ambient glow around candle
        const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0.1
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 1.3;
        candleGroup.add(glow);

        // Add multiple lights for better illumination
        const mainLight = new THREE.PointLight(0xff6600, 3, 8);
        mainLight.position.set(0, 1.5, 0);
        candleGroup.add(mainLight);
        this.flameLight = mainLight;

        const warmLight = new THREE.PointLight(0xffaa44, 1.5, 5);
        warmLight.position.set(0, 1.3, 0);
        candleGroup.add(warmLight);
        this.warmLight = warmLight;

        candleGroup.position.y = -0.5;
        this.scene.add(candleGroup);
        this.candleGroup = candleGroup;
    }

    addWaxDrips(group) {
        // Add 3-5 random wax drips
        const numDrips = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numDrips; i++) {
            const angle = (Math.PI * 2 * i) / numDrips + Math.random() * 0.5;
            const height = 0.3 + Math.random() * 0.5;

            const dripGeometry = new THREE.CylinderGeometry(0.02, 0.04, height, 8);
            const dripMaterial = new THREE.MeshStandardMaterial({
                color: 0xf4e4c1,
                roughness: 0.6,
                metalness: 0.1,
                transparent: true,
                opacity: 0.9
            });
            const drip = new THREE.Mesh(dripGeometry, dripMaterial);

            drip.position.x = Math.cos(angle) * 0.32;
            drip.position.z = Math.sin(angle) * 0.32;
            drip.position.y = 0.7 - height / 2;
            drip.rotation.z = (Math.random() - 0.5) * 0.3;

            group.add(drip);
        }
    }

    createFlameParticles(group) {
        // Create particle system for flame
        const particleCount = 50;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Initial positions in a small area
            positions[i * 3] = (Math.random() - 0.5) * 0.1;
            positions[i * 3 + 1] = Math.random() * 0.4;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

            // Gradient from yellow to red to transparent
            const t = Math.random();
            if (t < 0.3) {
                colors[i * 3] = 1.0;     // R
                colors[i * 3 + 1] = 1.0; // G
                colors[i * 3 + 2] = 0.3; // B (yellow)
            } else if (t < 0.7) {
                colors[i * 3] = 1.0;     // R
                colors[i * 3 + 1] = 0.5; // G
                colors[i * 3 + 2] = 0.0; // B (orange)
            } else {
                colors[i * 3] = 1.0;     // R
                colors[i * 3 + 1] = 0.2; // G
                colors[i * 3 + 2] = 0.0; // B (red)
            }

            sizes[i] = Math.random() * 0.15 + 0.05;

            // Store velocities
            this.particleVelocities.push({
                x: (Math.random() - 0.5) * 0.1,
                y: 0.3 + Math.random() * 0.2,
                z: (Math.random() - 0.5) * 0.1,
                life: Math.random()
            });
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.flameParticles = new THREE.Points(geometry, material);
        this.flameParticles.position.y = 1.2;
        group.add(this.flameParticles);
    }

    createSmokeParticles() {
        // Create smoke particles when extinguished
        const particleCount = 30;
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 0.1;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
            sizes[i] = Math.random() * 0.1 + 0.05;

            this.smokeVelocities.push({
                x: (Math.random() - 0.5) * 0.05,
                y: 0.2 + Math.random() * 0.1,
                z: (Math.random() - 0.5) * 0.05,
                life: 1.0
            });
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.2,
            color: 0x888888,
            transparent: true,
            opacity: 0.3,
            depthWrite: false
        });

        this.smokeParticles = new THREE.Points(geometry, material);
        this.smokeParticles.position.copy(this.flameParticles.position);
        this.candleGroup.add(this.smokeParticles);
    }


    update(windForce, deltaTime) {
        if (this.isExtinguished) {
            // Update smoke particles
            if (this.smokeParticles) {
                const positions = this.smokeParticles.geometry.attributes.position.array;
                const sizes = this.smokeParticles.geometry.attributes.size.array;

                for (let i = 0; i < this.smokeVelocities.length; i++) {
                    const vel = this.smokeVelocities[i];

                    positions[i * 3] += vel.x * deltaTime;
                    positions[i * 3 + 1] += vel.y * deltaTime;
                    positions[i * 3 + 2] += vel.z * deltaTime;

                    sizes[i] += deltaTime * 0.1;
                    vel.life -= deltaTime * 0.5;
                }

                this.smokeParticles.geometry.attributes.position.needsUpdate = true;
                this.smokeParticles.geometry.attributes.size.needsUpdate = true;
                this.smokeParticles.material.opacity = Math.max(0, this.smokeVelocities[0]?.life || 0) * 0.3;
            }
            return;
        }

        // Animate flame particles
        const positions = this.flameParticles.geometry.attributes.position.array;
        const sizes = this.flameParticles.geometry.attributes.size.array;

        for (let i = 0; i < this.particleVelocities.length; i++) {
            const vel = this.particleVelocities[i];

            // Update position
            positions[i * 3] += vel.x * deltaTime;
            positions[i * 3 + 1] += vel.y * deltaTime;
            positions[i * 3 + 2] += vel.z * deltaTime;

            // Apply stronger wind force for more visible effect
            const windEffect = windForce / 100;
            positions[i * 3] += windEffect * deltaTime * 1.5; // Increased from 0.5 to 1.5

            // Add vertical compression when wind is strong
            if (windForce > 30) {
                positions[i * 3 + 1] -= windEffect * deltaTime * 0.3;
            }

            // Reset particles that go too high or too far
            if (positions[i * 3 + 1] > 0.5 || Math.abs(positions[i * 3]) > 0.4) {
                positions[i * 3] = (Math.random() - 0.5) * 0.1;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
            }

            // Animate size - smaller when blown
            const time = Date.now() * 0.001;
            const baseSize = (Math.random() * 0.15 + 0.05) * (1 + Math.sin(time + i) * 0.2);
            sizes[i] = baseSize * (1 - windEffect * 0.4);
        }

        this.flameParticles.geometry.attributes.position.needsUpdate = true;
        this.flameParticles.geometry.attributes.size.needsUpdate = true;

        // Stronger tilt of flame with wind
        const bendAmount = windForce / 100;
        this.flameParticles.rotation.z = bendAmount * 0.8; // Increased from 0.3 to 0.8

        // More dramatic light intensity reduction
        this.flameLight.intensity = 3 - (bendAmount * 2.5); // Increased from 2 to 2.5
        this.warmLight.intensity = 1.5 - (bendAmount * 1.3); // Increased from 1 to 1.3

        // Add light flickering when wind is strong
        if (windForce > 40) {
            const flicker = Math.random() * 0.5;
            this.flameLight.intensity -= flicker;
            this.warmLight.intensity -= flicker * 0.5;
        }

        // Accumulate strong wind
        if (windForce > this.extinguishThreshold) {
            this.blowAccumulator += deltaTime;

            if (this.blowAccumulator > 0.5) {
                this.extinguish();
            }
        } else {
            this.blowAccumulator = Math.max(0, this.blowAccumulator - deltaTime * 2);
        }
    }

    extinguish() {
        this.isExtinguished = true;

        // Hide flame particles
        this.flameParticles.visible = false;

        // Create smoke
        this.createSmokeParticles();

        // Fade out lights
        const fadeOut = () => {
            this.flameLight.intensity -= 0.15;
            this.warmLight.intensity -= 0.1;

            if (this.flameLight.intensity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                this.flameLight.intensity = 0;
                this.warmLight.intensity = 0;

                setTimeout(() => this.reset(), 2000);
            }
        };
        fadeOut();
    }

    reset() {
        this.isExtinguished = false;
        this.blowAccumulator = 0;

        // Reset flame
        this.flameParticles.visible = true;
        this.flameParticles.rotation.z = 0;
        this.flameLight.intensity = 3;
        this.warmLight.intensity = 1.5;

        // Remove smoke
        if (this.smokeParticles) {
            this.candleGroup.remove(this.smokeParticles);
            this.smokeParticles = null;
            this.smokeVelocities = [];
        }

        // Reset particle positions
        const positions = this.flameParticles.geometry.attributes.position.array;
        for (let i = 0; i < this.particleVelocities.length; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 0.1;
            positions[i * 3 + 1] = Math.random() * 0.4;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
        }
        this.flameParticles.geometry.attributes.position.needsUpdate = true;
    }

    dispose() {
        if (this.candleGroup) {
            this.scene.remove(this.candleGroup);
        }
    }
}

window.CandleMode = CandleMode;

