import '../styles/App.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

const languageColors = {
  javascript: '#f7df1e',
  java: '#f8981d',
  go: '#00add8',
  rust: '#dea584',
  python: '#306998',
  php: '#777bb3',
};

function Home() {
  const [joinCode, setJoinCode] = useState("");
  const [user, setUser] = useState(null);
  const [myProjects, setMyProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(userData => setUser(userData))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/room/my/list`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setMyProjects(data);
      })
      .catch(() => setMyProjects([]));
  }, [user]);

  const handleJoinProject = () => {
    if (!joinCode.trim()) return;
    fetch(`${API_URL}/room/code/${joinCode}`)
      .then(res => {
        if (!res.ok) throw new Error('Project not found');
        return res.json();
      })
      .then(() => navigate(`/room/${joinCode}`))
      .catch(error => alert(error.message));
  };

  const handleLogout = () => {
    fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
      .then(() => { setUser(null); setMyProjects([]); })
      .catch(() => {});
  };

  const deleteProject = async (roomId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      await fetch(`${API_URL}/room/${roomId}`, {
        method: 'DELETE', credentials: 'include',
      });
      setMyProjects(prev => prev.filter(p => p.room_id !== roomId));
    } catch {}
  };

  const togglePrivate = async (project, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/room/${project.room_id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_name: project.room_name, is_private: !project.is_private }),
      });
      setMyProjects(prev => prev.map(p =>
        p.room_id === project.room_id ? { ...p, is_private: !p.is_private } : p
      ));
    } catch {}
  };

  return (
    <div className="page">
      <header className="page-header">
        <span className="logo" onClick={() => navigate("/")}>CodeCollab</span>
        <div className="user-section">
          {user ? (
            <div className="user-info">
              <span className="user-nickname" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>{user.nickname}</span>
              <button className="btn" onClick={() => navigate('/profile')}>Profile</button>
              <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
            </div>
          ) : (
            <button className="btn" onClick={() => navigate('/login')}>Log in</button>
          )}
        </div>
      </header>

      <main className="page-main">
        <div className="home-content">
          <div className="home-hero">
            <h1 className="home-title">CodeCollab</h1>
            <p className="home-subtitle">collaborative IDE in the browser</p>
          </div>

          <div className="home-actions">
            <div className="join-row">
              <input
                className="input"
                type="text"
                placeholder="Enter project code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleJoinProject(); }}
              />
              <button className="btn btn-primary" onClick={handleJoinProject}>Join</button>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => user ? navigate('/room/create') : navigate('/login')}
            >
              {user ? "New project" : "Log in to create"}
            </button>
          </div>

          {user && myProjects.length > 0 && (
            <div className="projects-section">
              <h2 className="section-title">My Projects</h2>
              <div className="projects-grid">
                {myProjects.map((project) => (
                  <div
                    key={project.room_id}
                    className="project-card"
                    onClick={() => navigate(`/room/${project.join_code}`)}
                  >
                    <div className="project-card-header">
                      <span className="project-card-name">{project.room_name}</span>
                      <span
                        className="project-card-lang"
                        style={{ backgroundColor: languageColors[project.language] || '#666', color: '#000' }}
                      >
                        {project.language}
                      </span>
                    </div>
                    <div className="project-card-footer">
                      <span className="project-card-code">{project.join_code}</span>
                      <span className="project-card-date">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="project-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className={`card-action-btn ${project.is_private ? 'active' : ''}`}
                        onClick={(e) => togglePrivate(project, e)}
                        title={project.is_private ? 'Private — click to make public' : 'Public — click to make private'}
                      >
                        {project.is_private ? 'Private' : 'Public'}
                      </button>
                      <button
                        className="card-action-btn danger"
                        onClick={(e) => deleteProject(project.room_id, e)}
                        title="Delete project"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="page-footer">Fedor Semerenko {new Date().getFullYear()}</footer>
    </div>
  );
}

export default Home;
