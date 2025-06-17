import { ShaderMaterial, WebGLRenderer } from 'three';
import { EffectComposer, RenderPass, ShaderPass, SelectiveBloomEffect, EffectPass } from 'postprocessing';
import DistortionTexture from './Distortion';
import { DistortionEffect } from './DistortionEffect';

export default class Postprocessing {
    constructor({ gl, scene, camera }) {
        this._gl = gl;
        this._scene = scene;
        this._camera = camera;
        this.distortionTexture = new DistortionTexture({ debug: false }); 

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

        // distortion EFFECT - Optimized
        const distortionEffect = new DistortionEffect(this.distortionTexture.texture);
        const distortionPass = new EffectPass(this._camera, distortionEffect);

        composer.addPass(distortionPass);

        // BLOOM EFFECT - Optimized for performance
        const bloomEffect = new SelectiveBloomEffect(this._scene, this._camera, {
            mipmapBlur: false, // Disable mipmap blur for better performance
            intensity: 2.5, // Reduced from 3.5
            radius: 0.3, // Reduced from 0.5
            luminanceThreshold: 0.6, // Increased threshold to bloom less
            levels: 3, // Reduced from 4 levels
        });

        // Scene traversal for bloom selection setup
        this._scene.traverse((element) => {
            if (element.isMesh) {
                // Mesh found for potential bloom selection
            }
        });
        this._bloomEffect = bloomEffect;

        // EFFECTPASS
        const effectPass = new EffectPass(this._camera, bloomEffect);
        composer.addPass(effectPass);

        // Render to screen
        effectPass.renderToScreen = true;
    }

    createBloomSelection() {
        const { selection } = this._bloomEffect;

        this._scene.traverse((element) => {
            if (element.isMesh && element.userData?.isSelectedForBloom) {
                selection.add(element);
            }
        });
    }

    render() {
        this.distortionTexture.update();
        this._composer.render();
    }
}
