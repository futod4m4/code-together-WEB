import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { API_URL } from '../../config'
import '../../styles/App.css'

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
];

const langExtensions = {
  javascript: '.js',
  python: '.py',
  go: '.go',
  java: '.java',
  rust: '.rs',
  php: '.php',
};

function CreateNewRoom() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [importMode, setImportMode] = useState(false);

  const createRoom = async () => {
    setLoading(true);
    setError('');
    try {
      const createRoomResponse = await fetch(`${API_URL}/room/create`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          roomName ? { room_name: roomName, language } : { language }
        ),
      });
      if (!createRoomResponse.ok) throw new Error('Failed to create project');
      const roomData = await createRoomResponse.json();

      const createCodeResponse = await fetch(`${API_URL}/room_code/create`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomData.room_id }),
      });
      if (!createCodeResponse.ok) throw new Error('Failed to create project code');

      // Create default boilerplate files per language
      const boilerplate = {
        javascript: [
          { filename: 'index.js', content: '// Entry point\nconsole.log("Hello, World!");\n' },
          { filename: 'utils.js', content: '// Utility functions\n\nexport function add(a, b) {\n  return a + b;\n}\n' },
        ],
        python: [
          { filename: 'main.py', content: '# Entry point\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n' },
          { filename: 'utils.py', content: '# Utility functions\n\ndef add(a, b):\n    return a + b\n' },
        ],
        go: [
          { filename: 'main.go', content: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, World!")\n}\n' },
        ],
        java: [
          { filename: 'Main.java', content: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n' },
        ],
        rust: [
          { filename: 'main.rs', content: 'fn main() {\n    println!("Hello, World!");\n}\n' },
        ],
        php: [
          { filename: 'index.php', content: '<?php\n\necho "Hello, World!\\n";\n' },
        ],
      };

      const files = boilerplate[language] || [{ filename: `main${langExtensions[language] || '.txt'}`, content: '' }];
      if (importMode && githubUrl.trim()) {
        // Import from GitHub instead of boilerplate
        await fetch(`${API_URL}/github/import`, {
          method: "POST",
          credentials: 'include',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_id: roomData.room_id, url: githubUrl.trim() }),
        });
      } else {
        for (let i = 0; i < files.length; i++) {
          await fetch(`${API_URL}/files/create`, {
            method: "POST",
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              room_id: roomData.room_id,
              filename: files[i].filename,
              language,
              content: files[i].content,
              is_entry_point: i === 0,
            }),
          });
        }
      }

      if (roomData.join_code) {
        navigate(`/room/${roomData.join_code}`);
      } else {
        throw new Error('No join code received');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <span className="logo" onClick={() => navigate("/")}>CodeCollab</span>
      </header>

      <main className="page-main">
        <div className="create-card">
          <div className="card">
            <h1 className="auth-title">New Project</h1>
            {error && <div className="form-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Project name</label>
              <input
                className="input"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="My awesome project"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Language (cannot be changed later)</label>
              <div className="lang-grid">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    className={`lang-option ${language === lang.value ? 'selected' : ''}`}
                    onClick={() => setLanguage(lang.value)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={createRoom}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create project"}
            </button>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', fontSize: 12 }}
                onClick={() => setImportMode(!importMode)}
                type="button"
              >
                {importMode ? "Hide import" : "Import from GitHub"}
              </button>
              {importMode && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    className="input"
                    placeholder="owner/repo or full GitHub URL"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: 0 }}>
                    Creates project and imports files (max 50 files, 100KB each)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="page-footer">Fedor Semerenko {new Date().getFullYear()}</footer>
    </div>
  );
}

export default CreateNewRoom;
