import { NavLink } from 'react-router-dom';
import './Navigation.css';

export const Navigation: React.FC = () => {
  return (
    <nav className="main-navigation">
      <div className="nav-brand">
        <NavLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>🥁 Drum Kit Learning Platform</h1>
        </NavLink>
      </div>
      <div className="nav-links">
        {/* <NavLink
          to="/"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          🏠 Home
        </NavLink> */}
        {/* <NavLink
          to="/hometest"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          🏠 HomeTest
        </NavLink> */}
        <NavLink
          to="/about"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          ℹ️ About
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          ⚙️ Settings
        </NavLink>
      </div>
    </nav>
  );
};
