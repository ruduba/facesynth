import { useEffect, useRef, useState } from 'react';

//const { FACEMESH_TRIANGLES } = await import('../../lib/facemesh-triangles');



export default function ThreeDViewer({
  baselinePositions,
  controls = null,
  onPositionUpdate = null,
  selectedTool = null
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const orbitRef = useRef(null);
  const meshRef = useRef(null);
  const deformerRef = useRef(null);

  const [showWireframe, setShowWireframe] = useState(false);
  const canonicalLoadedRef = useRef(false);
  const animationRef = useRef(null);
  


  // === INITIALIZE THREE (run once) ===
  useEffect(() => {
    let mounted = true;

    (async () => {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');

      if (!mounted || !containerRef.current) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1e1e1e);
      sceneRef.current = scene;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 3);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(width, height);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const orbit = new OrbitControls(camera, renderer.domElement);
      orbit.enableDamping = true;
      orbit.dampingFactor = 0.08;
      orbitRef.current = orbit;

      // Lights
      // === Lighting setup ===

// Soft ambient light to fill shadows
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

// Main directional "key" light (simulates sunlight)
const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(2, 2, 3);
keyLight.castShadow = true;
scene.add(keyLight);

// Secondary fill light to brighten opposite side
const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-2, 1, 1);
scene.add(fillLight);

// Warm rim/back light for subtle edge highlight
const rimLight = new THREE.DirectionalLight(0xffe0bd, 0.3);
rimLight.position.set(0, 2, -2);
scene.add(rimLight);

// Optional helper for debugging light directions
// scene.add(new THREE.DirectionalLightHelper(keyLight));
// scene.add(new THREE.DirectionalLightHelper(fillLight));
// scene.add(new THREE.DirectionalLightHelper(rimLight));


      const axesHelper = new THREE.AxesHelper(1); // length 1.5 units
      scene.add(axesHelper);


      // Fallback cube (until mesh loads)
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x3333aa })
      );
      scene.add(cube);
      meshRef.current = cube;

      // Debug exposure
      window._three = { scene, camera, renderer, orbit, meshRef };

      // Animation loop (guarded)
      const animate = () => {
        if (!mounted) return;
        animationRef.current = requestAnimationFrame(animate);

        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;

        if (!renderer || !scene || !camera) return; // <=== guard against undefineds

        orbitRef.current?.update();
        renderer.render(scene, camera);
      };
      animate();

      // Resize
      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    })();

    return () => {
      mounted = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      // Properly dispose of renderer/context to prevent “too many contexts” warnings
      if (rendererRef.current) {
        try {
          rendererRef.current.dispose();
          rendererRef.current.forceContextLoss?.();
          const dom = rendererRef.current.domElement;
          if (dom && containerRef.current?.contains(dom)) {
            containerRef.current.removeChild(dom);
          }
        } catch (e) {
          console.warn('Renderer cleanup error:', e);
        }
      }
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      orbitRef.current = null;
      meshRef.current = null;
      deformerRef.current = null;
    };
  }, []);

  // === BUILD / UPDATE MESH ===
  useEffect(() => {
    let cancelled = false;

async function buildMeshFromPositions(positionsArray) {
  const THREE = await import('three');
  const triModule = await import('../../lib/facemesh-triangles');
  const { MeshDeformer } = await import('../../lib/mesh-utils');

  const FACEMESH_TRIANGLES =
    triModule.FACEMESH_TRIANGLES ||
    triModule.default;

  if (!FACEMESH_TRIANGLES) {
    throw new Error('FACEMESH_TRIANGLES missing — check your facemesh-triangles.js export.');
  }

  const scene = sceneRef.current;
  if (!scene || !rendererRef.current) return;

  // Clean up previous mesh
  if (meshRef.current) {
    try {
      meshRef.current.geometry.dispose();
      meshRef.current.material.dispose();
      scene.remove(meshRef.current);
    } catch {}
  }

  // === Create geometry ===
  const positions = new Float32Array(positionsArray);
  const indices = new Uint16Array(FACEMESH_TRIANGLES.flat());
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));

  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.center();

  console.log('FACEMESH_TRIANGLES', FACEMESH_TRIANGLES.length);
  console.log('✅ Face mesh created, vertices:', geom.attributes.position.count);

  const bbox = geom.boundingBox;
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 20 / maxDim;

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffc0cb,
    side: THREE.DoubleSide,
    wireframe: showWireframe,
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.scale.setScalar(scale);
  scene.add(mesh);
  meshRef.current = mesh;

  // Adjust camera distance
  const camera = cameraRef.current;
  if (camera) {
    const dist = Math.max(1.5 * maxDim * scale, 3);
    camera.position.set(0, 0, dist);
    camera.near = dist / 100;
    camera.far = dist * 10;
    camera.updateProjectionMatrix();
  }

  // Create deformer
  deformerRef.current = new MeshDeformer(positions);
}


    (async () => {
      try {
        if (baselinePositions && baselinePositions.length >= 3) {
          await buildMeshFromPositions(baselinePositions);
        } else if (!canonicalLoadedRef.current) {
          canonicalLoadedRef.current = true;
          const res = await fetch('/assets/canonicalFaceMesh.json');
          if (res.ok) {
            const data = await res.json();
            const verts = Array.isArray(data.vertices)
              ? data.vertices.flat()
              : data.flat?.() || data;
            await buildMeshFromPositions(verts);
          } else {
            console.warn('No canonical face mesh found.');
          }
        }
      } catch (err) {
        console.error('Mesh build failed:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [baselinePositions, showWireframe]);


      useEffect(() => {
  if (baselinePositions) {
    console.log('✅ Baseline length:', baselinePositions.length);
    console.log('✅ First 10 vertices:', baselinePositions.slice(0, 30));
    window._baseline = baselinePositions; // expose for console debugging
  }
}, [baselinePositions]);

  return (
    <div className="threed-viewer" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        className="viewer-toolbar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 6,
          background: 'var(--secondary-gray)',
          borderBottom: '2px solid var(--border-dark)',
        }}
      >
        <button onClick={() => setShowWireframe(s => !s)}>
          {showWireframe ? 'Shaded' : 'Wireframe'}
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {meshRef.current ? '3D Mesh' : 'Loading...'}
        </span>
      </div>
      <div ref={containerRef} className="canvas-container" style={{ flex: 1, background: '#1a1a1a' }} />
    </div>
  );
}
