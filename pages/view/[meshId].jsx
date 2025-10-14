import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

export default function ViewMesh() {
  const router = useRouter();
  const { meshId } = router.query;
  const containerRef = useRef(null);
  
  const [mesh, setMesh] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showAxis, setShowAxis] = useState(true);

  useEffect(() => {
    if (meshId) {
      loadMesh();
    }
  }, [meshId]);

  useEffect(() => {
    if (mesh && containerRef.current) {
      initViewer();
    }
  }, [mesh]);

  useEffect(() => {
  if (window._viewer?.material) {
    window._viewer.material.wireframe = showWireframe;
    window._viewer.material.needsUpdate = true;
  }
}, [showWireframe]);


  const loadMesh = async () => {
    try {
      const res = await fetch(`/api/meshes/${meshId}`);
      if (res.ok) {
        const data = await res.json();
        setMesh(data.mesh);
      } else {
        alert('Mesh not found');
        router.push('/library');
      }
    } catch (error) {
      console.error('Failed to load mesh:', error);
      alert('Failed to load mesh');
    } finally {
      setLoading(false);
    }
  };

  const initViewer = async () => {
    const THREE = await import('three');
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');
    const { FACEMESH_TRIANGLES } = await import('../../lib/facemesh-triangles');

    // Clear container
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
   camera.position.z = 2.5; // or dynamically based on scale if you want
  camera.lookAt(0, 0, 0);


    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // Axis helper
    const axisHelper = new THREE.AxesHelper(1);
    axisHelper.visible = showAxis;
    scene.add(axisHelper);

    // Create mesh geometry
    const geometry = new THREE.BufferGeometry();
    
    // Parse metadata to get positions
    const metadata = JSON.parse(mesh.jsonMetadata);
    let positions;
    
    if (metadata.baselinePositions) {
      positions = new Float32Array(metadata.baselinePositions);
    } else {
      // Default positions
      positions = new Float32Array(468 * 3);
      for (let i = 0; i < 468; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        positions[i * 3] = Math.sin(phi) * Math.cos(theta) * 0.5;
        positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * 0.5;
        positions[i * 3 + 2] = Math.cos(phi) * 0.5;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(Array.from(FACEMESH_TRIANGLES).flat());
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.center();

    const bbox = geometry.boundingBox;
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

// Scale so it fits nicely in view (optional)
    const scale = 1.5 / maxDim; // adjust scalar to taste
    geometry.scale(scale, scale, scale);

    // Material
    const material = new THREE.MeshStandardMaterial({
      color: 0xffc0cb,
      flatShading: false,
      side: THREE.DoubleSide,
      wireframe: showWireframe
    });

    const faceMesh = new THREE.Mesh(geometry, material);
    scene.add(faceMesh);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading mesh...</p>
      </div>
    );
  }

  return (
    <div className="view-container">
      <header className="view-header">
        <div className="header-left">
          <button onClick={() => router.push('/library')} className="btn-secondary">
            ← Back to Library
          </button>
          <h1>{mesh?.name || 'Mesh Viewer'}</h1>
        </div>
        <div className="header-right">
          <button 
  className="btn-secondary"
  onClick={() => setShowWireframe(!showWireframe)}
>
  {showWireframe ? 'Shaded' : 'Wireframe'}
</button>

          <button 
            className="btn-secondary"
            onClick={() => setShowAxis(!showAxis)}
          >
            {showAxis ? 'Hide Axis' : 'Show Axis'}
          </button>
          <button 
            className="btn-primary"
            onClick={() => router.push(`/editor/${meshId}`)}
          >
            Edit Mesh
          </button>
        </div>
      </header>

      <div ref={containerRef} className="viewer-canvas" />

      <div className="viewer-info">
        <p>🖱️ Left click + drag to rotate</p>
        <p>🖱️ Right click + drag to pan</p>
        <p>🖱️ Scroll to zoom</p>
      </div>

      <style jsx>{`
        .view-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--bg-window);
        }

        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background: linear-gradient(to bottom, #0a246a, #a6caf0);
          color: white;
          border-bottom: 2px solid var(--border-dark);
        }

        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .view-header h1 {
          margin: 0;
          font-size: 16px;
        }

        .viewer-canvas {
          flex: 1;
          background: #1a1a1a;
        }

        .viewer-info {
          padding: 10px 15px;
          background: var(--secondary-gray);
          border-top: 2px solid var(--border-dark);
          display: flex;
          gap: 30px;
          justify-content: center;
        }

        .viewer-info p {
          margin: 0;
          font-size: 10px;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .view-header {
            flex-direction: column;
            gap: 10px;
          }

          .viewer-info {
            flex-direction: column;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
}