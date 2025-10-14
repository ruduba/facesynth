import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Presets() {
  const router = useRouter();
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const res = await fetch('/api/presets');
      if (res.ok) {
        const data = await res.json();
        setPresets(data.presets);
      }
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsePreset = (preset) => {
    router.push(`/editor/new?preset=${preset.id}`);
  };

  return (
    <div className="presets-container">
      <header className="topbar">
        <div className="topbar-left">
          <button onClick={() => router.push('/')} className="btn-secondary">
            ← Back
          </button>
          <h1 className="app-title">Preset Meshes</h1>
        </div>
        <div className="topbar-right">
          <span className="preset-count">
            {presets.length} presets available
          </span>
        </div>
      </header>

      <main className="presets-main">
        <div className="presets-intro">
          <h2>Choose a Starting Point</h2>
          <p>Select a preset to open in the editor and customize it to your liking</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading presets...</p>
          </div>
        ) : (
          <div className="presets-grid">
            {presets.map(preset => (
              <div key={preset.id} className="preset-card">
                <div className="preset-thumbnail">
                  {preset.thumbnailPath ? (
                    <img src={`/uploads/${preset.thumbnailPath}`} alt={preset.name} />
                  ) : (
                    <div className="thumbnail-placeholder">
                      {getPresetEmoji(preset.name)}
                    </div>
                  )}
                </div>
                <div className="preset-info">
                  <h3>{preset.name}</h3>
                  <p>{preset.description}</p>
                </div>
                <div className="preset-actions">
                  <button
                    className="btn-primary"
                    onClick={() => handleUsePreset(preset)}
                  >
                    Use This Preset
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style jsx>{`
        .presets-container {
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

        .preset-count {
          font-size: 11px;
        }

        .presets-main {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 30px 20px;
          width: 100%;
        }

        .presets-intro {
          text-align: center;
          margin-bottom: 40px;
        }

        .presets-intro h2 {
          font-size: 18px;
          margin-bottom: 10px;
        }

        .presets-intro p {
          color: var(--text-secondary);
          font-size: 12px;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 15px;
        }

        .presets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 25px;
        }

        .preset-card {
          background: #fff;
          border: 3px solid;
          border-color: var(--border-light) var(--border-dark) var(--border-dark) var(--border-light);
          overflow: hidden;
          transition: transform 0.2s;
        }

        .preset-card:hover {
          transform: translateY(-3px);
        }

        .preset-thumbnail {
          width: 100%;
          height: 200px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 2px solid var(--border-dark);
        }

        .preset-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail-placeholder {
          font-size: 80px;
          filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
        }

        .preset-info {
          padding: 15px;
        }

        .preset-info h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: var(--primary-blue);
        }

        .preset-info p {
          margin: 0;
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .preset-actions {
          padding: 15px;
          border-top: 1px solid var(--border-dark);
        }

        .preset-actions button {
          width: 100%;
        }

        @media (max-width: 768px) {
          .presets-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}

function getPresetEmoji(presetName) {
  const emojiMap = {
    'Long Chin': '🗿',
    'Long Nose': '👃',
    'Clown Mouth': '🤡',
    'Alien': '👽',
    'Button Nose': '😊',
    'Chipmunk Cheeks': '🐿️',
    'Square Jaw': '💪',
    'Big Eyes': '👁️',
    'Slim Face': '😌',
    'Giant Head': '🤯'
  };
  return emojiMap[presetName] || '🎭';
}