import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CustomizeModal } from '../../Modals/CustomizeModal';
import './NavBarHome.css';

export const NavBarHome: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCustomizeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <nav className="main-navigation1">
        <div className="nav-brand">
          <NavLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            {/* <h1>🥁 Drum Kit Learning Platform</h1> */}
            <div className='nav-brand-text'>🥁  <span style={{ marginRight: '0.3rem' }}>Drum</span> <span style={{ marginRight: '0.3rem' }}>Kit</span> <span style={{ marginRight: '0.3rem' }}> Learning</span> <span style={{ marginRight: '0.3rem' }}>Platform</span></div>
          </NavLink>
        </div>
        <div className="nav-links">
          {/* <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            🏠 Home
          </NavLink> */}
          <NavLink
            to="/hometest"
            className='nav-link1'
          //   className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Mixer
          </NavLink>
          <div 
            className='nav-link1' 
            onClick={handleCustomizeClick}
          >
            Customize
          </div>
          <NavLink
            to="/setting"
            className='nav-link1'
          //   className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Settings
          </NavLink>
          <div className='nav-link2'></div>
        </div>
      </nav>
      <CustomizeModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};
