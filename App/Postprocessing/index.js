// 🔥 PREVENT THREE.JS DUPLICATION - Use window.THREE set by main app
// Static import removed to prevent bundling Three.js twice (once by us, once by Spline)

import { EffectComposer, RenderPass, ShaderPass, SelectiveBloomEffect, EffectPass, FXAAEffect } from 'postprocessing';
import DistortionTexture from './Distortion';
import { DistortionEffect } from './DistortionEffect';
import { CharacterOutlineEffect } from './CharacterOutlineEffect';

let THREE;

// Initialize Three.js from global instance
function initThree() {
  if (!window.THREE) {
    console.error('🚨 window.THREE not available - main app should set this before postprocessing');
    return false;
  }
  THREE = window.THREE;
  return true;
}

export default class Postprocessing {
    constructor({ gl, scene, camera }) {
        // Initialize Three.js
        if (!initThree()) {
            throw new Error('Three.js not available for postprocessing');
        }
        
        this._gl = gl;
        this._scene = scene;
        this._camera = camera;
        this.distortionTexture = new DistortionTexture({ debug: false }); 

        // Effect controls
        this.controls = {
            bloom: {
                enabled: true,
                intensity: 2.5,
                radius: 0.3,
                threshold: 0.6,
                levels: 3
            },
            characterOutline: {
                enabled: false,
                width: 0.003,
                intensity: 1.0,
                color: { r: 1.0, g: 1.0, b: 1.0 } // White
            },

            fxaa: {
                enabled: true
            },
            distortion: {
                enabled: true,
                blendFactor: 0.015
            }
        };

        this._init();
    }

    _init() {
        this._gl.autoClear = false;

        // COMPOSER - Optimized for performance
        const composer = new EffectComposer(this._gl, { 
            stencilBuffer: false,
            multisampling: 0 // Disable multisampling for better performance
        });
        this._composer = composer;

        // RENDERPASS
        const renderPass = new RenderPass(this._scene, this._camera);
        composer.addPass(renderPass);

        // FXAA ANTI-ALIASING - First for clean edges
        this._fxaaEffect = new FXAAEffect();
        const fxaaPass = new EffectPass(this._camera, this._fxaaEffect);
        composer.addPass(fxaaPass);

        // DISTORTION EFFECT
        this._distortionEffect = new DistortionEffect(this.distortionTexture.texture);
        const distortionPass = new EffectPass(this._camera, this._distortionEffect);
        composer.addPass(distortionPass);

        // CHARACTER OUTLINE EFFECT
        this._characterOutlineEffect = new CharacterOutlineEffect(this._scene, this._camera);
        this._characterOutlineEffect.setResolution(window.innerWidth, window.innerHeight);
        const characterOutlinePass = new EffectPass(this._camera, this._characterOutlineEffect);
        composer.addPass(characterOutlinePass);



        // BLOOM EFFECT - Optimized for performance
        this._bloomEffect = new SelectiveBloomEffect(this._scene, this._camera, {
            mipmapBlur: false,
            intensity: this.controls.bloom.intensity,
            radius: this.controls.bloom.radius,
            luminanceThreshold: this.controls.bloom.threshold,
            levels: this.controls.bloom.levels,
        });

        // Scene traversal for bloom selection setup
        this._scene.traverse((element) => {
            if (element.isMesh) {
                // Mesh found for potential bloom selection
            }
        });

        // BLOOM EFFECTPASS
        const bloomPass = new EffectPass(this._camera, this._bloomEffect);
        composer.addPass(bloomPass);

        // Render to screen
        bloomPass.renderToScreen = true;

        // Set initial states
        this.updateEffectStates();
        
        console.log('🔥 POSTPROCESSING INITIALIZED:', {
            fxaa: !!this._fxaaEffect,
            distortion: !!this._distortionEffect,
            characterOutline: !!this._characterOutlineEffect,
            bloom: !!this._bloomEffect,
            composer: !!this._composer
        });
    }

    updateEffectStates() {
        // Update all effect states based on controls
        this._characterOutlineEffect.setEnabled(this.controls.characterOutline.enabled);
        
        // Update character outline properties
        this._characterOutlineEffect.setOutlineWidth(this.controls.characterOutline.width);
        this._characterOutlineEffect.setIntensity(this.controls.characterOutline.intensity);
        this._characterOutlineEffect.setOutlineColor(new THREE.Color(
            this.controls.characterOutline.color.r,
            this.controls.characterOutline.color.g,
            this.controls.characterOutline.color.b
        ));
        

        
        // Update bloom properties
        this._bloomEffect.intensity = this.controls.bloom.intensity;
        this._bloomEffect.radius = this.controls.bloom.radius;
        this._bloomEffect.luminanceThreshold = this.controls.bloom.threshold;
    }

    // Control methods for external access
    setBloomEnabled(enabled) {
        console.log('🔥 BLOOM ENABLED SET TO:', enabled);
        this.controls.bloom.enabled = enabled;
        // Note: Bloom can't be easily disabled in postprocessing library, so we set intensity to 0
        this._bloomEffect.intensity = enabled ? this.controls.bloom.intensity : 0;
        console.log('🔥 BLOOM EFFECT INTENSITY NOW:', this._bloomEffect.intensity);
    }

    setBloomIntensity(intensity) {
        console.log('🔥 BLOOM INTENSITY SET TO:', intensity);
        this.controls.bloom.intensity = intensity;
        if (this.controls.bloom.enabled) {
            this._bloomEffect.intensity = intensity;
            console.log('🔥 BLOOM EFFECT INTENSITY UPDATED TO:', this._bloomEffect.intensity);
        }
    }

    setBloomRadius(radius) {
        this.controls.bloom.radius = radius;
        this._bloomEffect.radius = radius;
    }

    setBloomThreshold(threshold) {
        this.controls.bloom.threshold = threshold;
        this._bloomEffect.luminanceThreshold = threshold;
    }

    // CHARACTER OUTLINE CONTROLS
    setCharacterOutlineEnabled(enabled) {
        this.controls.characterOutline.enabled = enabled;
        this._characterOutlineEffect.setEnabled(enabled);
    }

    setCharacterOutlineWidth(width) {
        this.controls.characterOutline.width = width;
        this._characterOutlineEffect.setOutlineWidth(width);
    }

    setCharacterOutlineIntensity(intensity) {
        this.controls.characterOutline.intensity = intensity;
        this._characterOutlineEffect.setIntensity(intensity);
    }

    setCharacterOutlineColor(color) {
        this.controls.characterOutline.color = color;
        this._characterOutlineEffect.setOutlineColor(new THREE.Color(color.r, color.g, color.b));
    }



    createBloomSelection() {
        const { selection } = this._bloomEffect;

        this._scene.traverse((element) => {
            if (element.isMesh && element.userData?.isSelectedForBloom) {
                selection.add(element);
            }
        });
    }

    // Handle window resize
    handleResize(width, height) {
        this._characterOutlineEffect.setResolution(width, height);
        this._composer.setSize(width, height);
    }

    render(deltaTime = 0.016) {
        this.distortionTexture.update();
        
        console.log('🔥 POSTPROCESSING RENDER CALLED');
        this._composer.render(deltaTime);
    }

    getControls() {
        return this.controls;
    }
}
