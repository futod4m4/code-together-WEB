import titleImage from '../assets/title.png'
import '../styles/button.css'
import '../styles/App.css'
import '../styles/loginbutton.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Home() {
  const [joinCode, setJoinCode] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем авторизацию при загрузке компонента
    fetch('http://localhost:8080/auth/me', {
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        return res.json();
      })
      .then(userData => {
        setUser(userData);
      })
      .catch(err => {
        console.log('Not authenticated:', err);
        setUser(null);
      });
  }, []);

  const handleInputChange = (event) => {
    setJoinCode(event.target.value);
  };

  const handleJoinRoom = () => {
    if (joinCode.trim()) {
      fetch(`http://localhost:8080/room/code/${joinCode}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          navigate(`/room/${joinCode}`);
        })
        .catch(error => {
          alert(`Failed to join room: ${error.message}`);
        });
    } else {
      alert("Please enter a valid room code");
    }
  };

  const handleCreateRoom = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/room/create');
  };

  const handleLogout = () => {
    fetch('http://localhost:8080/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
      .then(() => {
        setUser(null);
      })
      .catch(err => console.error('Logout error:', err));
  };

  return (
    <>
      <header>
        <img 
          className="titleimage" 
          src={titleImage} 
          alt="Title" 
          onClick={() => {navigate("/")}}
        />
        <div className="user-section">
          {user ? (
            <div className="user-info">
              <span className="welcome-text">Hello, {user.nickname}</span>
              <button className="loginbutton" onClick={handleLogout}>
              <a>Log out</a>
              </button>
            </div>
          ) : (
            <button className="loginbutton">
              <a href="/login">Log in</a>
            </button>
          )}
        </div>
      </header>
      <div className="main">
        <div className="block">
          <div className="codeinputdiv">
            <p className="codeinputp">Enter room code</p>
            <input 
              className="codeinput" 
              autoFocus={true} 
              type="text" 
              autoComplete="new-password"
              value={joinCode}
              onChange={handleInputChange}
            />
          </div>
          <button className="joinbutton" onClick={handleJoinRoom}>
            <span className="joinbuttontext">Join the room</span>
          </button>
          <button 
            className="createbutton" 
            onClick={handleCreateRoom}
          >
              {user ? "Create new room" : "Login to create room"}
          </button>
        </div>
      </div>
      <footer className="footer">
        <p>© Fedor Semerenko 2024</p>
      </footer>
    </>
  );
}

export default Home;