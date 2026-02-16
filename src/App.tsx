import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation/Navigation';
import { HomeScreen } from './screens/Home';
import { AboutScreen } from './screens/About';
import { SettingsScreen } from './screens/Settings';
import './App.css';
import HomeTest from './screens/HomeTest';
import Practice from './screens/Practice';

function App() {
  return (
    <div className="app">
      {/* <Navigation /> */}
      
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/hometest" element={<HomeTest />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/about" element={<AboutScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>Practice makes perfect! Keep drumming! 🎵</p>
      </footer>
    </div>
  );
}

export default App;
