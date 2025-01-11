import { useNavigate } from 'react-router-dom'
import titleImage from '../../assets/title.png'
import '../../styles/button.css'
import '../../styles/Login.css'
import '../../styles/loginbutton.css'
import { useState } from 'react'

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const login = async () => {
    try {
      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        credentials: 'include', // Важно для работы с куками
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      
      if (response.ok) {
        // Если логин успешен, перенаправляем на главную страницу
        navigate('/');
      } else {
        // Если есть ошибка, показываем её
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError('Connection error');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login();
  };

  return (
    <>
      <header className="header">
        <img className="titleimage" src={titleImage} alt="Title" onClick={() => {navigate("/")}}/>
      </header>
      <div className="main">
        <div className="block">
          <div className='hdiv'>
            <p className="hp">Login</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="inputdiv">
            <div className="inputp">
              <p>Email or Username</p>
            </div>
            <input 
              className="input" 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="inputdiv">
            <p className="inputp">Password</p>
            <input 
              className="input" 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus={true}
            />
          </div>
          <div className="showpassdiv">
            <label className="container">
              <input
                type="checkbox"
                onChange={togglePasswordVisibility}
              />
              <svg viewBox="0 0 64 64" height="1.4em" width="1.4em">
                <path
                  d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
                  pathLength="575.0541381835938"
                  className="path"
                ></path>
              </svg>
            </label>
            <p className="showpassp">Show Password</p>
          </div>
          <button className="joinbutton" onClick={handleSubmit}>
            <a className="joinbuttontext">Sign in</a>
          </button>
          <button className="createbutton">
            <a href='/registration' className="createbuttontext">Don't have an account? Sign Up</a>
          </button>
          <button className="forgotbutton">
            Forgot password?
          </button>
        </div>
      </div>
      <footer className="footer">
        <p>© Fedor Semerenko 2024</p>
      </footer>
    </>
  );
}

export default Login;