// Dandelion Mode - Blow seeds away (Enhanced Version)
class DandelionMode {
    constructor(scene) {
        this.scene = scene;
        this.dandelion = null;
        this.seeds = [];
        this.stem = null;
        this.seedsRemaining = 0;
        this.leaves = [];
    }

    init() {
        const dandelionGroup = new THREE.Group();

        // Create realistic stem with segments
        const stemCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -0.75, 0),
            new THREE.Vector3(0.02, -0.4, 0),
            new THREE.Vector3(-0.01, -0.1, 0),
            new THREE.Vector3(0, 0.2, 0)
        ]);

        const stemGeometry = new THREE.TubeGeometry(stemCurve, 20, 0.04, 8, false);
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5016,
            roughness: 0.8,
            metalness: 0.1
        });
        this.stem = new THREE.Mesh(stemGeometry, stemMaterial);
        dandelionGroup.add(this.stem);

        // Add leaves at base
        this.createLeaves(dandelionGroup);

        // Create flower base (receptacle)
        const baseGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a7c2c,
            roughness: 0.7
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.2;
        base.scale.y = 0.6;
        dandelionGroup.add(base);

        // Create seed head (more seeds, better distribution)
        const numSeeds = 80;
        const seedRadius = 0.5;

        for (let i = 0; i < numSeeds; i++) {
            // Fibonacci sphere distribution for even spacing
            const phi = Math.acos(1 - 2 * (i + 0.5) / numSeeds);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;

            const x = seedRadius * Math.cos(theta) * Math.sin(phi);
            const y = seedRadius * Math.sin(theta) * Math.sin(phi);
            const z = seedRadius * Math.cos(phi);

            const seed = this.createDetailedSeed();
            seed.position.set(x, y + 0.2, z);

            // Point seed outward
            seed.lookAt(x * 2, y * 2 + 0.2, z * 2);

            seed.userData.attached = true;
            seed.userData.detachThreshold = 10 + Math.random() * 25; // Lowered from 25-75 to 10-35
            seed.userData.originalPosition = new THREE.Vector3(x, y, z);

            dandelionGroup.add(seed);
            this.seeds.push(seed);
        }

        dandelionGroup.position.y = 0.3;
        this.scene.add(dandelionGroup);
        this.dandelion = dandelionGroup;
        this.seedsRemaining = numSeeds;
    }

    createLeaves(group) {
        // Create 4-6 leaves around the base
        const numLeaves = 4 + Math.floor(Math.random() * 3);

        for (let i = 0; i < numLeaves; i++) {
            const angle = (i / numLeaves) * Math.PI * 2 + Math.random() * 0.5;

            // Leaf shape
            const leafShape = new THREE.Shape();
            leafShape.moveTo(0, 0);
            leafShape.quadraticCurveTo(0.1, 0.05, 0.15, 0.1);
            leafShape.quadraticCurveTo(0.12, 0.15, 0.08, 0.2);
            leafShape.quadraticCurveTo(0.05, 0.15, 0.03, 0.1);
            leafShape.quadraticCurveTo(0.05, 0.05, 0, 0);

            const leafGeometry = new THREE.ShapeGeometry(leafShape);
            const leafMaterial = new THREE.MeshStandardMaterial({
                color: 0x3a6b1f,
                roughness: 0.7,
                side: THREE.DoubleSide
            });
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);

            leaf.position.x = Math.cos(angle) * 0.1;
            leaf.position.z = Math.sin(angle) * 0.1;
            leaf.position.y = -0.6;
            leaf.rotation.y = angle;
            leaf.rotation.x = Math.PI / 2 + 0.3;

            group.add(leaf);
            this.leaves.push(leaf);
        }
    }

    createDetailedSeed() {
        const seedGroup = new THREE.Group();

        // Seed body (achene)
        const bodyGeometry = new THREE.CylinderGeometry(0.015, 0.02, 0.06, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b7355,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        seedGroup.add(body);

        // Pappus stem (thin stalk)
        const stemGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.15, 6);
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5f5dc,
            roughness: 0.6
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.z = 0.075;
        stem.rotation.x = Math.PI / 2;
        seedGroup.add(stem);

        // Create parachute (pappus) with more detail
        const numBristles = 16;
        const bristleLength = 0.12;
        const parachuteRadius = 0.1;

        // Create bristles
        for (let i = 0; i < numBristles; i++) {
            const angle = (i / numBristles) * Math.PI * 2;
            const x = Math.cos(angle) * parachuteRadius;
            const y = Math.sin(angle) * parachuteRadius;

            const bristleGeometry = new THREE.BufferGeometry();
            const bristlePositions = new Float32Array([
                0, 0, 0.15,
                x, y, 0.15 + bristleLength
            ]);
            bristleGeometry.setAttribute('position',
                new THREE.BufferAttribute(bristlePositions, 3));

            const bristleMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7
            });
            const bristle = new THREE.Line(bristleGeometry, bristleMaterial);
            seedGroup.add(bristle);
        }

        // Parachute disk (umbrella top)
        const diskGeometry = new THREE.CircleGeometry(parachuteRadius, 16);
        const diskMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            roughness: 0.8
        });
        const disk = new THREE.Mesh(diskGeometry, diskMaterial);
        disk.position.z = 0.15 + bristleLength;
        seedGroup.add(disk);

        // Add tiny hairs on parachute for detail
        const hairCount = 8;
        for (let i = 0; i < hairCount; i++) {
            const hairAngle = (i / hairCount) * Math.PI * 2;
            const hairRadius = parachuteRadius * 0.5;
            const hairGeometry = new THREE.CylinderGeometry(0.001, 0.001, 0.03, 4);
            const hairMaterial = new THREE.MeshBasicMaterial({
                color: 0xeeeeee,
                transparent: true,
                opacity: 0.5
            });
            const hair = new THREE.Mesh(hairGeometry, hairMaterial);
            hair.position.x = Math.cos(hairAngle) * hairRadius;
            hair.position.y = Math.sin(hairAngle) * hairRadius;
            hair.position.z = 0.15 + bristleLength;
            seedGroup.add(hair);
        }

        return seedGroup;
    }

    update(windForce, deltaTime) {
        // Gentle sway of stem and remaining seeds
        const time = Date.now() * 0.001;
        const swayAmount = (windForce / 100) * 0.15;
        this.dandelion.rotation.z = Math.sin(time * 0.8) * swayAmount;
        this.dandelion.rotation.x = Math.cos(time * 0.6) * swayAmount * 0.5;

        // Animate leaves
        this.leaves.forEach((leaf, index) => {
            const leafTime = time + index * 0.5;
            leaf.rotation.z = Math.sin(leafTime) * 0.1;
        });

        // Check for seed detachment and update flying seeds
        this.seeds.forEach(seed => {
            if (seed.userData.attached) {
                // Gentle pre-detachment movement
                if (windForce > seed.userData.detachThreshold * 0.7) {
                    const wobble = Math.sin(time * 5 + seed.userData.detachThreshold) * 0.02;
                    seed.rotation.x += wobble;
                    seed.rotation.y += wobble * 0.5;
                }

                // Detach if wind is strong enough
                if (windForce > seed.userData.detachThreshold) {
                    this.detachSeed(seed, windForce);
                }
            } else {
                // Update flying seed
                seed.position.x += seed.userData.velocity.x * deltaTime;
                seed.position.y += seed.userData.velocity.y * deltaTime;
                seed.position.z += seed.userData.velocity.z * deltaTime;

                // Apply wind force
                seed.userData.velocity.x += (windForce / 100) * deltaTime * 1.2;
                seed.userData.velocity.y += deltaTime * 0.4; // Float upward

                // Gentle spinning
                seed.rotation.y += deltaTime * 3;
                seed.rotation.x += deltaTime * 0.5;

                // Wobble in flight
                const wobbleTime = time * 2 + seed.userData.wobbleOffset;
                seed.position.x += Math.sin(wobbleTime) * deltaTime * 0.1;
                seed.position.z += Math.cos(wobbleTime) * deltaTime * 0.1;

                // Fade out
                const distance = seed.position.length();
                seed.traverse(child => {
                    if (child.material && child.material.transparent) {
                        child.material.opacity = Math.max(0, 1 - distance / 10) * child.userData.baseOpacity;
                    }
                });

                // Remove if too far
                if (distance > 10) {
                    seed.visible = false;
                }
            }
        });

        // Reset if all seeds are gone
        if (this.seedsRemaining === 0) {
            setTimeout(() => this.reset(), 2500);
        }
    }

    detachSeed(seed, windForce) {
        seed.userData.attached = false;
        this.seedsRemaining--;

        // Store base opacity for all materials
        seed.traverse(child => {
            if (child.material) {
                child.userData.baseOpacity = child.material.opacity || 1.0;
                if (!child.material.transparent) {
                    child.material.transparent = true;
                }
            }
        });

        // Convert local position to world position
        const worldPos = new THREE.Vector3();
        seed.getWorldPosition(worldPos);

        // Remove from dandelion group
        this.dandelion.remove(seed);
        this.scene.add(seed);
        seed.position.copy(worldPos);

        // Set initial velocity based on wind and position
        const direction = seed.userData.originalPosition.clone().normalize();
        seed.userData.velocity = new THREE.Vector3(
            direction.x * 0.3 + (windForce / 100) * 0.5,
            direction.y * 0.2 + Math.random() * 0.3,
            direction.z * 0.3 + (Math.random() - 0.5) * 0.2
        );

        seed.userData.wobbleOffset = Math.random() * Math.PI * 2;
    }

    reset() {
        // Remove all flying seeds
        this.seeds.forEach(seed => {
            if (!seed.userData.attached) {
                this.scene.remove(seed);
            }
        });

        // Recreate dandelion
        if (this.dandelion) {
            this.scene.remove(this.dandelion);
        }
        this.seeds = [];
        this.leaves = [];
        this.init();
    }

    dispose() {
        this.seeds.forEach(seed => {
            if (seed.parent === this.scene) {
                this.scene.remove(seed);
            }
        });
        if (this.dandelion) {
            this.scene.remove(this.dandelion);
        }
    }
}

window.DandelionMode = DandelionMode;
