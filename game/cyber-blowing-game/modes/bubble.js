// Bubble Mode - Blow bubbles that float away (Enhanced Version)
class BubbleMode {
    constructor(scene) {
        this.scene = scene;
        this.bubbles = [];
        this.maxBubbles = 50;
        this.bubbleSpawnTimer = 0;
        this.bubbleWand = null;
        this.popParticles = [];

        // Create simple environment map for reflections
        this.createEnvironmentMap();
    }

    createEnvironmentMap() {
        // Create a simple gradient cube texture for reflections
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128);
        this.envMap = cubeRenderTarget.texture;
    }

    init() {
        // Create bubble wand with better materials
        const wandGroup = new THREE.Group();

        // Wooden handle with texture-like appearance
        const handleGeometry = new THREE.CylinderGeometry(0.06, 0.05, 1.5, 16);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8,
            metalness: 0.1
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.rotation.z = Math.PI / 2;
        wandGroup.add(handle);

        // Add wood grain details
        for (let i = 0; i < 5; i++) {
            const ringGeometry = new THREE.TorusGeometry(0.055, 0.008, 8, 16);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: 0x654321,
                roughness: 0.9
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.x = -0.6 + i * 0.3;
            ring.rotation.y = Math.PI / 2;
            wandGroup.add(ring);
        }

        // Metal ring with shine
        const ringGeometry = new THREE.TorusGeometry(0.4, 0.04, 16, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0xe0e0e0,
            roughness: 0.2,
            metalness: 0.9
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.x = 0.75;
        wandGroup.add(ring);

        // Add decorative beads on handle
        const beadPositions = [-0.3, 0, 0.3];
        const beadColors = [0xff6b9d, 0x4ecdc4, 0xffe66d];
        beadPositions.forEach((pos, idx) => {
            const beadGeometry = new THREE.SphereGeometry(0.08, 16, 16);
            const beadMaterial = new THREE.MeshStandardMaterial({
                color: beadColors[idx],
                roughness: 0.3,
                metalness: 0.5,
                emissive: beadColors[idx],
                emissiveIntensity: 0.2
            });
            const bead = new THREE.Mesh(beadGeometry, beadMaterial);
            bead.position.x = pos;
            wandGroup.add(bead);
        });

        wandGroup.position.set(-1.2, 0, 0);
        this.scene.add(wandGroup);
        this.bubbleWand = wandGroup;
    }

    update(windForce, deltaTime) {
        // Gentle wand animation
        const time = Date.now() * 0.001;
        this.bubbleWand.rotation.z = Math.sin(time * 0.5) * 0.1;

        // Spawn bubbles based on wind force
        this.bubbleSpawnTimer += deltaTime;
        const spawnRate = windForce > 20 ? 0.08 : 0.25;

        if (this.bubbleSpawnTimer > spawnRate && windForce > 15) {
            this.spawnBubble(windForce);
            this.bubbleSpawnTimer = 0;
        }

        // Update existing bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];

            // Growth animation - bubble grows from small to full size
            bubble.userData.age += deltaTime;
            const growthDuration = 0.8;
            let growthScale = Math.min(1, bubble.userData.age / growthDuration);
            growthScale = 1 - Math.pow(1 - growthScale, 3);

            // Move bubble
            bubble.position.x += bubble.velocity.x * deltaTime;
            bubble.position.y += bubble.velocity.y * deltaTime;
            bubble.position.z += bubble.velocity.z * deltaTime;

            // Apply wind force
            bubble.velocity.x += (windForce / 100) * deltaTime * 2;
            bubble.velocity.y += deltaTime * 0.5;

            // Add wobble effect
            const wobbleTime = Date.now() * 0.003 + bubble.userData.wobbleOffset;
            bubble.position.x += Math.sin(wobbleTime * 2) * deltaTime * 0.1;
            bubble.position.z += Math.cos(wobbleTime * 2) * deltaTime * 0.1;

            // Rotate bubble for shimmer effect
            bubble.rotation.x += deltaTime * bubble.userData.rotSpeed;
            bubble.rotation.y += deltaTime * bubble.userData.rotSpeed * 0.7;

            // Combine growth with slight pulsation
            const pulsation = 1 + Math.sin(wobbleTime) * 0.05;
            bubble.scale.setScalar(growthScale * pulsation);

            // Rainbow color cycling for more vibrant effect
            const hueShift = (time * 0.2 + bubble.userData.hueOffset) % 1;
            const newColor = new THREE.Color().setHSL(hueShift, 0.8, 0.7);
            bubble.children[0].material.color = newColor;

            // Update inner layer with complementary color
            const innerColor = new THREE.Color().setHSL((hueShift + 0.3) % 1, 0.7, 0.8);
            if (bubble.children[1]) {
                bubble.children[1].material.color = innerColor;
            }

            // Update point light color
            if (bubble.userData.light) {
                bubble.userData.light.color = newColor;
            }

            // Fade out as it gets farther
            const distance = bubble.position.length();
            const opacity = Math.max(0, 1 - distance / 10);

            // Update layers with enhanced opacity
            bubble.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = opacity * child.userData.baseOpacity;
                }
            });

            // Pop bubble if it gets too big or random chance
            const shouldPop = distance > 10 || opacity <= 0 || (Math.random() < 0.001 && bubble.userData.age > 2);

            if (shouldPop) {
                // Create pop effect
                if (opacity > 0.1) {
                    this.createPopEffect(bubble.position, newColor);
                }
                this.scene.remove(bubble);
                this.bubbles.splice(i, 1);
            }
        }

        // Update pop particles
        for (let i = this.popParticles.length - 1; i >= 0; i--) {
            const particle = this.popParticles[i];
            particle.userData.life -= deltaTime * 2;

            if (particle.userData.life <= 0) {
                this.scene.remove(particle);
                this.popParticles.splice(i, 1);
            } else {
                particle.material.opacity = particle.userData.life * 0.6;
                particle.scale.multiplyScalar(1 + deltaTime * 2);
            }
        }

        // Limit bubble count
        while (this.bubbles.length > this.maxBubbles) {
            const oldBubble = this.bubbles.shift();
            this.scene.remove(oldBubble);
        }
    }

    createPopEffect(position, color) {
        // Create small sparkle particles when bubble pops
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.02, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.6
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.userData.life = 1.0;

            this.scene.add(particle);
            this.popParticles.push(particle);
        }
    }

    spawnBubble(windForce) {
        // Larger bubble size range (2x bigger)
        const size = 0.25 + Math.random() * 0.25; // 0.25 to 0.5
        const bubbleGroup = new THREE.Group();

        // Outer bubble layer (iridescent effect) with enhanced visibility
        const outerGeometry = new THREE.SphereGeometry(size, 32, 32);

        // Create rainbow-like iridescent material
        const hue = Math.random();
        const color = new THREE.Color().setHSL(hue, 0.8, 0.7);

        const outerMaterial = new THREE.MeshPhysicalMaterial({
            color: color,
            transparent: true,
            opacity: 0.5, // Increased from 0.3 for better visibility
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.9,
            thickness: 0.5,
            envMapIntensity: 1.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide
        });

        const outerBubble = new THREE.Mesh(outerGeometry, outerMaterial);
        outerBubble.userData.baseOpacity = 0.5; // Increased
        bubbleGroup.add(outerBubble);

        // Inner reflection layer with better visibility
        const innerGeometry = new THREE.SphereGeometry(size * 0.95, 32, 32);
        const innerColor = new THREE.Color().setHSL((hue + 0.3) % 1, 0.7, 0.8);

        const innerMaterial = new THREE.MeshPhysicalMaterial({
            color: innerColor,
            transparent: true,
            opacity: 0.25, // Increased from 0.15
            metalness: 0.2,
            roughness: 0.05,
            side: THREE.BackSide
        });

        const innerBubble = new THREE.Mesh(innerGeometry, innerMaterial);
        innerBubble.userData.baseOpacity = 0.25; // Increased
        bubbleGroup.add(innerBubble);

        // Larger, brighter highlight spot
        const highlightGeometry = new THREE.SphereGeometry(size * 0.35, 16, 16); // Increased from 0.3
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8 // Increased from 0.6
        });
        const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlight.position.set(size * 0.4, size * 0.4, size * 0.4);
        highlight.userData.baseOpacity = 0.8; // Increased
        bubbleGroup.add(highlight);

        // Add point light for glow effect
        const bubbleLight = new THREE.PointLight(color, 0.5, size * 3);
        bubbleLight.position.set(0, 0, 0);
        bubbleGroup.add(bubbleLight);
        bubbleGroup.userData.light = bubbleLight;

        // Start position near wand ring
        bubbleGroup.position.set(-0.5, 0, 0);

        // Start very small for growth animation
        bubbleGroup.scale.setScalar(0.1);

        // Initial velocity
        bubbleGroup.velocity = new THREE.Vector3(
            (windForce / 100) * (0.6 + Math.random() * 0.4),
            0.3 + Math.random() * 0.4,
            (Math.random() - 0.5) * 0.3
        );

        // Random rotation speed, wobble offset, age tracking, and hue offset
        bubbleGroup.userData.rotSpeed = 0.5 + Math.random() * 1.5;
        bubbleGroup.userData.wobbleOffset = Math.random() * Math.PI * 2;
        bubbleGroup.userData.age = 0; // For growth animation
        bubbleGroup.userData.hueOffset = hue; // For color cycling

        this.scene.add(bubbleGroup);
        this.bubbles.push(bubbleGroup);
    }

    reset() {
        // Remove all bubbles
        this.bubbles.forEach(bubble => this.scene.remove(bubble));
        this.bubbles = [];

        // Remove all pop particles
        this.popParticles.forEach(particle => this.scene.remove(particle));
        this.popParticles = [];
    }

    dispose() {
        this.reset();
        if (this.bubbleWand) {
            this.scene.remove(this.bubbleWand);
        }
    }
}

window.BubbleMode = BubbleMode;

