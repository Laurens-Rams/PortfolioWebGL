import * as THREE from 'three';
import { Effect } from 'postprocessing';

// The distortion from the tutorial you showed me and then changed
export class DistortionEffect extends Effect {
    constructor(texture) {
        super('DistortionEffect', fragment, {
            uniforms: new Map([
                ['uTexture', new THREE.Uniform(texture)],
                ['blendFactor', new THREE.Uniform(0.015)]
            ])
        });
    }
}

const fragment = `
uniform sampler2D uTexture;
uniform float blendFactor; 

void mainUv(inout vec2 uv) {
    vec4 tex = texture2D(uTexture, uv);
    float vx = -(tex.r * 2.0 - 1.0);
    float vy = -(tex.g * 2.0 - 1.0);
    float intensity = tex.b;
    float maxAmplitude = 0.2;
    uv.x += vx * intensity * maxAmplitude;
    uv.y += vy * intensity * maxAmplitude;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 distortedUv = uv;
    mainUv(distortedUv);
    vec4 distortedColor = texture2D(uTexture, distortedUv);
    
    float gray = dot(distortedColor.rgb, vec3(0.299, 0.587, 0.114));
    vec4 bwColor = vec4(vec3(gray), distortedColor.a);
    
    outputColor = mix(inputColor, bwColor, blendFactor); 
}
`;