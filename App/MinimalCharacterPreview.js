// 🔥 MINIMAL CHARACTER PREVIEW - PROCEDURAL GENERATION
// Creates a super lightweight character preview using Three.js primitives
// Total size: <1KB (just code, no assets!)

import {
  Group,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  Mesh,
  AnimationMixer,
  AnimationClip,
  KeyframeTrack,
  VectorKeyframeTrack
} from 'three';

export class MinimalCharacterPreview extends Group {
  constructor() {
    super();
    
    this.name = 'MinimalCharacterPreview';
    this.mixer = null;
    this.idleAnimation = null;
    
    this._createCharacter();
    this._createIdleAnimation();
    
    // Position like the real character
    this.scale.set(20, 20, 20);
    this.position.set(0, -850, -1400);
    this.rotation.set(0, 0, 0);
    
    console.log('🔥 Minimal character preview created (procedural, <1KB)');
  }

  _createCharacter() {
    // Create materials
    const bodyMaterial = new MeshStandardMaterial({
      color: 0x8B7355, // Skin tone
      roughness: 0.8,
      metalness: 0.1,
    });
    
    const clothingMaterial = new MeshStandardMaterial({
      color: 0x2C5F41, // Climbing gear color
      roughness: 0.9,
      metalness: 0.05,
    });
    
    // Head
    const headGeometry = new SphereGeometry(1, 8, 6);
    const head = new Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 6, 0);
    head.name = 'head';
    this.add(head);
    
    // Torso
    const torsoGeometry = new BoxGeometry(2, 3, 1);
    const torso = new Mesh(torsoGeometry, clothingMaterial);
    torso.position.set(0, 3, 0);
    torso.name = 'torso';
    this.add(torso);
    
    // Arms
    const armGeometry = new CylinderGeometry(0.3, 0.3, 2.5, 6);
    
    const leftArm = new Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-1.5, 4, 0);
    leftArm.rotation.z = Math.PI / 6; // Slight climbing pose
    leftArm.name = 'leftArm';
    this.add(leftArm);
    
    const rightArm = new Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(1.5, 4.5, 0);
    rightArm.rotation.z = -Math.PI / 4; // Reaching up
    rightArm.name = 'rightArm';
    this.add(rightArm);
    
    // Legs
    const legGeometry = new CylinderGeometry(0.4, 0.4, 3, 6);
    
    const leftLeg = new Mesh(legGeometry, clothingMaterial);
    leftLeg.position.set(-0.6, 0, 0);
    leftLeg.name = 'leftLeg';
    this.add(leftLeg);
    
    const rightLeg = new Mesh(legGeometry, clothingMaterial);
    rightLeg.position.set(0.6, 0, 0);
    rightLeg.name = 'rightLeg';
    this.add(rightLeg);
    
    // Hands (climbing holds)
    const handGeometry = new SphereGeometry(0.2, 6, 4);
    
    const leftHand = new Mesh(handGeometry, bodyMaterial);
    leftHand.position.set(-2, 5.5, 0);
    leftHand.name = 'leftHand';
    this.add(leftHand);
    
    const rightHand = new Mesh(handGeometry, bodyMaterial);
    rightHand.position.set(2, 6, 0);
    rightHand.name = 'rightHand';
    this.add(rightHand);
    
    // Store references for animation
    this.head = head;
    this.torso = torso;
    this.leftArm = leftArm;
    this.rightArm = rightArm;
    this.leftLeg = leftLeg;
    this.rightLeg = rightLeg;
  }

  _createIdleAnimation() {
    // Create simple breathing animation to avoid quaternion issues
    this.animationTime = 0;
    this.breathingSpeed = 0.5;
    this.swaySpeed = 0.3;
    
    // Store initial rotations
    this.initialRotations = {
      head: { x: 0, y: 0, z: 0 },
      leftArm: { x: 0, y: 0, z: Math.PI / 6 },
      rightArm: { x: 0, y: 0, z: -Math.PI / 4 }
    };
    
    console.log('🔥 Minimal character idle animation created');
  }

  update(deltaTime) {
    // Simple manual animation to avoid quaternion issues
    this.animationTime += deltaTime;
    
    // Breathing effect on torso
    const breathScale = 1 + Math.sin(this.animationTime * this.breathingSpeed) * 0.02;
    this.torso.scale.set(breathScale, breathScale, 1);
    
    // Subtle head sway
    const headSway = Math.sin(this.animationTime * this.swaySpeed) * 0.05;
    this.head.rotation.z = headSway;
    
    // Subtle arm movement
    const armSway = Math.sin(this.animationTime * this.swaySpeed * 0.8) * 0.1;
    this.leftArm.rotation.z = this.initialRotations.leftArm.z + armSway;
    this.rightArm.rotation.z = this.initialRotations.rightArm.z - armSway;
  }

  // Mimic the real character's animation states
  transitionToState(state) {
    console.log(`🔥 Minimal character: Transitioning to ${state} (preview mode)`);
    
    switch (state) {
      case 'idle':
        // Already in idle
        break;
      case 'climbing':
        // Simple climbing pose
        this.leftArm.rotation.z = Math.PI / 3;
        this.rightArm.rotation.z = -Math.PI / 3;
        this.rightArm.position.y = 5.5;
        break;
      case 'standing':
        // Standing pose
        this.leftArm.rotation.z = 0;
        this.rightArm.rotation.z = 0;
        this.rightArm.position.y = 4;
        break;
    }
  }

  dispose() {
    // Reset animation state
    this.animationTime = 0;
    
    // Dispose geometries and materials
    this.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      }
    });
    
    console.log('🔥 Minimal character preview disposed');
  }
} 