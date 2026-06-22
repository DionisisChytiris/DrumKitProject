import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';
import { AuthModal, type AuthMode } from '@/Modals/AuthModal';

export const Navigation: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('drumkitAuth.loggedIn') === 'true';
  });

  useEffect(() => {
    const onStorage = () => {
      setIsLoggedIn(localStorage.getItem('drumkitAuth.loggedIn') === 'true');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const navAuthEmail = useMemo(() => localStorage.getItem('drumkitAuth.email') || '', []);

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('drumkitAuth.loggedIn');
    localStorage.removeItem('drumkitAuth.email');
    window.dispatchEvent(new Event('drumkit-auth-change'));
    setIsLoggedIn(false);
  };

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

      <div className="nav-auth">
        {isLoggedIn ? (
          <>
            <div className="nav-auth-email" title={navAuthEmail}>
              {navAuthEmail ? navAuthEmail : 'Signed in'}
            </div>
            <button className="nav-auth-button nav-auth-logout" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <button className="nav-auth-button" onClick={() => openAuth('signup')}>
              Sign up
            </button>
            <button className="nav-auth-button nav-auth-login" onClick={() => openAuth('login')}>
              Log in
            </button>
          </>
        )}
      </div>

      <AuthModal
        isOpen={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => handleSuccess()}
      />
    </nav>
  );
};
