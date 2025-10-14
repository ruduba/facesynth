//pages/editor/[meshId].jsx

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Controls from '../../components/Editor/Controls';
import ExportControls from '../../components/Editor/ExportControls';
import UndoRedo from '../../components/Editor/UndoRedo';

// Dynamic imports to avoid SSR issues
const FaceMeshViewer = dynamic(() => import('../../components/Editor/FaceMeshViewer'), { ssr: false });
const ThreeDViewer = dynamic(() => import('../../components/Editor/ThreeDViewer'), { ssr: false });

export default function Editor() {
  const router = useRouter();
  const { meshId } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [mesh, setMesh] = useState(null);
  const [positions, setPositions] = useState(null);
  const [baselinePositions, setBaselinePositions] = useState(null);



  const [controls, setControls] = useState({
    jawWidth: 1.0,
    chinHeight: 1.0,
    mouthWidth: 1.0,
    noseLength: 1.0,
    eyeSize: 1.0,
    eyeSpacing: 1.0,
    cheekPuff: 1.0,
    faceScale: 1.0
  });
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const [showCamera, setShowCamera] = useState(true);
  const [selectedTool, setSelectedTool] = useState('move');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

const [undoStack, setUndoStack] = useState([]);
const [redoStack, setRedoStack] = useState([]);

// when a slider changes
function handleControlChange(name, value) {
  setUndoStack(prev => [...prev, { ...controls }].slice(-50)); // keep last 50 states
  setRedoStack([]); // clear redo stack on new action
  setControls(prev => ({ ...prev, [name]: value }));
}

// undo
function handleUndo() {
  setUndoStack(prev => {
    if (prev.length === 0) return prev;
    const last = prev[prev.length - 1];
    setRedoStack(r => [controls, ...r]);
    setControls(last);
    return prev.slice(0, -1);
  });
}

// redo
function handleRedo() {
  setRedoStack(prev => {
    if (prev.length === 0) return prev;
    const next = prev[0];
    setUndoStack(u => [...u, controls]);
    setControls(next);
    return prev.slice(1);
  });
}


  useEffect(() => {
    if (meshId && meshId !== 'new') {
      loadMesh();
    } else {
      setLoading(false);
    }
  }, [meshId]);

  const loadMesh = async () => {
    try {
      const res = await fetch(`/api/meshes/${meshId}`);
      if (res.ok) {
        const data = await res.json();
        setMesh(data.mesh);
        
        const metadata = JSON.parse(data.mesh.jsonMetadata);
        if (metadata.controls) {
          setControls(metadata.controls);
        }
      }
    } catch (error) {
      console.error('Failed to load mesh:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleBaselineCapture = (capturedPositions) => {
    setBaselinePositions(capturedPositions);
    setPositions(new Float32Array(capturedPositions));
  };

  const handlePositionUpdate = (newPositions) => {
    setPositions(newPositions);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      
      // Create STL blob
      const { exportSTL } = await import('../../lib/stlExport');
      // Create temporary geometry for export
      const stlContent = exportSTL({ attributes: { position: { array: positions } }, index: null });
      const stlBlob = new Blob([stlContent], { type: 'text/plain' });
      
      formData.append('file', stlBlob, 'mesh.stl');
      formData.append('name', mesh?.name || 'Untitled Mesh');
      formData.append('jsonMetadata', JSON.stringify({ controls, baselinePositions: Array.from(baselinePositions || []) }));
      
      const url = meshId && meshId !== 'new' ? `/api/meshes/${meshId}` : '/api/meshes';
      const method = meshId && meshId !== 'new' ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        alert('Mesh saved successfully!');
        if (meshId === 'new') {
          router.push(`/editor/${data.mesh.id}`);
        }
      } else {
        alert('Failed to save mesh');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (baselinePositions) {
      setPositions(new Float32Array(baselinePositions));
      setControls({
        jawWidth: 1.0,
        chinHeight: 1.0,
        mouthWidth: 1.0,
        noseLength: 1.0,
        eyeSize: 1.0,
        eyeSpacing: 1.0,
        cheekPuff: 1.0,
        faceScale: 1.0
      });
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <header className="editor-header">
        <div className="editor-title">
          <button onClick={() => router.push('/')} className="btn-secondary">
            ← Back
          </button>
          <h1>{mesh?.name || 'New Mesh'}</h1>
        </div>
<div className="editor-actions">
  <button 
    className="btn-secondary"
    onClick={() => setShowCamera(!showCamera)}
  >
    {showCamera ? 'Hide Camera' : 'Show Camera'}
  </button>
  <button 
    className="btn-secondary"
    onClick={handleReset}
    disabled={!baselinePositions}
  >
    Reset
  </button>
  <button 
    className="btn-primary"
    onClick={handleSave}
    disabled={isSaving || !positions}
  >
    {isSaving ? 'Saving...' : 'Save'}
  </button>
  <button 
    className="btn-primary"
    onClick={() => setShowExportModal(true)}
    disabled={!positions}
  >
    Export
  </button>
  <button 
    className="btn-primary"
    onClick={() => router.push('/print')}
  >
    Print
  </button>
</div>
      </header>

      <div className="editor-main">
        <div className="editor-left">
          {showCamera && (
            <FaceMeshViewer 
              onBaselineCapture={handleBaselineCapture}
              baselinePositions={baselinePositions}
            />
          )}
        </div>

        <div className="editor-center">

  <ThreeDViewer 
    positions={positions}
    controls={controls}
    baselinePositions={baselinePositions}
    onPositionUpdate={handlePositionUpdate}
    selectedTool={selectedTool}
  />
  <UndoRedo 
    onUndo={handleUndo}
    onRedo={handleRedo}
    canUndo={history.length > 0}
    canRedo={future.length > 0}
  />
</div>


        

        <div className="editor-right">
          <Controls 
            controls={controls}
            onChange={(name, value) => handleControlChange(name, value)}
            disabled={!baselinePositions}
          />
        </div>
      </div>

      {showExportModal && (
        <ExportControls
          positions={positions}
          meshName={mesh?.name || 'mesh'}
          onClose={() => setShowExportModal(false)}
        />
      )}

      <style jsx>{`
        .editor-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--bg-window);
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background: linear-gradient(to bottom, #0a246a, #a6caf0);
          color: white;
          border-bottom: 2px solid var(--border-dark);
        }
        .editor-center {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  align-items: stretch;
  overflow: hidden; /* ensures canvas doesn’t scroll */
}

        .editor-title {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .editor-title h1 {
          margin: 0;
          font-size: 16px;
        }

        .editor-actions {
          display: flex;
          gap: 10px;
        }

        .editor-main {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          gap: 10px;
          padding: 10px;
          overflow: hidden;
        }

        .editor-left, .editor-center, .editor-right {
          background: var(--bg-window);
          border: 2px solid;
          border-color: var(--border-light) var(--border-dark) var(--border-dark) var(--border-light);
          overflow: auto;
        }

        @media (max-width: 1024px) {
          .editor-main {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
          }
        }
      `}</style>
    </div>
  );
}