import { NUM_LANDMARKS } from './facemesh-triangles';

// Mesh deformation utilities
export class MeshDeformer {
  constructor(baselinePositions) {
    this.baseline = new Float32Array(baselinePositions);
    this.current = new Float32Array(baselinePositions);
    this.target = new Float32Array(baselinePositions);
  }

  // Apply all controls to compute target positions
  applyControls(controls) {
    this.target.set(this.baseline);

    if (controls.jawWidth !== undefined) this.applyJawWidth(controls.jawWidth);
    if (controls.chinHeight !== undefined) this.applyChinHeight(controls.chinHeight);
    if (controls.mouthWidth !== undefined) this.applyMouthWidth(controls.mouthWidth);
    if (controls.noseLength !== undefined) this.applyNoseLength(controls.noseLength);
    if (controls.eyeSize !== undefined) this.applyEyeSize(controls.eyeSize);
    if (controls.eyeSpacing !== undefined) this.applyEyeSpacing(controls.eyeSpacing);
    if (controls.cheekPuff !== undefined) this.applyCheekPuff(controls.cheekPuff);
    if (controls.faceScale !== undefined) this.applyFaceScale(controls.faceScale);
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
  applyChinHeight(offset) {
    const chinIndices = [152, 377, 400, 378, 379, 365, 397, 288, 361, 323];
    for (const idx of chinIndices) {
      const i = idx * 3;
      this.target[i + 1] = this.baseline[i + 1] + (offset - 1.0) * 30; 
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
      this.target[i + 1] = centroid.y + (this.baseline[i + 1] - centroid.y) * scale;
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

    for (const idx of [...leftCheek, ...rightCheek]) {
      const i = idx * 3;
      this.target[i + 2] = this.baseline[i + 2] - (scale - 1.0) * 15; // move outward in Z
    }
  }

  // === Face Scale ===
  applyFaceScale(scale) {
    for (let i = 0; i < NUM_LANDMARKS; i++) {
      this.target[i * 3] = this.baseline[i * 3] * scale;
      this.target[i * 3 + 1] = this.baseline[i * 3 + 1] * scale;
      this.target[i * 3 + 2] = this.baseline[i * 3 + 2] * scale;
    }
  }
}
