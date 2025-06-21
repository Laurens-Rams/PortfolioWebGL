// 🔥 PREVENT THREE.JS DUPLICATION - Use window.THREE set by main app
// Static imports removed to prevent bundling Three.js twice (once by us, once by Spline)

let THREE, GLTFLoader, DRACOLoader;

// Initialize Three.js components from global instance
async function initThreeComponents() {
  if (!window.THREE) {
    console.error('🚨 window.THREE not available - main app should set this before loading');
    return false;
  }
  
  THREE = window.THREE;
  
  // Load loaders dynamically
  const [gltfModule, dracoModule] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader'),
    import('three/examples/jsm/loaders/DRACOLoader')
  ]);
  
  GLTFLoader = gltfModule.GLTFLoader;
  DRACOLoader = dracoModule.DRACOLoader;
  
  return true;
}

// Create GLTF loader after Three.js is available
let loader = null;
let dracoLoader = null;

async function getLoader() {
  if (!loader) {
    const success = await initThreeComponents();
    if (!success) return null;
    
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
  }
  return loader;
}

// Material cache to reuse materials and reduce memory
const materialCache = new Map();

// Optimized material creation with caching
async function getOptimizedMaterial(color, roughness, metalness) {
  if (!THREE) {
    await initThreeComponents();
  }
  
  const key = `${color}_${roughness}_${metalness}`;
  
  if (!materialCache.has(key)) {
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness,
      side: THREE.FrontSide
    });
    materialCache.set(key, material);
    console.log(`🔥 Created cached material: ${key}`);
  }
  
  return materialCache.get(key);
}

// the 3D Avatar
export async function addGLBToTile(tileGroup, glbPath, index, mixers, animationName, scaleFactor, visible = true) {
  const gltfLoader = await getLoader();
  if (!gltfLoader) {
    console.error('🚨 Could not initialize GLTF loader');
    return;
  }

  gltfLoader.load(glbPath, async (gltf) => {
    const model = gltf.scene;
    model.visible = visible;
    model.userData.isGLBModel = true;

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);
    model.position.y -= 850;

    // Clean material properties without stencil - USE CACHED MATERIALS
    const sharedMaterial = await getOptimizedMaterial(0x999999, 0.8, 0.1);
    let meshCount = 0;
    
    model.traverse((child) => {
      if (child.isMesh) {
        // Use shared material for better performance
        child.material = sharedMaterial;
        child.matrixAutoUpdate = false;
        
        // Optimize geometry
        if (child.geometry) {
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
        }
        
        meshCount++;
      }
    });
    
    console.log(`🔥 GLB Model Optimized: ${meshCount} meshes using 1 shared material`);

    // animations
    const mixer = new THREE.AnimationMixer(model);
    const clip = gltf.animations.find(clip => clip.name === animationName);
    if (clip) {
      const action = mixer.clipAction(clip);
      action.play();
    } 

    mixers.push(mixer);
    tileGroup.add(model);
  });
}

// the landscape
export async function addGLBToTileNoAnimation(tileGroup, glbPath, index, scaleFactor) {
  const gltfLoader = await getLoader();
  if (!gltfLoader) {
    console.error('🚨 Could not initialize GLTF loader');
    return;
  }

  gltfLoader.load(glbPath, async (gltf) => {
    const model = gltf.scene;

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const newScaleFactor = scaleFactor * 4.0;
    model.scale.set(newScaleFactor, newScaleFactor, newScaleFactor);
    model.position.y -= 900;

    model.traverse(async (child) => {
      if (child.isMesh) {
        child.userData.isSelectedForBloom = true;
        
        // Use cached material for landscape
        const landscapeMaterial = await getOptimizedMaterial(0x666666, 0.9, 0.05);
        child.material = landscapeMaterial;
        child.matrixAutoUpdate = false;
        
        // Optimize geometry
        if (child.geometry) {
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
        }
      }
    });

    console.log('🔥 Landscape Model Optimized with cached materials');
    tileGroup.add(model);
  });
}