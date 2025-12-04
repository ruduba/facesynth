//mesh-utils.js

import { NUM_LANDMARKS } from './facemesh-triangles';

const CHIN_INDICES = [152, 148, 176, 149, 150, 136, 172, 58, 132];
const JAW_INDICES = [172, 136, 150, 149, 176, 148, 152, 377, 400, 378];
const MOUTH_INDICES = [78, 191, 80, 81, 82, 13, 312, 308, 310, 311];
const NOSE_INDICES = [1, 2, 98, 327, 94, 331, 5, 195];
const EYE_INDICES = [33, 133, 362, 263, 159, 145, 386, 374];

// Mesh deformation utilities
export class MeshDeformer {
  constructor(baselinePositions) {
    this.baseline = new Float32Array(baselinePositions);
    this.current = new Float32Array(baselinePositions);
    this.target = new Float32Array(baselinePositions);
  }




  // Apply all controls to compute target positions
// Apply all controls to compute target positions
applyControls(controls) {
  // start from a copy of baseline
  this.target.set(this.baseline);

  const {
    jawWidth = 1,
    chinHeight = 1,
    mouthWidth = 1,
    noseLength = 1,
    eyeSize = 1,
    eyeSpacing = 1,
    cheekPuff = 1,
    faceScale = 1,
  } = controls;

  // call region-specific modifiers
  if (jawWidth !== 1) this.applyJawWidth(jawWidth);
  if (chinHeight !== 1) this.applyChinHeight(chinHeight);
  if (mouthWidth !== 1) this.applyMouthWidth(mouthWidth);
  if (noseLength !== 1) this.applyNoseLength(noseLength);
  if (eyeSize !== 1) this.applyEyeSize(eyeSize);
  if (eyeSpacing !== 1) this.applyEyeSpacing(eyeSpacing);
  if (cheekPuff !== 1) this.applyCheekPuff(cheekPuff);
  if (faceScale !== 1) this.applyFaceScale(faceScale);

  return this.target;
}



  // Smooth interpolation from current → target
  smoothUpdate(alpha = 0.3) {
    for (let i = 0; i < this.current.length; i++) {
      this.current[i] += (this.target[i] - this.current[i]) * alpha;
    }
    return this.current;
  }

  // Compute centroid of a group of vertices
  computeCentroid(indices) {
    let cx = 0, cy = 0, cz = 0;
    for (const idx of indices) {
      const i = idx * 3;
      cx += this.baseline[i];
      cy += this.baseline[i + 1];
      cz += this.baseline[i + 2];
    }
    const n = indices.length;
    return { x: cx / n, y: cy / n, z: cz / n };
  }

// === Jaw Width ===
applyJawWidth(scale) {
  // ONLY the jawline curve - exclude face sides
  const jawIndices = [
    // Bottom jawline from left to right
    172, 136, 150, 149, 176, 148, 152, // left bottom curve
    378, 377, 400, 379, 365, 397, 288, 361, 323 // right bottom curve
  ];
  
  // Use horizontal center line (X=0 roughly) as reference
  for (const idx of jawIndices) {
    const i = idx * 3;
    const x = this.baseline[i];
    const z = this.baseline[i + 2];
    
    // Scale ONLY X (width) symmetrically from center
    // Don't touch Z to avoid depth distortion
    const dx = x; // distance from center
    const offset = dx * (scale - 1.0) * 0.5; // very gentle
    
    this.target[i] = x + offset;
  }
}
// === Chin Height ===
applyChinHeight(scale) {
  // ONLY the bottom chin point and immediate neighbors
  const chinCore = 152; // chin tip
  const chinSupport = [148, 176, 149, 150, 378, 377]; // immediate support points
  
  // Move only along Y axis, straight down/up
  const offset = (scale - 1.0) * 3.0; // small value
  
  // Chin tip moves full amount
  this.target[chinCore * 3 + 1] = this.baseline[chinCore * 3 + 1] + offset;
  
  // Support points move 50% of the amount
  for (const idx of chinSupport) {
    const i = idx * 3 + 1;
    this.target[i] = this.baseline[i] + offset * 0.5;
  }
}
// === Mouth Width ===
applyMouthWidth(scale) {
  // Precise mouth perimeter only
  const mouthOuter = [
    61, 291, // corners (most important)
    40, 39, 37, 0, 267, 269, 270, // upper lip
    375, 321, 405, 314, 17, 84, 181, 91, 146 // lower lip
  ];
  
  // Mouth center
  const centerIdx = 0;
  const centerX = this.baseline[centerIdx * 3];
  
  for (const idx of mouthOuter) {
    const i = idx * 3;
    const dx = this.baseline[i] - centerX;
    
    // Only scale X, keep Y and Z fixed
    const offset = dx * (scale - 1.0) * 0.6;
    this.target[i] = this.baseline[i] + offset;
  }
}

  // === Nose Length ===
applyNoseLength(scaleLength = 1.2, scaleWidth = 1.1) {
  // key nose landmark indices (tip, bridge, sides)
  const noseIndices = [1, 2, 5, 98, 327, 168, 197, 195, 6, 97];
  const centroid = this.computeCentroid(noseIndices);

  for (const idx of noseIndices) {
    const i = idx * 3;
    const x = this.baseline[i];
    const y = this.baseline[i + 1];
    const z = this.baseline[i + 2];

    // vector from centroid
    const dx = x - centroid.x;
    const dy = y - centroid.y;
    const dz = z - centroid.z;

    // lengthening (mainly along Y axis)
    const newY = y + dy * (scaleLength - 1.0) * 0.4;

    // widen nose (mainly along X and Z)
    const newX = x + dx * (scaleWidth - 1.0) * 0.3;
    const newZ = z + dz * (scaleWidth - 1.0) * 0.3;

    // apply deformation
    this.target[i] = newX;
    this.target[i + 1] = newY;
    this.target[i + 2] = newZ;
  }
}


  // === Eye Size ===
  applyEyeSize(scale) {
    const leftEye = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
    const rightEye = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];

    const leftCentroid = this.computeCentroid(leftEye);
    const rightCentroid = this.computeCentroid(rightEye);

    for (const idx of leftEye) {
      const i = idx * 3;
      this.target[i] = leftCentroid.x + (this.baseline[i] - leftCentroid.x) * scale;
      this.target[i + 1] = leftCentroid.y + (this.baseline[i + 1] - leftCentroid.y) * scale;
    }
    for (const idx of rightEye) {
      const i = idx * 3;
      this.target[i] = rightCentroid.x + (this.baseline[i] - rightCentroid.x) * scale;
      this.target[i + 1] = rightCentroid.y + (this.baseline[i + 1] - rightCentroid.y) * scale;
    }
  }

  // === Eye Spacing ===
  applyEyeSpacing(scale) {
    const leftEye = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
    const rightEye = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];

    const leftCentroid = this.computeCentroid(leftEye);
    const rightCentroid = this.computeCentroid(rightEye);

    const baseDist = rightCentroid.x - leftCentroid.x;
    const offset = (scale - 1.0) * baseDist * 0.3; // controlled offset

    for (const idx of leftEye) {
      const i = idx * 3;
      this.target[i] = this.baseline[i] - offset;
    }
    for (const idx of rightEye) {
      const i = idx * 3;
      this.target[i] = this.baseline[i] + offset;
    }
  }

  // === Cheek Puff ===
  applyCheekPuff(scale) {
  const leftCheek = [205, 50, 187, 207, 206, 203, 142, 126, 217, 198];
  const rightCheek = [425, 280, 411, 427, 436, 426, 423, 371, 355, 437];
  const cheeks = [...leftCheek, ...rightCheek];
  const centroid = this.computeCentroid(cheeks);

  for (const idx of cheeks) {
    const i = idx * 3;
    const dz = (this.baseline[i + 2] - centroid.z);
    // gentle outward motion along face normal (Z)
    this.target[i + 2] = this.baseline[i + 2] + dz * (scale - 1.0) * 0.3;
  }
}

  // === Face Scale ===
  applyFaceScale(scale) {
  // only modify a copy - do not overwrite baseline
  for (let i = 0; i < NUM_LANDMARKS; i++) {
    const j = i * 3;
    this.target[j] = this.baseline[j] * scale;
    this.target[j + 1] = this.baseline[j + 1] * scale;
    this.target[j + 2] = this.baseline[j + 2] * scale;
  }
}
}