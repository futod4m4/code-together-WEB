import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import "../../styles/button.css";
import "../../styles/Register.css";
import "../../styles/loginbutton.css";
import "../../styles/checkbox.css";
import titleImage from "../../assets/title.png";

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const register = async () => {
    if (password !== repeatPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const registerResponse = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname,
          first_name: firstName,
          last_name: lastName,
          email,
          password
        }),
      });

      const registerResult = await registerResponse.json();
      
      if (registerResponse.ok) {
        // After successful registration, attempt login
        const loginResponse = await fetch("http://localhost:8080/auth/login", {
          method: "POST",
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (loginResponse.ok) {
          navigate('/');
        } else {
          setError('Login failed after registration');
        }
      } else {
        setError(registerResult.error || 'Registration failed');
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setError('Connection error');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    register();
  };

  return (
    <>
      <header className="header">
        <img className="titleimage" src={titleImage} alt="Title" onClick={() => {navigate("/")}}/>
      </header>
      <div className="main">
        <div className="block">
          <div className="hdiv">
            <p className="hp">Registration</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="inputdiv">
            <div className="inputp">
              <p>Email</p>
            </div>
            <input 
              className="input" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="inputdiv">
            <p className="inputp">Nickname</p>
            <input 
              className="input" 
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="new-password" 
            />
          </div>
          <div className="inputdiv">
            <p className="inputp">First Name</p>
            <input 
              className="input" 
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="new-password" 
            />
          </div>
          <div className="inputdiv">
            <p className="inputp">Last Name</p>
            <input 
              className="input" 
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
            />
          </div>
          <div className="inputdiv">
            <p className="inputp">Repeat Password</p>
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              autoComplete="new-password"
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
            <a className="joinbuttontext">Sign up</a>
          </button>
          <button className="createbutton">
            <a href="/login" className="createbuttontext">
              Already have an account? Sign In
            </a>
          </button>
        </div>
      </div>
      <footer className="footer">
        <p>© Fedor Semerenko 2024</p>
      </footer>
    </>
  );
}

export default Register;