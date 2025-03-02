import { CartController } from './cart-controller.js';
import { AiCartController } from './ai-cart-controller.js';
import { TrackBuilder } from './track-builder.js';
import { GameUI } from './game-ui.js';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        
        this.isGameRunning = false;
        this.lapStartTime = 0;
        this.currentLapTime = 0;
        this.bestLapTime = Infinity;
        
        this.playerCart = null;
        this.aiCarts = [];
        this.allCarts = [];
        
        this.numAiCarts = 3; // Number of AI opponents
        
        this.init();
    }
    
    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        
        // Setup camera
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Create track
        this.trackBuilder = new TrackBuilder(this.scene);
        this.track = this.trackBuilder.buildTrack();
        
        // Create player cart
        this.playerCart = new CartController(this.scene, this.camera);
        
        // Create AI carts
        this.createAiCarts();
        
        // Setup UI
        this.ui = new GameUI();
        
        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        
        // Add all carts to the allCarts array for collision detection
        this.allCarts = [this.playerCart, ...this.aiCarts];
        
        // Start animation loop
        this.animate();
    }
    
    createAiCarts() {
        // AI cart colors
        const cartColors = [0xFF0000, 0x00FF00, 0xFFAA00, 0xFF00FF, 0x00FFFF];
        
        // Starting positions slightly offset
        const startOffsets = [
            { x: -2, y: 0.5, z: -1 },
            { x: 2, y: 0.5, z: -1 },
            { x: -1, y: 0.5, z: -2 },
            { x: 1, y: 0.5, z: -2 },
            { x: 0, y: 0.5, z: -3 }
        ];
        
        for (let i = 0; i < this.numAiCarts; i++) {
            const aiCart = new AiCartController(
                this.scene,
                this.track.path,
                startOffsets[i],
                cartColors[i]
            );
            this.aiCarts.push(aiCart);
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    startGame() {
        document.getElementById('start-screen').style.display = 'none';
        this.isGameRunning = true;
        this.lapStartTime = this.clock.getElapsedTime();
    }
    
    checkLapComplete() {
        if (this.playerCart.checkLapComplete()) {
            const lapTime = this.clock.getElapsedTime() - this.lapStartTime;
            this.lapStartTime = this.clock.getElapsedTime();
            
            if (lapTime < this.bestLapTime) {
                this.bestLapTime = lapTime;
                this.ui.updateBestTime(this.bestLapTime);
            }
            
            return true;
        }
        return false;
    }
    
    checkCartCollisions() {
        // Simple collision detection between carts
        for (let i = 0; i < this.allCarts.length; i++) {
            for (let j = i + 1; j < this.allCarts.length; j++) {
                const cart1 = this.allCarts[i];
                const cart2 = this.allCarts[j];
                
                const distance = cart1.position.distanceTo(cart2.position);
                
                // If carts are close enough to collide
                if (distance < 1.5) {
                    // Get direction vectors
                    const direction1to2 = new THREE.Vector3()
                        .subVectors(cart2.position, cart1.position)
                        .normalize();
                    
                    // Apply impact forces - simple elastic collision
                    const impactForce = 0.5;
                    
                    // Reduce speed based on collision angle
                    const dot1 = Math.sin(cart1.rotation) * direction1to2.x + 
                                Math.cos(cart1.rotation) * direction1to2.z;
                    const dot2 = -Math.sin(cart2.rotation) * direction1to2.x - 
                                Math.cos(cart2.rotation) * direction1to2.z;
                    
                    cart1.speed *= Math.max(0.5, 1 - Math.abs(dot1) * impactForce);
                    cart2.speed *= Math.max(0.5, 1 - Math.abs(dot2) * impactForce);
                    
                    // Push carts away from each other
                    cart1.position.sub(direction1to2.clone().multiplyScalar(0.1));
                    cart2.position.add(direction1to2.clone().multiplyScalar(0.1));
                }
            }
        }
    }
    
    update() {
        const deltaTime = this.clock.getDelta();
        
        if (this.isGameRunning) {
            // Update player cart
            this.playerCart.update(deltaTime, this.track);
            
            // Update AI carts
            for (const aiCart of this.aiCarts) {
                aiCart.update(deltaTime, this.track, this.allCarts);
            }
            
            // Check for collisions between carts
            this.checkCartCollisions();
            
            // Update UI
            this.ui.updateSpeed(this.playerCart.speed);
            
            // Update lap time
            this.currentLapTime = this.clock.getElapsedTime() - this.lapStartTime;
            this.ui.updateLapTime(this.currentLapTime);
            
            // Check if lap completed
            this.checkLapComplete();
            
            // Update camera to follow player cart
            this.playerCart.updateCamera();
            
            // Update race positions
            this.updateRacePositions();
        }
    }
    
    updateRacePositions() {
        // Calculate race positions based on track progress
        // This is a simple implementation - you could improve it with checkpoints
        
        // Get all carts with their progress info
        const cartsWithProgress = this.allCarts.map(cart => {
            // Calculate progress based on checkpoints passed and distance to next checkpoint
            const checkpointsPassed = cart === this.playerCart ? 
                cart.checkpointsPassed.size : cart.checkpointsPassed.size;
                
            // Get current position on track for additional precision
            const trackPoints = this.track.path.getSpacedPoints(100);
            
            // Find closest point on track
            let minDistance = Infinity;
            let closestPointIndex = 0;
            
            for (let i = 0; i < trackPoints.length; i++) {
                const point = trackPoints[i];
                const distance = cart.position.distanceTo(
                    new THREE.Vector3(point.x, 0, point.y)
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPointIndex = i;
                }
            }
            
            // Calculate progress score (checkpoints * 1000 + track position)
            const progressScore = (checkpointsPassed * 1000) + closestPointIndex;
            
            return {
                cart: cart,
                isPlayer: cart === this.playerCart,
                progress: progressScore
            };
        });
        
        // Sort by progress (highest first)
        cartsWithProgress.sort((a, b) => b.progress - a.progress);
        
        // Find player position
        let playerPosition = 1;
        for (let i = 0; i < cartsWithProgress.length; i++) {
            if (cartsWithProgress[i].isPlayer) {
                playerPosition = i + 1;
                break;
            }
        }
        
        // Update UI
        this.ui.updatePosition(playerPosition, this.allCarts.length);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
