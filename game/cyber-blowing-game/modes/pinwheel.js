// Pinwheel Mode - Spin the pinwheel with wind (Enhanced Version)
class PinwheelMode {
    constructor(scene) {
        this.scene = scene;
        this.pinwheel = null;
        this.rotationSpeed = 0;
        this.targetSpeed = 0;
        this.blades = [];
    }

    init() {
        const pinwheelGroup = new THREE.Group();

        // Create center hub with metallic finish
        const hubGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 32);
        const hubMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0xffaa00,
            emissiveIntensity: 0.1
        });
        const hub = new THREE.Mesh(hubGeometry, hubMaterial);
        hub.rotation.x = Math.PI / 2;
        pinwheelGroup.add(hub);

        // Add decorative center gem
        const gemGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const gemMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xff1493,
            metalness: 0.3,
            roughness: 0.1,
            transmission: 0.5,
            thickness: 0.3,
            clearcoat: 1.0
        });
        const gem = new THREE.Mesh(gemGeometry, gemMaterial);
        gem.position.z = 0.08;
        hub.add(gem);

        // Create 6 blades with gradient colors and 3D depth
        const bladeColors = [
            { base: 0xff6b9d, light: 0xffb3d9 },  // Pink
            { base: 0x4ecdc4, light: 0x95e1d3 },  // Teal
            { base: 0xffe66d, light: 0xfff4b3 },  // Yellow
            { base: 0xa8e6cf, light: 0xdcedc8 },  // Mint
            { base: 0xff8b94, light: 0xffc3c7 },  // Coral
            { base: 0xc7ceea, light: 0xe8ecf7 }   // Lavender
        ];
        const numBlades = 6;

        for (let i = 0; i < numBlades; i++) {
            const angle = (i / numBlades) * Math.PI * 2;
            const bladeGroup = new THREE.Group();

            // Create blade shape with curves
            const bladeShape = new THREE.Shape();
            bladeShape.moveTo(0, 0);
            bladeShape.quadraticCurveTo(0.4, -0.15, 0.9, -0.25);
            bladeShape.quadraticCurveTo(0.95, 0, 0.9, 0.25);
            bladeShape.quadraticCurveTo(0.4, 0.15, 0, 0);

            // Extrude for 3D effect
            const extrudeSettings = {
                depth: 0.02,
                bevelEnabled: true,
                bevelThickness: 0.01,
                bevelSize: 0.01,
                bevelSegments: 3
            };

            const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);

            // Create gradient-like effect with vertex colors
            const bladeMaterial = new THREE.MeshStandardMaterial({
                color: bladeColors[i].base,
                metalness: 0.3,
                roughness: 0.4,
                side: THREE.DoubleSide,
                emissive: bladeColors[i].base,
                emissiveIntensity: 0.1
            });

            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.userData.baseColor = bladeColors[i].base;
            blade.userData.lightColor = bladeColors[i].light;
            bladeGroup.add(blade);

            // Add light edge highlight
            const edgeShape = new THREE.Shape();
            edgeShape.moveTo(0, 0);
            edgeShape.quadraticCurveTo(0.4, -0.15, 0.9, -0.25);
            edgeShape.quadraticCurveTo(0.95, 0, 0.9, 0.25);

            const edgeGeometry = new THREE.ShapeGeometry(edgeShape);
            const edgeMaterial = new THREE.MeshBasicMaterial({
                color: bladeColors[i].light,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            edge.position.z = 0.025;
            bladeGroup.add(edge);

            // Position and rotate blade
            bladeGroup.rotation.z = angle;
            bladeGroup.position.x = Math.cos(angle) * 0.18;
            bladeGroup.position.y = Math.sin(angle) * 0.18;

            pinwheelGroup.add(bladeGroup);
            this.blades.push(blade);
        }

        // Stick removed - only pinwheel head remains

        // Add point light for glow effect when spinning
        const spinLight = new THREE.PointLight(0xffffff, 0, 3);
        spinLight.position.set(0, 0, 0);
        pinwheelGroup.add(spinLight);
        this.spinLight = spinLight;

        pinwheelGroup.position.set(0, 0, 0);
        this.scene.add(pinwheelGroup);
        this.pinwheel = pinwheelGroup;
    }

    update(windForce, deltaTime) {
        // Calculate target rotation speed based on wind force
        this.targetSpeed = (windForce / 100) * 12; // Max 12 rad/s

        // Smooth acceleration/deceleration
        const acceleration = 6;
        if (this.rotationSpeed < this.targetSpeed) {
            this.rotationSpeed = Math.min(
                this.targetSpeed,
                this.rotationSpeed + acceleration * deltaTime
            );
        } else {
            this.rotationSpeed = Math.max(
                this.targetSpeed,
                this.rotationSpeed - acceleration * deltaTime * 2
            );
        }

        // Apply rotation
        this.pinwheel.rotation.z += this.rotationSpeed * deltaTime;

        // Add slight wobble at high speeds
        if (this.rotationSpeed > 5) {
            const wobble = Math.sin(Date.now() * 0.01) * 0.12;
            this.pinwheel.rotation.x = wobble;
            this.pinwheel.rotation.y = wobble * 0.5;
        } else {
            this.pinwheel.rotation.x = 0;
            this.pinwheel.rotation.y = 0;
        }

        // Update blade colors based on speed (motion blur effect simulation)
        const speedRatio = this.rotationSpeed / 12;
        this.blades.forEach((blade, index) => {
            const emissiveIntensity = speedRatio * 0.3;
            blade.material.emissiveIntensity = emissiveIntensity;

            // Slight color shift when spinning fast
            if (speedRatio > 0.5) {
                const t = speedRatio;
                const baseColor = new THREE.Color(blade.userData.baseColor);
                const lightColor = new THREE.Color(blade.userData.lightColor);
                blade.material.color.lerpColors(baseColor, lightColor, t * 0.5);
            }
        });

        // Add glow effect when spinning fast
        this.spinLight.intensity = speedRatio * 2;
        this.spinLight.color.setHSL((Date.now() * 0.001) % 1, 0.8, 0.6);

        // Gentle floating animation
        const time = Date.now() * 0.001;
        this.pinwheel.position.y = Math.sin(time * 0.5) * 0.05;
    }

    reset() {
        this.rotationSpeed = 0;
        this.targetSpeed = 0;
        if (this.pinwheel) {
            this.pinwheel.rotation.set(0, 0, 0);
            this.pinwheel.position.y = 0;
        }
        this.blades.forEach(blade => {
            blade.material.color.set(blade.userData.baseColor);
            blade.material.emissiveIntensity = 0.1;
        });
        if (this.spinLight) {
            this.spinLight.intensity = 0;
        }
    }

    dispose() {
        if (this.pinwheel) {
            this.scene.remove(this.pinwheel);
        }
    }
}

window.PinwheelMode = PinwheelMode;
