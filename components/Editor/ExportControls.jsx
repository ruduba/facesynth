//components/Editor/ExportControls.jsx

import { useState } from 'react';

export default function ExportControls({ positions, meshName, onClose }) {
  const [format, setFormat] = useState('stl');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!positions) return;

    setExporting(true);

    try {
      const { exportSTL, exportOBJ, exportPLY, downloadFile } = await import('../../lib/stlExport');
      const { FACEMESH_TRIANGLES } = await import('../../lib/facemesh-triangles');

      // Create geometry object
      const geometry = {
        attributes: {
          position: {
            array: positions
          }
        },
        index: {
          array: new Uint16Array(FACEMESH_TRIANGLES.flat())
        }
      };

      let content, filename, mimeType;

      switch (format) {
        case 'stl':
          content = exportSTL(geometry);
          filename = `${meshName}.stl`;
          mimeType = 'text/plain';
          break;
        case 'obj':
          content = exportOBJ(geometry);
          filename = `${meshName}.obj`;
          mimeType = 'text/plain';
          break;
        case 'ply':
          content = exportPLY(geometry);
          filename = `${meshName}.ply`;
          mimeType = 'text/plain';
          break;
      }

      downloadFile(content, filename, mimeType);
      alert('Export successful!');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="window-title">Export Mesh</div>

        <div className="modal-body">
          <p>Select export format:</p>

          <div className="format-options">
            <label className="format-option">
              <input
                type="radio"
                name="format"
                value="stl"
                checked={format === 'stl'}
                onChange={(e) => setFormat(e.target.value)}
              />
              <div className="format-info">
                <strong>STL</strong>
                <span>Standard for 3D printing</span>
              </div>
            </label>

            <label className="format-option">
              <input
                type="radio"
                name="format"
                value="obj"
                checked={format === 'obj'}
                onChange={(e) => setFormat(e.target.value)}
              />
              <div className="format-info">
                <strong>OBJ</strong>
                <span>Wavefront object format</span>
              </div>
            </label>

            <label className="format-option">
              <input
                type="radio"
                name="format"
                value="ply"
                checked={format === 'ply'}
                onChange={(e) => setFormat(e.target.value)}
              />
              <div className="format-info">
                <strong>PLY</strong>
                <span>Polygon file format</span>
              </div>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={onClose}
            disabled={exporting}
          >
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--bg-window);
          border: 3px solid;
          border-color: var(--border-light) var(--border-dark) var(--border-dark) var(--border-light);
          width: 90%;
          max-width: 450px;
          box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
        }

        .window-title {
          background: linear-gradient(to right, #0a246a, #a6caf0);
          color: #ffffff;
          padding: 3px 5px;
          font-weight: bold;
          font-size: 11px;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-body p {
          margin: 0 0 15px 0;
          font-size: 11px;
        }

        .format-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .format-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border: 2px solid var(--border-dark);
          cursor: pointer;
          background: #fff;
        }

        .format-option:hover {
          background: #f0f0f0;
        }

        .format-option input[type="radio"] {
          margin: 0;
        }

        .format-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .format-info strong {
          font-size: 11px;
        }

        .format-info span {
          font-size: 10px;
          color: var(--text-secondary);
        }

        .modal-footer {
          padding: 10px;
          border-top: 2px solid var(--border-dark);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
      `}</style>
    </div>
  );
}