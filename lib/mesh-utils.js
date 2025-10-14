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
    const jawIndices = [172, 136, 150, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 389];
    const centroid = this.computeCentroid(jawIndices);
    for (const idx of jawIndices) {
      const i = idx * 3;
      this.target[i] = centroid.x + (this.baseline[i] - centroid.x) * scale;
      this.target[i + 2] = centroid.z + (this.baseline[i + 2] - centroid.z) * scale;
    }
  }

  // === Chin Height ===
  applyChinHeight(scale) {
  const chinIndices = [152, 377, 400, 378, 379, 365, 397, 288, 361, 323];
  const centroid = this.computeCentroid(chinIndices);

  for (const idx of chinIndices) {
    const i = idx * 3;
    const dy = (this.baseline[i + 1] - centroid.y) * (scale - 1.0);
    // Move the chin proportionally along Y, relative to its center
    this.target[i + 1] = this.baseline[i + 1] + dy * 0.5;
  }
}

  // === Mouth Width ===
  applyMouthWidth(scale) {
    const mouthIndices = [61, 291, 78, 308, 13];
    const centroid = this.computeCentroid(mouthIndices);
    for (const idx of mouthIndices) {
      const i = idx * 3;
      this.target[i] = centroid.x + (this.baseline[i] - centroid.x) * scale;
    }
  }

  // === Nose Length ===
  applyNoseLength(scale) {
  const noseIndices = [1, 2, 98, 327, 168, 197, 5];
  const centroid = this.computeCentroid(noseIndices);

  for (const idx of noseIndices) {
    const i = idx * 3;
    const dy = (this.baseline[i + 1] - centroid.y);
    // extend nose gently along Y
    this.target[i + 1] = this.baseline[i + 1] + dy * (scale - 1.0) * 0.4;
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
  // only modify a copy — do not overwrite baseline
  for (let i = 0; i < NUM_LANDMARKS; i++) {
    const j = i * 3;
    this.target[j] = this.baseline[j] * scale;
    this.target[j + 1] = this.baseline[j + 1] * scale;
    this.target[j + 2] = this.baseline[j + 2] * scale;
  }
}
}