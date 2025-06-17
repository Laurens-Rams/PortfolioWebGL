import {
  Group,
  PlaneGeometry,
  MeshStandardMaterial,
  Mesh,
  CircleGeometry,
  Vector3,
  Color,
  DoubleSide,
  InstancedMesh,
  Matrix4,
} from 'three';

// Global climbing configuration
export const CLIMBING_CONFIG = {
  CAMERA_START_Y: -2000,    // Camera starting position
  CAMERA_END_Y: 500,        // Camera ending position  
  WALL_HEIGHT: 2850,        // Reduced wall height for better proportions
  WALL_WIDTH: 1500,
  WALL_Z: -1200,
  
  // Calculated values - Wall extends below camera start for better coverage
  get CLIMB_DISTANCE() { return this.CAMERA_END_Y - this.CAMERA_START_Y; }, // 2500 units total
  get WALL_BOTTOM_Y() { return this.CAMERA_START_Y - 500; }, // Wall bottom 500 units below camera start (-2500)
  get WALL_TOP_Y() { return this.WALL_BOTTOM_Y + this.WALL_HEIGHT; }, // Wall top at bottom + height (500)
  get WALL_CENTER_Y() { return this.WALL_BOTTOM_Y + (this.WALL_HEIGHT / 2); } // Wall center calculated from bottom
};

export default class ClimbingWall extends Group {
  constructor() {
    super();
    
    this.wallHeight = CLIMBING_CONFIG.WALL_HEIGHT;
    this.wallWidth = CLIMBING_CONFIG.WALL_WIDTH;
    this.scrollOffset = 0;
    
    this._createWall();
    this._createDotGrid();
    this._createHolds();
    
    // Position wall so bottom edge is exactly at camera start position
    this.position.set(0, CLIMBING_CONFIG.WALL_CENTER_Y, CLIMBING_CONFIG.WALL_Z);
    this.rotation.set(0, 0, 0);
    
    console.log('Wall positioned:', {
      center: CLIMBING_CONFIG.WALL_CENTER_Y,
      bottom: CLIMBING_CONFIG.WALL_BOTTOM_Y,
      top: CLIMBING_CONFIG.WALL_TOP_Y,
      height: CLIMBING_CONFIG.WALL_HEIGHT,
      climbDistance: CLIMBING_CONFIG.CLIMB_DISTANCE
    });
  }

  _createWall() {
    // Main wall geometry
    const wallGeometry = new PlaneGeometry(this.wallWidth, this.wallHeight);
    const wallMaterial = new MeshStandardMaterial({
      color: new Color(0x03090C), // Light gray/white
      roughness: 4.0,
      metalness: 1.0,
      side: DoubleSide
    });

    this.wallMesh = new Mesh(wallGeometry, wallMaterial);
    this.add(this.wallMesh);
  }

  _createDotGrid() {
    // Create optimized dot grid using instanced geometry - MASSIVE performance boost!
    const dotGeometry = new CircleGeometry(8, 6); // Reduced segments from 8 to 6
    const dotMaterial = new MeshStandardMaterial({
      color: new Color(0x03090C), // Subtle gray
      roughness: 0.9,
      metalness: 0.8
    });

    const dotsPerWidth = 12; // Reduced from 20 to 12
    const dotsPerHeight = Math.floor((this.wallHeight / this.wallWidth) * dotsPerWidth);
    const totalDots = dotsPerWidth * dotsPerHeight;
    
    // Create instanced mesh - ONE draw call instead of hundreds!
    const instancedDots = new InstancedMesh(dotGeometry, dotMaterial, totalDots);
    
    const spacingX = this.wallWidth / dotsPerWidth;
    const spacingY = this.wallHeight / dotsPerHeight;
    const matrix = new Matrix4();
    
    let instanceIndex = 0;
    for (let x = 0; x < dotsPerWidth; x++) {
      for (let y = 0; y < dotsPerHeight; y++) {
        const posX = (x - dotsPerWidth / 2) * spacingX + spacingX / 2;
        const posY = (y - dotsPerHeight / 2) * spacingY + spacingY / 2;
        const posZ = 1; // Slightly in front of wall
        
        matrix.setPosition(posX, posY, posZ);
        instancedDots.setMatrixAt(instanceIndex, matrix);
        instanceIndex++;
      }
    }
    
    instancedDots.instanceMatrix.needsUpdate = true;
    this.add(instancedDots);
    
    console.log(`🔥 Dot Grid Optimization: ${totalDots} dots in 1 draw call instead of ${totalDots}!`);
  }

  _createHolds() {
    // Create optimized climbing holds using instanced geometry - MASSIVE performance boost!
    const holdGeometry = new CircleGeometry(25, 6); // Reduced segments from 8 to 6
    const holdMaterial = new MeshStandardMaterial({
      color: new Color(0x222222), // Dark gray
      roughness: 0.7,
      metalness: 0.2
    });

    // Outline material for holds
    const outlineMaterial = new MeshStandardMaterial({
      color: new Color(0x000000), // Black outline
      roughness: 0.9,
      metalness: 0.0
    });

    // Calculate total holds needed
    const holdsPerSection = 5; // Reduced from 8 to 5
    const sections = Math.floor(this.wallHeight / 1000); // Every 1000 units instead of 800
    const totalHolds = holdsPerSection * sections;
    
    // Create instanced meshes for holds and outlines
    const instancedHolds = new InstancedMesh(holdGeometry, holdMaterial, totalHolds);
    const outlineGeometry = new CircleGeometry(28, 6); // Reduced segments
    const instancedOutlines = new InstancedMesh(outlineGeometry, outlineMaterial, totalHolds);
    
    const holdMatrix = new Matrix4();
    const outlineMatrix = new Matrix4();
    let instanceIndex = 0;
    
    for (let section = 0; section < sections; section++) {
      for (let i = 0; i < holdsPerSection; i++) {
        // Position holds in a realistic climbing pattern
        const x = (Math.random() - 0.5) * (this.wallWidth * 0.6); // Keep within climbable area
        const y = (section * 1000) + (i * 120) + (Math.random() - 0.5) * 60; // Adjusted spacing
        const z = 2; // In front of wall
        const outlineZ = z - 0.5;
        
        // Set matrices for instanced meshes
        holdMatrix.setPosition(x, y - this.wallHeight / 2, z);
        outlineMatrix.setPosition(x, y - this.wallHeight / 2, outlineZ);
        
        instancedHolds.setMatrixAt(instanceIndex, holdMatrix);
        instancedOutlines.setMatrixAt(instanceIndex, outlineMatrix);
        
        instanceIndex++;
      }
    }
    
    // Update instance matrices
    instancedHolds.instanceMatrix.needsUpdate = true;
    instancedOutlines.instanceMatrix.needsUpdate = true;
    
    this.add(instancedOutlines);
    this.add(instancedHolds);
    
    console.log(`🔥 Holds Optimization: ${totalHolds * 2} holds in 2 draw calls instead of ${totalHolds * 2}!`);
  }

  // Update wall visibility based on scroll - wall never moves, only visibility
  updateScroll(scrollProgress) {
    // Wall stays completely stationary and visible - no fading
    // The stencils sit above the wall naturally
    this.visible = true;
  }

  update(delta) {
    // Any continuous updates can go here
  }

  dispose() {
    // Clean up geometries and materials
    this.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }
} 