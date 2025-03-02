export class TrackBuilder {
    constructor(scene) {
        this.scene = scene;
    }
    
    buildTrack() {
        // Create a group to hold all track elements
        const track = new THREE.Group();
        
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x88AA55, 
            side: THREE.DoubleSide 
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        track.add(ground);
        
        // Track path
        const trackPath = this.createTrackPath();
        track.add(trackPath.mesh);
        
        // Create start/finish line
        const startLine = this.createStartLine();
        track.add(startLine);
        
        // Add checkpoints
        const checkpoints = this.createCheckpoints();
        checkpoints.forEach(checkpoint => track.add(checkpoint.mesh));
        
        // Create some scenery
        this.addScenery(track);
        
        // Add track to scene
        this.scene.add(track);
        
        // Return track information for collision detection
        return {
            mesh: track,
            path: trackPath.path,
            width: trackPath.width,
            checkpoints: checkpoints,
            isPointOnTrack: (x, z) => this.isPointOnTrack(x, z, trackPath),
            isPointOnFinishLine: (x, z) => this.isPointOnFinishLine(x, z)
        };
    }
    
    createTrackPath() {
        // Define track shape as a series of points
        const trackPoints = [
            new THREE.Vector2(0, -10),
            new THREE.Vector2(15, -15),
            new THREE.Vector2(20, 0),
            new THREE.Vector2(10, 10),
            new THREE.Vector2(-5, 15),
            new THREE.Vector2(-15, 5),
            new THREE.Vector2(-10, -5)
        ];
        
        // Close the loop
        trackPoints.push(trackPoints[0].clone());
        
        // Create a smooth path
        const path = new THREE.Path(trackPoints);
        
        // Create the track
        const trackWidth = 5;
        const trackGeometry = new THREE.BufferGeometry().setFromPoints(
            path.getSpacedPoints(100)
        );
        
        // Create a tube geometry around the path
        const tubeGeometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(
                path.getSpacedPoints(100).map(p => new THREE.Vector3(p.x, 0, p.y))
            ),
            100,
            trackWidth / 2,
            16,
            true
        );
        
        const trackMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const track = new THREE.Mesh(tubeGeometry, trackMaterial);
        track.rotation.x = Math.PI / 2;
        track.position.y = 0.01; // Slightly above ground to prevent z-fighting
        track.receiveShadow = true;
        
        return {
            mesh: track,
            path: path,
            width: trackWidth
        };
    }
    
    createStartLine() {
        const startLineGeometry = new THREE.PlaneGeometry(5, 1);
        const startLineMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            side: THREE.DoubleSide
        });
        
        const startLine = new THREE.Mesh(startLineGeometry, startLineMaterial);
        startLine.rotation.x = -Math.PI / 2;
        startLine.position.y = 0.02; // Slightly above track
        startLine.position.z = -10; // Place on the track
        startLine.receiveShadow = true;
        
        return startLine;
    }
    
    createCheckpoints() {
        const checkpointPositions = [
            { x: 15, z: -15 },
            { x: 20, z: 0 },
            { x: 0, z: 15 },
            { x: -15, z: 5 }
        ];
        
        const checkpoints = checkpointPositions.map((pos, index) => {
            const width = 5;
            const checkpointGeometry = new THREE.PlaneGeometry(width, 0.5);
            const checkpointMaterial = new THREE.MeshPhongMaterial({
                color: 0x00FF00,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            
            const checkpoint = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
            checkpoint.rotation.x = -Math.PI / 2;
            checkpoint.position.set(pos.x, 0.03, pos.z);
            
            return {
                mesh: checkpoint,
                position: pos,
                width: width,
                isPointInCheckpoint: (x, z) => {
                    // Simple AABB collision check
                    return Math.abs(x - pos.x) < width / 2 && 
                           Math.abs(z - pos.z) < 1;
                }
            };
        });
        
        return checkpoints;
    }
    
    addScenery(track) {
        // Add some trees
        const treePositions = [
            {x: 10, z: -20},
            {x: 20, z: -10},
            {x: 30, z: 0},
            {x: 20, z: 15},
            {x: 0, z: 25},
            {x: -20, z: 15},
            {x: -25, z: -5},
            {x: -15, z: -20}
        ];
        
        treePositions.forEach(pos => {
            const tree = this.createTree();
            tree.position.set(pos.x, 0, pos.z);
            track.add(tree);
        });
    }
    
    createTree() {
        const tree = new THREE.Group();
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 2, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({color: 0x8B4513});
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1;
        trunk.castShadow = true;
        tree.add(trunk);
        
        // Tree top
        const topGeometry = new THREE.ConeGeometry(2, 4, 8);
        const topMaterial = new THREE.MeshPhongMaterial({color: 0x228B22});
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 4;
        top.castShadow = true;
        tree.add(top);
        
        return tree;
    }
    
    isPointOnTrack(x, z, trackPath) {
        // This is a simplified track collision detection
        // In a real game, you might use raycasting or a physics engine
        
        // Find nearest point on path
        const point = new THREE.Vector2(x, z);
        const pathPoints = trackPath.path.getSpacedPoints(100);
        
        let minDistance = Infinity;
        for (const pathPoint of pathPoints) {
            const distance = point.distanceTo(new THREE.Vector2(pathPoint.x, pathPoint.y));
            minDistance = Math.min(minDistance, distance);
        }
        
        // If we're within track width, we're on the track
        return minDistance < (trackPath.width / 2 + 0.5); // 0.5 is a margin of error
    }
    
    isPointOnFinishLine(x, z) {
        // Start line is at x=0, z=-10 with width 5
        return Math.abs(x) < 2.5 && Math.abs(z - (-10)) < 0.5;
    }
}
