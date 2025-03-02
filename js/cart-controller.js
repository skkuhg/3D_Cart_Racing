export class CartController {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        this.cart = null;
        this.speed = 0;
        this.maxSpeed = 30;
        this.acceleration = 0.2;
        this.deceleration = 0.1;
        this.braking = 0.4;
        this.turnSpeed = 0.05;
        this.gravity = 0.5;
        
        this.position = new THREE.Vector3(0, 0.5, 0);
        this.rotation = 0;
        this.velocity = new THREE.Vector3();
        
        this.isGrounded = true;
        this.keysPressed = {};
        this.checkpointsPassed = new Set();
        this.lapComplete = false;
        
        // Add lap counter
        this.lapCount = 0;
        
        this.init();
    }
    
    init() {
        // Create simple cart model
        this.createCartModel();
        
        // Setup keyboard controls
        window.addEventListener('keydown', (e) => this.keysPressed[e.key] = true);
        window.addEventListener('keyup', (e) => this.keysPressed[e.key] = false);
        
        // Add cart to scene
        this.scene.add(this.cart);
        
        // Set initial position
        this.resetPosition();
    }
    
    createCartModel() {
        // Create a simple cart using primitive geometry
        this.cart = new THREE.Group();
        
        // Cart base
        const baseGeometry = new THREE.BoxGeometry(1, 0.25, 2);
        const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x2288FF });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.25;
        base.castShadow = true;
        this.cart.add(base);
        
        // Cart body
        const bodyGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.2);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x22AAFF });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        this.cart.add(body);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        
        const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel1.position.set(0.6, 0.3, 0.7);
        wheel1.rotation.x = Math.PI / 2;
        wheel1.castShadow = true;
        this.cart.add(wheel1);
        
        const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel2.position.set(-0.6, 0.3, 0.7);
        wheel2.rotation.x = Math.PI / 2;
        wheel2.castShadow = true;
        this.cart.add(wheel2);
        
        const wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel3.position.set(0.6, 0.3, -0.7);
        wheel3.rotation.x = Math.PI / 2;
        wheel3.castShadow = true;
        this.cart.add(wheel3);
        
        const wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel4.position.set(-0.6, 0.3, -0.7);
        wheel4.rotation.x = Math.PI / 2;
        wheel4.castShadow = true;
        this.cart.add(wheel4);
    }
    
    resetPosition() {
        this.position.set(0, 0.5, 0);
        this.rotation = 0;
        this.speed = 0;
        this.velocity.set(0, 0, 0);
        this.checkpointsPassed.clear();
        this.lapComplete = false;
    }
    
    handleInput() {
        // Acceleration
        if (this.keysPressed['ArrowUp']) {
            this.speed += this.acceleration;
        } else if (this.keysPressed['ArrowDown']) {
            this.speed -= this.acceleration;
        } else {
            // Natural deceleration
            if (this.speed > 0) {
                this.speed -= this.deceleration;
            } else if (this.speed < 0) {
                this.speed += this.deceleration;
            }
            
            // Ensure we eventually stop
            if (Math.abs(this.speed) < this.deceleration) {
                this.speed = 0;
            }
        }
        
        // Braking
        if (this.keysPressed[' ']) {
            if (this.speed > 0) {
                this.speed -= this.braking;
            } else if (this.speed < 0) {
                this.speed += this.braking;
            }
        }
        
        // Limit speed
        this.speed = Math.max(Math.min(this.speed, this.maxSpeed), -this.maxSpeed / 2);
        
        // Turning - only when moving
        if (Math.abs(this.speed) > 0.1) {
            if (this.keysPressed['ArrowLeft']) {
                this.rotation += this.turnSpeed * (this.speed / this.maxSpeed);
            }
            if (this.keysPressed['ArrowRight']) {
                this.rotation -= this.turnSpeed * (this.speed / this.maxSpeed);
            }
        }
    }
    
    updatePhysics(deltaTime, track) {
        // Apply velocity based on rotation and speed
        this.velocity.x = Math.sin(this.rotation) * this.speed * deltaTime;
        this.velocity.z = Math.cos(this.rotation) * this.speed * deltaTime;
        
        // Apply gravity if not on ground
        if (!this.isGrounded) {
            this.velocity.y -= this.gravity * deltaTime;
        }
        
        // Update position
        this.position.add(this.velocity);
        
        // Simple ground collision
        const groundY = 0.5; // Half the height of the cart
        if (this.position.y < groundY) {
            this.position.y = groundY;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
        
        // Check for track boundaries
        this.checkTrackCollisions(track);
        
        // Check for checkpoints and lap completion
        this.checkCheckpoints(track);
        
        // Update cart model position and rotation
        this.cart.position.copy(this.position);
        this.cart.rotation.y = this.rotation;
    }
    
    checkTrackCollisions(track) {
        // This is a simplified collision detection
        // In a real game, you'd use raycasting or a physics engine
        
        // Check if we're off the track
        const isOnTrack = track.isPointOnTrack(this.position.x, this.position.z);
        
        if (!isOnTrack) {
            // Slow down significantly when off track
            this.speed *= 0.9;
        }
    }
    
    checkCheckpoints(track) {
        for (let i = 0; i < track.checkpoints.length; i++) {
            const checkpoint = track.checkpoints[i];
            
            // Check if we're passing this checkpoint
            if (!this.checkpointsPassed.has(i) && 
                checkpoint.isPointInCheckpoint(this.position.x, this.position.z)) {
                this.checkpointsPassed.add(i);
            }
        }
        
        // Check if we crossed the finish line and passed all checkpoints
        if (track.isPointOnFinishLine(this.position.x, this.position.z) && 
            this.checkpointsPassed.size === track.checkpoints.length) {
            this.lapComplete = true;
            this.checkpointsPassed.clear();
        }
    }
    
    checkLapComplete() {
        if (this.lapComplete) {
            this.lapComplete = false;
            this.lapCount++;
            return true;
        }
        return false;
    }
    
    updateCamera() {
        // Calculate camera offset based on player's rotation
        const cameraDistance = 5;
        const cameraHeight = 2.5;
        
        const cameraOffset = new THREE.Vector3(
            -Math.sin(this.rotation) * cameraDistance,
            cameraHeight,
            -Math.cos(this.rotation) * cameraDistance
        );
        
        // Position camera behind cart
        this.camera.position.copy(this.position).add(cameraOffset);
        
        // Look at point slightly ahead of cart
        const lookAtPoint = new THREE.Vector3(
            this.position.x + Math.sin(this.rotation),
            this.position.y + 0.5,
            this.position.z + Math.cos(this.rotation)
        );
        
        this.camera.lookAt(lookAtPoint);
    }
    
    update(deltaTime, track) {
        this.handleInput();
        this.updatePhysics(deltaTime, track);
    }
}
