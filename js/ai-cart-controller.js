export class AiCartController {
    constructor(scene, trackPath, startPosition, cartColor) {
        this.scene = scene;
        this.trackPath = trackPath;
        
        this.cart = null;
        this.speed = 0;
        this.maxSpeed = 25 + Math.random() * 5; // Slightly varied max speed
        this.acceleration = 0.15 + Math.random() * 0.1;
        this.deceleration = 0.1;
        this.turnSpeed = 0.04 + Math.random() * 0.02;
        this.brakingPower = 0.3;
        
        this.position = new THREE.Vector3(
            startPosition.x || 0, 
            startPosition.y || 0.5, 
            startPosition.z || 0
        );
        this.rotation = 0;
        this.velocity = new THREE.Vector3();
        
        this.pathIndex = 0;
        this.pathTarget = null;
        this.lookAheadDistance = 15 + Math.random() * 5; // How far ahead AI looks on path
        this.isGrounded = true;
        this.cartColor = cartColor || 0xFF0000;
        this.checkpointsPassed = new Set();
        
        this.init();
    }
    
    init() {
        // Create cart model
        this.createCartModel();
        
        // Add cart to scene
        this.scene.add(this.cart);
        
        // Get initial path target
        this.updatePathTarget();
    }
    
    createCartModel() {
        // Create a cart similar to the player's but with different color
        this.cart = new THREE.Group();
        
        // Cart base
        const baseGeometry = new THREE.BoxGeometry(1, 0.25, 2);
        const baseMaterial = new THREE.MeshPhongMaterial({ color: this.cartColor });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.25;
        base.castShadow = true;
        this.cart.add(base);
        
        // Cart body
        const bodyGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.2);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: this.cartColor });
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
    
    updatePathTarget() {
        // Get points from the track path
        const pathPoints = this.trackPath.getSpacedPoints(100);
        
        // Find the closest point on the path
        let minDist = Infinity;
        let closestIndex = 0;
        
        for (let i = 0; i < pathPoints.length; i++) {
            const pathPoint = pathPoints[i];
            const distance = this.position.distanceTo(
                new THREE.Vector3(pathPoint.x, 0, pathPoint.y)
            );
            
            if (distance < minDist) {
                minDist = distance;
                closestIndex = i;
            }
        }
        
        // Look ahead on the path
        this.pathIndex = (closestIndex + Math.floor(this.lookAheadDistance)) % pathPoints.length;
        
        // Get the target point
        const targetPoint = pathPoints[this.pathIndex];
        this.pathTarget = new THREE.Vector3(targetPoint.x, 0, targetPoint.y);
    }
    
    steerTowardTarget() {
        // Get direction to target
        const targetDirection = new THREE.Vector2(
            this.pathTarget.x - this.position.x,
            this.pathTarget.z - this.position.z
        ).normalize();
        
        // Current direction
        const currentDirection = new THREE.Vector2(
            Math.sin(this.rotation),
            Math.cos(this.rotation)
        );
        
        // Calculate cross product to determine turn direction
        const cross = currentDirection.cross(targetDirection);
        
        // Apply steering based on how far off course we are
        // and current speed
        const steerFactor = Math.min(Math.abs(cross) * 1.5, 1);
        
        if (cross < 0) {
            this.rotation -= this.turnSpeed * steerFactor * (this.speed / this.maxSpeed);
        } else if (cross > 0) {
            this.rotation += this.turnSpeed * steerFactor * (this.speed / this.maxSpeed);
        }
        
        // Adjust speed based on how much we need to turn
        // Slow down for sharp turns
        const dot = currentDirection.dot(targetDirection);
        const speedFactor = Math.max(0.3, (dot + 1) / 2);
        
        // Accelerate or brake
        if (speedFactor > 0.8 || this.speed < this.maxSpeed * 0.5) {
            this.speed += this.acceleration * speedFactor;
        } else {
            this.speed -= this.brakingPower * (1 - speedFactor);
        }
        
        // Cap speed
        this.speed = Math.min(this.speed, this.maxSpeed * speedFactor);
    }
    
    avoidCollision(otherCarts) {
        // Simple collision avoidance
        for (const otherCart of otherCarts) {
            if (otherCart === this) continue;
            
            // Get distance to other cart
            const distance = this.position.distanceTo(otherCart.position);
            
            if (distance < 3) { // If within collision range
                // Get direction to other cart
                const avoidDirection = new THREE.Vector2(
                    this.position.x - otherCart.position.x,
                    this.position.z - otherCart.position.z
                ).normalize();
                
                // Current direction
                const currentDirection = new THREE.Vector2(
                    Math.sin(this.rotation),
                    Math.cos(this.rotation)
                );
                
                // Calculate cross product to determine turn direction
                const cross = currentDirection.cross(avoidDirection);
                
                // Apply stronger steering to avoid collision
                const avoidFactor = 1.5 * (3 - distance) / 3;
                
                if (cross < 0) {
                    this.rotation -= this.turnSpeed * avoidFactor;
                } else {
                    this.rotation += this.turnSpeed * avoidFactor;
                }
                
                // Slow down if very close
                if (distance < 1.5) {
                    this.speed *= 0.9;
                }
            }
        }
    }
    
    updatePhysics(deltaTime, track, otherCarts) {
        // Update path target periodically
        this.updatePathTarget();
        
        // Steering behavior
        this.steerTowardTarget();
        
        // Avoid collisions with other carts
        this.avoidCollision(otherCarts);
        
        // Apply natural deceleration
        if (this.speed > 0) {
            this.speed -= this.deceleration * deltaTime;
        }
        
        // Apply velocity based on rotation and speed
        this.velocity.x = Math.sin(this.rotation) * this.speed * deltaTime;
        this.velocity.z = Math.cos(this.rotation) * this.speed * deltaTime;
        
        // Update position
        this.position.add(this.velocity);
        
        // Simple ground collision
        const groundY = 0.5;
        if (this.position.y < groundY) {
            this.position.y = groundY;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
        
        // Check if we're off track and slow down if so
        const isOnTrack = track.isPointOnTrack(this.position.x, this.position.z);
        if (!isOnTrack) {
            this.speed *= 0.9;
        }
        
        // Update cart model position and rotation
        this.cart.position.copy(this.position);
        this.cart.rotation.y = this.rotation;
        
        // Check for checkpoints
        this.checkCheckpoints(track);
    }
    
    checkCheckpoints(track) {
        for (let i = 0; i < track.checkpoints.length; i++) {
            const checkpoint = track.checkpoints[i];
            
            // Check if passing this checkpoint
            if (!this.checkpointsPassed.has(i) && 
                checkpoint.isPointInCheckpoint(this.position.x, this.position.z)) {
                this.checkpointsPassed.add(i);
            }
        }
        
        // Check for lap completion
        if (track.isPointOnFinishLine(this.position.x, this.position.z) && 
            this.checkpointsPassed.size === track.checkpoints.length) {
            this.checkpointsPassed.clear();
        }
    }
    
    update(deltaTime, track, otherCarts) {
        this.updatePhysics(deltaTime, track, otherCarts);
    }
}
