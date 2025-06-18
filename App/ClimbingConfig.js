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