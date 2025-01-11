import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from './pages/Home.jsx'
import Login from './pages/Auth/Login.jsx'
import Register from "./pages/Auth/Register.jsx";
import Room from "./pages/Rooms/Room.tsx"
import CreateNewRoom from "./pages/Rooms/NewRoom.jsx";


function App() {
  return (
      <Router>
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/registration" element={<Register />} />
              <Route path="/login" element={<Login />} />     
              <Route path="/room/:joinCode" element={<Room />} />    
              <Route path="/room/create" element={<CreateNewRoom />} />     
          </Routes>
      </Router>
  );
};

export default App;

