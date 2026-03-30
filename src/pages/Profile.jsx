import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import '../styles/App.css';

const languageColors = {
  javascript: '#f7df1e', java: '#f8981d', go: '#00add8',
  rust: '#dea584', python: '#306998', php: '#777bb3',
};

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ avatar_url: '', github_url: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setForm({ avatar_url: data.avatar_url || '', github_url: data.github_url || '', bio: data.bio || '' });
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/room/my/list`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setProjects(data); })
      .catch(() => {});
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(prev => ({ ...prev, ...updated }));
        setEditing(false);
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (u) => {
    if (!u) return '?';
    return (u.nickname || u.first_name || '?').charAt(0).toUpperCase();
  };

  if (!user) return null;

  return (
    <div className="page">
      <header className="page-header">
        <span className="logo" onClick={() => navigate("/")}>CodeCollab</span>
        <button className="btn btn-ghost" onClick={() => navigate("/")}>Back</button>
      </header>

      <main className="page-main" style={{ alignItems: 'flex-start', paddingTop: '40px' }}>
        <div style={{ width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Profile card */}
          <div className="card" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
              background: user.avatar_url ? `url(${user.avatar_url}) center/cover` : 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 600, color: '#000',
              fontFamily: 'var(--font-display)',
            }}>
              {!user.avatar_url && getInitials(user)}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 28 }}>{user.nickname}</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                    {user.first_name} {user.last_name}
                  </p>
                </div>
                <button className="btn" onClick={() => setEditing(!editing)}>
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {user.bio && !editing && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{user.bio}</p>
              )}

              {user.github_url && !editing && (
                <a
                  href={user.github_url.startsWith('http') ? user.github_url : `https://github.com/${user.github_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13 }}
                >
                  GitHub: {user.github_url}
                </a>
              )}

              {editing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Avatar URL</label>
                    <input className="input" value={form.avatar_url}
                      onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))}
                      placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GitHub</label>
                    <input className="input" value={form.github_url}
                      onChange={e => setForm(p => ({ ...p, github_url: e.target.value }))}
                      placeholder="username or full URL" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <input className="input" value={form.bio}
                      onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                      placeholder="Tell us about yourself" />
                  </div>
                  <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Projects */}
          <div>
            <h2 className="section-title">My Projects</h2>
            {projects.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No projects yet.</p>
            ) : (
              <div className="projects-grid">
                {projects.map(p => (
                  <div key={p.room_id} className="project-card" onClick={() => navigate(`/room/${p.join_code}`)}>
                    <div className="project-card-header">
                      <span className="project-card-name">{p.room_name}</span>
                      <span className="project-card-lang"
                        style={{ backgroundColor: languageColors[p.language] || '#666', color: '#000' }}>
                        {p.language}
                      </span>
                    </div>
                    <div className="project-card-footer">
                      <span className="project-card-code">{p.join_code}</span>
                      <span className="project-card-date">{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="page-footer">Fedor Semerenko {new Date().getFullYear()}</footer>
    </div>
  );
}

export default Profile;
