import * as THREE from 'three';
import { Effect } from 'postprocessing';

export class CharacterOutlineEffect extends Effect {
    constructor(scene, camera) {
        super('CharacterOutlineEffect', fragmentShader, {
            uniforms: new Map([
                ['uEnabled', new THREE.Uniform(1.0)],
                ['uOutlineColor', new THREE.Uniform(new THREE.Color(0xFFFFFF))],
                ['uOutlineWidth', new THREE.Uniform(0.003)],
                ['uIntensity', new THREE.Uniform(1.0)],
                ['uResolution', new THREE.Uniform(new THREE.Vector2(1920, 1080))],
                ['tCharacterMask', new THREE.Uniform(null)]
            ])
        });
        
        this.scene = scene;
        this.camera = camera;
        this.enabled = true;
        this.outlineColor = new THREE.Color(0xFFFFFF);
        this.outlineWidth = 0.003;
        this.intensity = 1.0;
        
        // Create render targets for character mask
        this.maskRenderTarget = new THREE.WebGLRenderTarget(1920, 1080, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType
        });
        
        // Material for rendering character silhouette
        this.maskMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: false,
            side: THREE.DoubleSide
        });
        
        // Store original materials
        this.originalMaterials = new Map();
        
        this.uniforms.get('tCharacterMask').value = this.maskRenderTarget.texture;
    }

    // Update methods for controls
    setEnabled(enabled) {
        this.enabled = enabled;
        this.uniforms.get('uEnabled').value = enabled ? 1.0 : 0.0;
    }

    setOutlineColor(color) {
        this.outlineColor.copy(color);
        this.uniforms.get('uOutlineColor').value.copy(color);
    }

    setOutlineWidth(width) {
        this.outlineWidth = width;
        this.uniforms.get('uOutlineWidth').value = width;
    }

    setIntensity(intensity) {
        this.intensity = intensity;
        this.uniforms.get('uIntensity').value = intensity;
    }

    setResolution(width, height) {
        this.uniforms.get('uResolution').value.set(width, height);
        this.maskRenderTarget.setSize(width, height);
    }

    // Render character mask
    renderCharacterMask(renderer) {
        if (!this.enabled) return;
        
        // Store original materials and replace with mask material
        this.scene.traverse((child) => {
            if (child.isMesh && child.visible) {
                // Only apply to character meshes (you can add more specific filtering here)
                if (child.name.includes('avaturn') || child.userData.isCharacter) {
                    this.originalMaterials.set(child, child.material);
                    child.material = this.maskMaterial;
                }
            }
        });
        
        // Render to mask target
        const originalRenderTarget = renderer.getRenderTarget();
        renderer.setRenderTarget(this.maskRenderTarget);
        renderer.clear();
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(originalRenderTarget);
        
        // Restore original materials
        this.originalMaterials.forEach((material, mesh) => {
            mesh.material = material;
        });
        this.originalMaterials.clear();
    }

    dispose() {
        this.maskRenderTarget.dispose();
        this.maskMaterial.dispose();
    }
}

const fragmentShader = `
uniform float uEnabled;
uniform vec3 uOutlineColor;
uniform float uOutlineWidth;
uniform float uIntensity;
uniform vec2 uResolution;
uniform sampler2D tCharacterMask;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    if (uEnabled < 0.5) {
        outputColor = inputColor;
        return;
    }
    
    vec2 texel = 1.0 / uResolution;
    
    // Sample the character mask
    float centerMask = texture2D(tCharacterMask, uv).r;
    
    // Sample surrounding pixels to detect edges
    float leftMask = texture2D(tCharacterMask, uv - vec2(uOutlineWidth, 0.0)).r;
    float rightMask = texture2D(tCharacterMask, uv + vec2(uOutlineWidth, 0.0)).r;
    float upMask = texture2D(tCharacterMask, uv - vec2(0.0, uOutlineWidth)).r;
    float downMask = texture2D(tCharacterMask, uv + vec2(0.0, uOutlineWidth)).r;
    
    // Diagonal samples for better outline quality
    float upLeftMask = texture2D(tCharacterMask, uv + vec2(-uOutlineWidth, -uOutlineWidth)).r;
    float upRightMask = texture2D(tCharacterMask, uv + vec2(uOutlineWidth, -uOutlineWidth)).r;
    float downLeftMask = texture2D(tCharacterMask, uv + vec2(-uOutlineWidth, uOutlineWidth)).r;
    float downRightMask = texture2D(tCharacterMask, uv + vec2(uOutlineWidth, uOutlineWidth)).r;
    
    // Calculate edge detection
    float edge = 0.0;
    
    // If we're not on the character but neighbors are, we're on the outline
    if (centerMask < 0.5) {
        float neighborSum = leftMask + rightMask + upMask + downMask + 
                           upLeftMask + upRightMask + downLeftMask + downRightMask;
        
        if (neighborSum > 0.5) {
            edge = 1.0;
        }
    }
    
    // Mix outline color with original
    vec3 finalColor = mix(inputColor.rgb, uOutlineColor, edge * uIntensity);
    
    outputColor = vec4(finalColor, inputColor.a);
}
`; 