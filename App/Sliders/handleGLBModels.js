// Removed static Three.js imports to prevent duplication warnings
// import { Box3, Vector3, AnimationMixer, FrontSide } from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// Dynamic loader initialization
let loader = null;
let isLoaderInitialized = false;

// Initialize loaders dynamically
async function initializeLoaders() {
  if (!isLoaderInitialized) {
    const [
      { GLTFLoader },
      { DRACOLoader }
    ] = await Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader'),
      import('three/examples/jsm/loaders/DRACOLoader')
    ]);
    
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    isLoaderInitialized = true;
  }
  return loader;
}

// Material cache to reuse materials and reduce memory
const materialCache = new Map();

// Optimized material creation with caching
async function getOptimizedMaterial(color, roughness, metalness) {
  const key = `${color}_${roughness}_${metalness}`;
  
  if (!materialCache.has(key)) {
    const threeModule = window.THREE || await import('three');
    const { MeshStandardMaterial, FrontSide } = threeModule;
    
    const material = new MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness,
      side: FrontSide
    });
    materialCache.set(key, material);
    console.log(`🔥 Created cached material: ${key}`);
  }
  
  return materialCache.get(key);
}

// the 3D Avatar
export async function addGLBToTile(tileGroup, glbPath, index, mixers, animationName, scaleFactor, visible = true) {
  const loader = await initializeLoaders();
  const threeModule = window.THREE || await import('three');
  const { Box3, Vector3, AnimationMixer } = threeModule;
  
  loader.load(glbPath, async (gltf) => {

    const model = gltf.scene;
    model.visible = visible;
    model.userData.isGLBModel = true;

    const box = new Box3().setFromObject(model);
    const size = new Vector3();
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
    const mixer = new AnimationMixer(model);
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
  const loader = await initializeLoaders();
  const threeModule = window.THREE || await import('three');
  const { Box3, Vector3 } = threeModule;
  
  loader.load(glbPath, async (gltf) => {
    const model = gltf.scene;

    const box = new Box3().setFromObject(model);
    const size = new Vector3();
    box.getSize(size);
    const newScaleFactor = scaleFactor * 4.0;
    model.scale.set(newScaleFactor, newScaleFactor, newScaleFactor);
    model.position.y -= 900;

    // Use cached material for landscape
    const landscapeMaterial = await getOptimizedMaterial(0x666666, 0.9, 0.05);

    model.traverse((child) => {
      if (child.isMesh) {
        child.userData.isSelectedForBloom = true;
        
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