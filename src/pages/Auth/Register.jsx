import { useState } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_URL } from '../../config'
import '../../styles/App.css'

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [showPassword, setShowPassword] = useState(false);
  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');

  const register = async () => {
    if (password !== repeatPassword) {
      setError("Passwords don't match");
      return;
    }
    try {
      const registerResponse = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, first_name: firstName, last_name: lastName, email, password }),
      });
      const registerResult = await registerResponse.json();
      if (registerResponse.ok) {
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          credentials: 'include',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (loginResponse.ok) {
          navigate(redirect);
        } else {
          setError('Login failed after registration');
        }
      } else {
        setError(registerResult.error || 'Registration failed');
      }
    } catch {
      setError('Connection error');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    register();
  };

  return (
    <div className="page">
      <header className="page-header">
        <span className="logo" onClick={() => navigate("/")}>CodeCollab</span>
      </header>

      <main className="page-main">
        <div className="auth-card">
          <form className="card" onSubmit={handleSubmit}>
            <h1 className="auth-title">Sign Up</h1>
            {error && <div className="form-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Nickname</label>
              <input className="input" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">First name</label>
                <input className="input" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Last name</label>
                <input className="input" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="input" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Repeat password</label>
              <input className="input" type={showPassword ? "text" : "password"} value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} />
            </div>
            <div className="show-pass-row">
              <input type="checkbox" id="show-pass" onChange={() => setShowPassword(!showPassword)} />
              <label htmlFor="show-pass">Show password</label>
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
              Create account
            </button>
            <div className="auth-footer">
              <a href="/login">Already have an account? Sign in</a>
            </div>
          </form>
        </div>
      </main>

      <footer className="page-footer">Fedor Semerenko {new Date().getFullYear()}</footer>
    </div>
  );
}

export default Register;
