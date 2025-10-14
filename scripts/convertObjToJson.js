// scripts/convertObjToJson.js
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current script file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Construct the absolute path to the OBJ file
const objFilePath = resolve(__dirname, "../public/assets/canonical_face_model.obj");

// Construct the absolute path for the output JSON file
const jsonFilePath = resolve(__dirname, "../public/assets/canonicalFaceMesh.json");

// Read the file from the constructed absolute path
const objText = readFileSync(objFilePath, "utf8");

const vertices = [];
const faces = [];

objText.split("\n").forEach((line) => {
  const parts = line.trim().split(/\s+/);
  if (parts[0] === "v") {
    // Vertex line: "v x y z"
    vertices.push(parts.slice(1).map(Number));
  } else if (parts[0] === "f") {
    // Face line: "f i j k" (indices start at 1 in OBJ)
    const face = parts.slice(1).map((s) => parseInt(s.split("/")[0]) - 1);
    faces.push(face);
  }
});

// Write the file to the constructed absolute path
writeFileSync(
  jsonFilePath,
  JSON.stringify({ vertices, faces }, null, 2)
);

console.log(
  `✅ Converted ${vertices.length} vertices and ${faces.length} faces → canonicalFaceMesh.json`
);
