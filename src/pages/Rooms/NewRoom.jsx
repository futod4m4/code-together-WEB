import { useNavigate } from 'react-router-dom';
import titleImage from '../../assets/title.png';
import { useState } from 'react';
import '../../styles/Rooms/CreateNewRoom.css'
import SelectBox from '../../elements/SelectBox';

function CreateNewRoom() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [language, setLanguage] = useState('js');
  const [error, setError] = useState('');

  const languages = [
    { value: 'js', label: 'JavaScript' },
    { value: 'java', label: 'Java' },
    { value: 'go', label: 'Go' },
    { value: 'php', label: 'PHP' },
    { value: 'rust', label: 'Rust' },
    { value: 'python', label: 'Python' }
  ];

  const createRoom = async () => {
    try {
      // Создание комнаты и получение join_code
      const createRoomResponse = await fetch("http://localhost:8080/room/create", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          roomName ? 
          { room_name: roomName, language: language } : 
          { language: language }
        ),
      });

      if (!createRoomResponse.ok) {
        throw new Error('Failed to create room');
      }

      const roomData = await createRoomResponse.json();
      
      // Создание room_code
      const createCodeResponse = await fetch("http://localhost:8080/room_code/create", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          room_id: roomData.room_id 
        }),
      });

      if (!createCodeResponse.ok) {
        throw new Error('Failed to create room code');
      }

      await createCodeResponse.json();
      
      // Перенаправление на страницу комнаты
      if (roomData.join_code) {
        navigate(`/room/${roomData.join_code}`);
      } else {
        throw new Error('No join code received');
      }
    } catch (error) {
      console.error("Error creating room:", error);
      setError('Failed to create room');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createRoom();
  };

  return (
    <>
      <header className="header">
        <img className="titleimage" src={titleImage} alt="Title" onClick={() => {navigate("/")}}/>
      </header>
      <div className="main">
        <div className="block">
          <div className='hdiv'>
            <p className="hp">Create New Room</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="inputdiv">
            <div className="inputp">
              <p>Room Name</p>
            </div>
            <input 
              className="input" 
              type="text" 
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
            />
          </div>
          <div className="inputdiv">
            <p className="inputp">Select Language</p>
            <SelectBox></SelectBox>
          </div>
          <button className="joinbutton" onClick={handleSubmit}>
            Create Room
          </button>
        </div>
      </div>
      <footer className="footer">
        <p>© Fedor Semerenko 2024</p>
      </footer>
    </>
  );
}

export default CreateNewRoom;