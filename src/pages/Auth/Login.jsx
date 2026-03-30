import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { API_URL } from '../../config'
import '../../styles/App.css'

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (response.ok) {
        navigate(redirect);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('Connection error');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login();
  };

  return (
    <div className="page">
      <header className="page-header">
        <span className="logo" onClick={() => navigate("/")}>CodeCollab</span>
      </header>

      <main className="page-main">
        <div className="auth-card">
          <form className="card" onSubmit={handleSubmit}>
            <h1 className="auth-title">Sign In</h1>
            {error && <div className="form-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="input"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="show-pass-row">
              <input type="checkbox" id="show-pass" onChange={() => setShowPassword(!showPassword)} />
              <label htmlFor="show-pass">Show password</label>
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
              Sign in
            </button>
            <div className="auth-footer">
              <a href="/registration">Don't have an account? Sign up</a>
            </div>
          </form>
        </div>
      </main>

      <footer className="page-footer">Fedor Semerenko {new Date().getFullYear()}</footer>
    </div>
  );
}

export default Login;
