import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TutorialModal from '../components/Auth/TutorialModal';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        
        // Show tutorial if not seen
        if (!data.user.tutorialSeen) {
          setShowTutorial(true);
        }
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleTutorialComplete = async () => {
    setShowTutorial(false);
    await fetch('/api/user/tutorial-seen', { method: 'POST' });
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading FaceSynth.exe...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="app-title">FaceSynth.exe</h1>
        </div>
        <div className="topbar-right">
          <button 
            className="btn-link" 
            onClick={() => setShowTutorial(true)}
          >
            Tutorial
          </button>
          <div className="user-menu">
            <span className="user-name">{user?.name || user?.email}</span>
            <button className="btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome to FaceSynth.exe</h2>
          <p className="subtitle">Create, edit, and 3D print custom facial meshes</p>
        </div>

        <div className="dashboard-cards">
          <div 
            className="dashboard-card card-create"
            onClick={() => router.push('/editor/new')}
          >
            <div className="card-icon">✨</div>
            <h3>Create New Mesh</h3>
            <p>Start from scratch or capture from camera</p>
            <button className="btn-primary">Get Started</button>
          </div>

          <div 
            className="dashboard-card card-library"
            onClick={() => router.push('/library')}
          >
            <div className="card-icon">📁</div>
            <h3>My Mesh Library</h3>
            <p>Browse and manage your saved meshes</p>
            <button className="btn-primary">View Library</button>
          </div>

          <div 
            className="dashboard-card card-presets"
            onClick={() => router.push('/presets')}
          >
            <div className="card-icon">🎭</div>
            <h3>Check Out Presets</h3>
            <p>Explore fun predefined face meshes</p>
            <button className="btn-primary">Browse Presets</button>
          </div>
        </div>
      </main>

      {showTutorial && (
        <TutorialModal onComplete={handleTutorialComplete} />
      )}
    </div>
  );
}