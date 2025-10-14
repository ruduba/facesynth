// STL export utilities for Three.js meshes
//lib/stlExport.js
export function exportSTL(geometry) {
  const vertices = geometry.attributes.position.array;
  const indices = geometry.index ? geometry.index.array : null;
  
  let output = 'solid mesh\n';
  
  if (indices) {
    // Indexed geometry
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i] * 3;
      const i2 = indices[i + 1] * 3;
      const i3 = indices[i + 2] * 3;
      
      const v1 = [vertices[i1], vertices[i1 + 1], vertices[i1 + 2]];
      const v2 = [vertices[i2], vertices[i2 + 1], vertices[i2 + 2]];
      const v3 = [vertices[i3], vertices[i3 + 1], vertices[i3 + 2]];
      
      const normal = computeNormal(v1, v2, v3);
      
      output += `  facet normal ${normal[0]} ${normal[1]} ${normal[2]}\n`;
      output += '    outer loop\n';
      output += `      vertex ${v1[0]} ${v1[1]} ${v1[2]}\n`;
      output += `      vertex ${v2[0]} ${v2[1]} ${v2[2]}\n`;
      output += `      vertex ${v3[0]} ${v3[1]} ${v3[2]}\n`;
      output += '    endloop\n';
      output += '  endfacet\n';
    }
  } else {
    // Non-indexed geometry
    for (let i = 0; i < vertices.length; i += 9) {
      const v1 = [vertices[i], vertices[i + 1], vertices[i + 2]];
      const v2 = [vertices[i + 3], vertices[i + 4], vertices[i + 5]];
      const v3 = [vertices[i + 6], vertices[i + 7], vertices[i + 8]];
      
      const normal = computeNormal(v1, v2, v3);
      
      output += `  facet normal ${normal[0]} ${normal[1]} ${normal[2]}\n`;
      output += '    outer loop\n';
      output += `      vertex ${v1[0]} ${v1[1]} ${v1[2]}\n`;
      output += `      vertex ${v2[0]} ${v2[1]} ${v2[2]}\n`;
      output += `      vertex ${v3[0]} ${v3[1]} ${v3[2]}\n`;
      output += '    endloop\n';
      output += '  endfacet\n';
    }
  }
  
  output += 'endsolid mesh\n';
  
  return output;
}

export function exportOBJ(geometry) {
  const vertices = geometry.attributes.position.array;
  const indices = geometry.index ? geometry.index.array : null;
  
  let output = '# FaceSynth.exe OBJ Export\n';
  
  // Write vertices
  for (let i = 0; i < vertices.length; i += 3) {
    output += `v ${vertices[i]} ${vertices[i + 1]} ${vertices[i + 2]}\n`;
  }
  
  // Write faces
  if (indices) {
    for (let i = 0; i < indices.length; i += 3) {
      output += `f ${indices[i] + 1} ${indices[i + 1] + 1} ${indices[i + 2] + 1}\n`;
    }
  } else {
    const numVertices = vertices.length / 3;
    for (let i = 0; i < numVertices; i += 3) {
      output += `f ${i + 1} ${i + 2} ${i + 3}\n`;
    }
  }
  
  return output;
}

export function exportPLY(geometry) {
  const vertices = geometry.attributes.position.array;
  const indices = geometry.index ? geometry.index.array : null;
  
  const numVertices = vertices.length / 3;
  const numFaces = indices ? indices.length / 3 : numVertices / 3;
  
  let output = 'ply\n';
  output += 'format ascii 1.0\n';
  output += `element vertex ${numVertices}\n`;
  output += 'property float x\n';
  output += 'property float y\n';
  output += 'property float z\n';
  output += `element face ${numFaces}\n`;
  output += 'property list uchar int vertex_indices\n';
  output += 'end_header\n';
  
  // Write vertices
  for (let i = 0; i < vertices.length; i += 3) {
    output += `${vertices[i]} ${vertices[i + 1]} ${vertices[i + 2]}\n`;
  }
  
  // Write faces
  if (indices) {
    for (let i = 0; i < indices.length; i += 3) {
      output += `3 ${indices[i]} ${indices[i + 1]} ${indices[i + 2]}\n`;
    }
  } else {
    for (let i = 0; i < numVertices; i += 3) {
      output += `3 ${i} ${i + 1} ${i + 2}\n`;
    }
  }
  
  return output;
}

function computeNormal(v1, v2, v3) {
  const ux = v2[0] - v1[0];
  const uy = v2[1] - v1[1];
  const uz = v2[2] - v1[2];
  
  const vx = v3[0] - v1[0];
  const vy = v3[1] - v1[1];
  const vz = v3[2] - v1[2];
  
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  
  if (len > 0) {
    return [nx / len, ny / len, nz / len];
  }
  
  return [0, 0, 1];
}

// Download helper
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}