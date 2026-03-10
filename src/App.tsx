import { Routes, Route } from 'react-router-dom';
import './App.css';
import HomeScreen from './screens/HomeScreen';
import Practice from './screens/Practice';
import Metronome from './screens/Metronome';
import Exercises from './screens/Exercises';
import Progress from './screens/Progress';
import ConnectMIDI from './screens/ConnectMIDI'
import About from './screens/About';
import Settings from './screens/Settings';

function App() {
  return (
    <div className="app">
      
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          {/* <Route path="/hometest" element={<HomeTest />} /> */}
          <Route path="/practice" element={<Practice />} />
          <Route path="/metronome" element={<Metronome />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/connectmidi" element={<ConnectMIDI />} />
          <Route path="/about" element={<About/>} />
          <Route path="/settings" element={<Settings/>} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>Practice makes perfect! Keep drumming! 🎵</p>
      </footer>
    </div>
  );
}

export default App;
