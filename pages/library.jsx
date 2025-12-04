import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Library() {
  const router = useRouter();
  const [meshes, setMeshes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMeshes();
  }, [page, selectedFolder, searchTerm]);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchMeshes = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });

      if (selectedFolder) {
        params.append('folder', selectedFolder);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const res = await fetch(`/api/meshes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMeshes(data.meshes);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error('Failed to fetch meshes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/library/folders');
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const handleDelete = async (meshId) => {
    if (!confirm('Are you sure you want to delete this mesh?')) return;

    try {
      const res = await fetch(`/api/meshes/${meshId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setMeshes(meshes.filter(m => m.id !== meshId));
        alert('Mesh deleted successfully');
      } else {
        alert('Failed to delete mesh');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred while deleting');
    }
  };

  return (
    <div className="library-container">
      <header className="topbar">
        <div className="topbar-left">
          <button onClick={() => router.push('/')} className="btn-secondary">
            ← Back
          </button>
          <h1 className="app-title">My Mesh Library</h1>
        </div>
        <div className="topbar-right">
          <input
            type="text"
            placeholder="Search meshes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </header>

      <div className="library-main">
        <aside className="library-sidebar">
          <div className="sidebar-section">
            <h3>Folders</h3>
            <button
              className={`folder-item ${!selectedFolder ? 'active' : ''}`}
              onClick={() => setSelectedFolder(null)}
            >
               All Meshes
            </button>
            {folders.map(folder => (
              <button
                key={folder.id}
                className={`folder-item ${selectedFolder === folder.id ? 'active' : ''}`}
                onClick={() => setSelectedFolder(folder.id)}
              >
                 {folder.name}
              </button>
            ))}
          </div>
        </aside>

        <main className="library-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading meshes...</p>
            </div>
          ) : meshes.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon"></p>
              <p>No meshes found</p>
              <button 
                className="btn-primary"
                onClick={() => router.push('/editor/new')}
              >
                Create Your First Mesh
              </button>
            </div>
          ) : (
            <>
              <div className="mesh-grid">
                {meshes.map(mesh => (
                  <div key={mesh.id} className="mesh-card">
                    <div className="mesh-thumbnail">
                      {mesh.thumbnailPath ? (
                        <img src={`/uploads/${mesh.thumbnailPath}`} alt={mesh.name} />
                      ) : (
                        <div className="thumbnail-placeholder">🎭</div>
                      )}
                    </div>
                    <div className="mesh-info">
                      <h4>{mesh.name}</h4>
                      <p className="mesh-date">
                        {new Date(mesh.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mesh-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => router.push(`/editor/${mesh.id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => router.push(`/view/${mesh.id}`)}
                      >
                        View
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => handleDelete(mesh.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn-secondary"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span className="page-info">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn-secondary"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <style jsx>{`
       .library-container {
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

        .search-input {
          padding: 5px 10px;
          width: 250px;
        }

        .library-main {
          flex: 1;
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 10px;
          padding: 10px;
        }

        .library-sidebar {
          background: var(--bg-window);
          border: 2px solid;
          border-color: var(--border-light) var(--border-dark) var(--border-dark) var(--border-light);
          padding: 10px;
        }

        .sidebar-section h3 {
          margin: 0 0 10px 0;
          font-size: 11px;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        .folder-item {
          width: 100%;
          text-align: left;
          padding: 5px 10px;
          margin-bottom: 5px;
          background: var(--secondary-gray);
          border: 2px solid;
          border-color: var(--border-light) var(--border-dark) var(--border-dark) var(--border-light);
          cursor: pointer;
          font-size: 11px;
        }

        .folder-item.active {
          background: var(--primary-blue);
          color: white;
        }

        .library-content {
          background: var(--bg-window);
          border: 2px solid;
          border-color: var(--border-light) var(--border-dark) var(--border-dark) var(--border-light);
          padding: 20px;
        }

        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 15px;
        }

        .empty-icon {
          font-size: 64px;
          margin: 0;
        }

        .mesh-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .mesh-card {
          background: #fff;
          border: 2px solid;
          border-color: var(--border-light) var(--border-dark) var(--border-dark) var(--border-light);
          overflow: hidden;
        }

        .mesh-thumbnail {
          width: 100%;
          height: 160px;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 2px solid var(--border-dark);
        }

        .mesh-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail-placeholder {
          font-size: 48px;
        }

        .mesh-info {
          padding: 10px;
        }

        .mesh-info h4 {
          margin: 0 0 5px 0;
          font-size: 12px;
        }

        .mesh-date {
          margin: 0;
          font-size: 10px;
          color: var(--text-secondary);
        }

        .mesh-actions {
          padding: 10px;
          border-top: 1px solid var(--border-dark);
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .mesh-actions button {
          flex: 1;
          min-width: 60px;
          font-size: 10px;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          padding: 20px 0;
        }

        .page-info {
          font-size: 11px;
        }

        @media (max-width: 768px) {
          .library-main {
            grid-template-columns: 1fr;
          }

          .library-sidebar {
            display: none;
          }

          .mesh-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}