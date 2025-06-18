import { Box3, Vector3, AnimationMixer, FrontSide } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// Create GLTF loader directly
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Material cache to reuse materials and reduce memory
const materialCache = new Map();

// Optimized material creation with caching
function getOptimizedMaterial(color, roughness, metalness) {
  const key = `${color}_${roughness}_${metalness}`;
  
  if (!materialCache.has(key)) {
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
export function addGLBToTile(tileGroup, glbPath, index, mixers, animationName, scaleFactor, visible = true) {
  loader.load(glbPath, (gltf) => {

    const model = gltf.scene;
    model.visible = visible;
    model.userData.isGLBModel = true;

    const box = new Box3().setFromObject(model);
    const size = new Vector3();
    box.getSize(size);
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);
    model.position.y -= 850;

    // Clean material properties without stencil - USE CACHED MATERIALS
    const sharedMaterial = getOptimizedMaterial(0x999999, 0.8, 0.1);
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
export function addGLBToTileNoAnimation(tileGroup, glbPath, index, scaleFactor) {
  loader.load(glbPath, (gltf) => {
    const model = gltf.scene;

    const box = new Box3().setFromObject(model);
    const size = new Vector3();
    box.getSize(size);
    const newScaleFactor = scaleFactor * 4.0;
    model.scale.set(newScaleFactor, newScaleFactor, newScaleFactor);
    model.position.y -= 900;

    model.traverse((child) => {
      if (child.isMesh) {
        child.userData.isSelectedForBloom = true;
        
        // Use cached material for landscape
        const landscapeMaterial = getOptimizedMaterial(0x666666, 0.9, 0.05);
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