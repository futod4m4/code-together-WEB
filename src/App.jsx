import titleImage from './assets/title.png'
import './styles/button.css'
import './styles/App.css'
import './styles/loginbutton.css'

function App() {
  return (
    <>
  <header>
        <div className="header">
            <img className="titleimage"  src={titleImage} />
            <button className="loginbutton">
                Log in 
            </button>
        </div>
    </header>
    <div className="main">
        <div className="block">
            <div className="codeinputdiv">
                <p className="codeinputp">Enter room code</p>
                <input className="codeinput" type="text" autocomplete="off" />
            </div>
                <button className ="joinbutton">
                        Join the room
                </button>
                <button className = "createbutton">
                        Or create your own
                </button>
        </div>
    </div>
    <footer>
            <p>© Fedor Semerenko 2024</p>
    </footer>
    </>
  )
}

export default App
