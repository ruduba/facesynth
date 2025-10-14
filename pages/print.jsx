import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Print() {
  const router = useRouter();
  const [printers, setPrinters] = useState([]);
  const [meshes, setMeshes] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [selectedMesh, setSelectedMesh] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [printerForm, setPrinterForm] = useState({
    name: '',
    baseUrl: '',
    apiKey: ''
  });
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    fetchPrinters();
    fetchMeshes();
  }, []);

  useEffect(() => {
    let interval;
    if (printing && selectedPrinter) {
      interval = setInterval(() => {
        fetchJobStatus();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [printing, selectedPrinter]);

  const fetchPrinters = async () => {
    try {
      const res = await fetch('/api/printers');
      if (res.ok) {
        const data = await res.json();
        setPrinters(data.printers);
      }
    } catch (error) {
      console.error('Failed to fetch printers:', error);
    }
  };

  const fetchMeshes = async () => {
    try {
      const res = await fetch('/api/meshes?limit=100');
      if (res.ok) {
        const data = await res.json();
        setMeshes(data.meshes);
      }
    } catch (error) {
      console.error('Failed to fetch meshes:', error);
    }
  };

  const fetchJobStatus = async () => {
    if (!selectedPrinter) return;

    try {
      const res = await fetch(`/api/printers/${selectedPrinter}/job`);
      if (res.ok) {
        const data = await res.json();
        setJobStatus(data.job);
        
        if (data.job.state === 'Operational' || data.job.state === 'Offline') {
          setPrinting(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch job status:', error);
    }
  };

  const handleAddPrinter = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printerForm)
      });

      if (res.ok) {
        alert('Printer added successfully!');
        setShowAddPrinter(false);
        setPrinterForm({ name: '', baseUrl: '', apiKey: '' });
        fetchPrinters();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add printer');
      }
    } catch (error) {
      console.error('Add printer error:', error);
      alert('An error occurred');
    }
  };

  const handleStartPrint = async () => {
    if (!selectedPrinter || !selectedMesh) {
      alert('Please select both a printer and a mesh');
      return;
    }

    setPrinting(true);

    try {
      const res = await fetch(`/api/printers/${selectedPrinter}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meshId: selectedMesh,
          options: {}
        })
      });

      if (res.ok) {
        alert('Print job started!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to start print');
        setPrinting(false);
      }
    } catch (error) {
      console.error('Print error:', error);
      alert('An error occurred');
      setPrinting(false);
    }
  };

  const handleTestPrint = async () => {
    if (!selectedPrinter) {
      alert('Please select a printer first');
      return;
    }

    alert('Test print feature would generate a small test nose and send to printer');
  };

  return (
    <div className="print-container">
      <header className="topbar">
        <div className="topbar-left">
          <button onClick={() => router.push('/')} className="btn-secondary">
            ← Back
          </button>
          <h1 className="app-title">3D Print</h1>
        </div>
        <div className="topbar-right">
          <button 
            className="btn-primary"
            onClick={() => setShowAddPrinter(true)}
          >
            + Add Printer
          </button>
        </div>
      </header>

      <main className="print-main">
        <div className="print-section">
          <h2>1. Select Printer</h2>
          {printers.length === 0 ? (
            <div className="empty-box">
              <p>No printers configured</p>
              <button 
                className="btn-primary"
                onClick={() => setShowAddPrinter(true)}
              >
                Add Your First Printer
              </button>
            </div>
          ) : (
            <div className="printer-list">
              {printers.map(printer => (
                <div
                  key={printer.id}
                  className={`printer-item ${selectedPrinter === printer.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPrinter(printer.id)}
                >
                  <div className="printer-icon">🖨️</div>
                  <div className="printer-info">
                    <h3>{printer.name}</h3>
                    <p>{printer.baseUrl}</p>
                    {printer.lastSeen && (
                      <span className="printer-status">
                        Last seen: {new Date(printer.lastSeen).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="print-section">
          <h2>2. Select Mesh</h2>
          {meshes.length === 0 ? (
            <div className="empty-box">
              <p>No meshes available</p>
              <button 
                className="btn-primary"
                onClick={() => router.push('/editor/new')}
              >
                Create a Mesh
              </button>
            </div>
          ) : (
            <select 
              value={selectedMesh || ''}
              onChange={(e) => setSelectedMesh(e.target.value)}
              className="mesh-select"
            >
              <option value="">Choose a mesh...</option>
              {meshes.map(mesh => (
                <option key={mesh.id} value={mesh.id}>
                  {mesh.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="print-section">
          <h2>3. Print</h2>
          <div className="print-actions">
            <button
              className="btn-primary"
              onClick={handleStartPrint}
              disabled={!selectedPrinter || !selectedMesh || printing}
            >
              {printing ? 'Printing...' : 'Start Print'}
            </button>
            <button
              className="btn-secondary"
              onClick={handleTestPrint}
              disabled={!selectedPrinter}
            >
              Print Test Nose
            </button>
          </div>

          {jobStatus && (
            <div className="job-status">
              <h3>Print Status</h3>
              <p><strong>State:</strong> {jobStatus.state}</p>
              {jobStatus.progress && (
                <>
                  <p><strong>Progress:</strong> {Math.round(jobStatus.progress.completion)}%</p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${jobStatus.progress.completion}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {showAddPrinter && (
        <div className="modal-overlay" onClick={() => setShowAddPrinter(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="window-title">Add Printer</div>
            
            <form onSubmit={handleAddPrinter} className="printer-form">
              <div className="form-group">
                <label>Printer Name</label>
                <input
                  type="text"
                  value={printerForm.name}
                  onChange={(e) => setPrinterForm({...printerForm, name: e.target.value})}
                  required
                  placeholder="My Printer"
                />
              </div>

              <div className="form-group">
                <label>OctoPrint URL</label>
                <input
                  type="text"
                  value={printerForm.baseUrl}
                  onChange={(e) => setPrinterForm({...printerForm, baseUrl: e.target.value})}
                  required
                  placeholder="http://192.168.1.100"
                />
              </div>

              <div className="form-group">
                <label>API Key</label>
                <input
                  type="text"
                  value={printerForm.apiKey}
                  onChange={(e) => setPrinterForm({...printerForm, apiKey: e.target.value})}
                  required
                  placeholder="Your OctoPrint API key"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddPrinter(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Printer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .print-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-window);
        }

        .topbar {
          background: linear-gradient(to bottom, #0a246a, #a6caf0);
          color: #ffffff;
          padding: 10px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid var(--border-dark);
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .print-main {
          flex: 1;
          max-width: 900px;
          margin: 0 auto;
          padding: 30px 20px;
          width: 100%;
        }

        .print-section {
          background: #fff;
          border: 2px solid;
          border-color: var(--border-light) var(--border-dark) var(--border-dark) var(--border-light);
          padding: 20px;
          margin-bottom: 20px;
        }

        .print-section h2 {
          margin: 0 0 15px 0;
          font-size: 14px;
          color: var(--primary-blue);
        }

        .empty-box {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary);
        }

        .printer-list {
          display: grid;
          gap: 10px;
        }

        .printer-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border: 2px solid var(--border-dark);
          cursor: pointer;
          background: var(--bg-window);
        }

        .printer-item:hover {
          background: #f0f0f0;
        }

        .printer-item.selected {
          border-color: var(--primary-blue);
          background: #e6f0ff;
        }

        .printer-icon {
          font-size: 32px;
        }

        .printer-info h3 {
          margin: 0 0 5px 0;
          font-size: 12px;
        }

        .printer-info p {
          margin: 0;
          font-size: 10px;
          color: var(--text-secondary);
        }

        .printer-status {
          font-size: 10px;
          color: var(--success-green);
        }

        .mesh-select {
          width: 100%;
          padding: 8px;
        }

        .print-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .job-status {
          background: var(--bg-window);
          padding: 15px;
          border: 2px solid var(--border-dark);
        }

        .job-status h3 {
          margin: 0 0 10px 0;
          font-size: 12px;
        }

        .job-status p {
          margin: 5px 0;
          font-size: 11px;
        }

        .progress-bar {
          width: 100%;
          height: 20px;
          background: var(--secondary-gray);
          border: 2px solid var(--border-dark);
          margin-top: 10px;
        }

        .progress-fill {
          height: 100%;
          background: var(--primary-blue);
          transition: width 0.3s;
        }

        .printer-form {
          padding: 20px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}