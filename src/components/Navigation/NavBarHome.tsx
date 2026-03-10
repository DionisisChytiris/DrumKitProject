import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CustomizeModal } from '../../Modals/CustomizeModal';
import './NavBarHome.css';
import { PracticeSoundSettingsModal } from '@/Modals/PracticeSoundSettings';
import { MixerModal } from '../../Modals/MixerModal'
import { SequencerModal } from '../../Modals/SequencerModal'

export const NavBarHome: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [isMixerModalOpen, setIsMixerModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSequencerModalOpen, setIsSequencerModalOpen] = useState(false)
  const [isPracticeSoundSettingsModalOpen, setIsPracticeSoundSettingsModalOpen] = useState(false)

  const handleMixerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMixerModalOpen(true);
  };

  const handleCustomizeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handlePracticeSoundClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPracticeSoundSettingsModalOpen(true);
  };

  const handleSequencerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSequencerModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const handleSequencerCloseModal = () => {
    setIsSequencerModalOpen(false);
  };

  const handleMixerCloseModal = () => {
    setIsMixerModalOpen(false);
  };

  const handleClosePracticeSoundSettingsModal = () => {
    setIsPracticeSoundSettingsModalOpen(false);
  };

  const handleCloseAllModals = () => {
    console.log('[NavBar] handleCloseAllModals called - closing all modals');
    setIsMixerModalOpen(false);
    setIsModalOpen(false);
    setIsSequencerModalOpen(false);
    setIsPracticeSoundSettingsModalOpen(false);
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
          {currentPath === '/practice' && (
            <>
              <div
                className='nav-link1'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMixerClick(e);
                }}
                onMouseEnter={() => {
                  console.log('[NavBar] Mixer onMouseEnter fired');
                  handleCloseAllModals();
                }}
                onMouseOver={() => {
                  // Fallback in case onMouseEnter doesn't work
                  console.log('[NavBar] Mixer onMouseOver fired');
                }}
              >
                Mixer
              </div>
              <div
                className='nav-link1'
                onClick={handleCustomizeClick}
                onMouseEnter={handleCloseAllModals}
              >
                Customize
              </div>
              <div
                className='nav-link1'
                onClick={handleSequencerClick}
                onMouseEnter={handleCloseAllModals}
              >
                Sequencer
              </div>
            </>
          )}
          <div
            className='nav-link1'
            onClick={handlePracticeSoundClick}
            onMouseEnter={handleCloseAllModals}
          >
            Settings
          </div>
          {currentPath !== '/practice' && (
            <div className="nav-brand">
              <NavLink to="/practice" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className='nav-link1'>Practice</div>
              </NavLink>
            </div>
          )}
          {currentPath !== '/metronome' && (
            <div className="nav-brand">
              <NavLink to="/metronome" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className='nav-link1'>Metronome</div>
              </NavLink>
            </div>
          )}
          {currentPath !== '/exercises' && (
            <div className="nav-brand">
              <NavLink to="/exercises" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className='nav-link1'>Exercises</div>
              </NavLink>
            </div>
          )}

          <div className='nav-link2'></div>
        </div>
      </nav>
      <MixerModal isOpen={isMixerModalOpen} onClose={handleMixerCloseModal} />
      <CustomizeModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <SequencerModal isOpen={isSequencerModalOpen} onClose={handleSequencerCloseModal} />
      <PracticeSoundSettingsModal isOpen={isPracticeSoundSettingsModalOpen} onClose={handleClosePracticeSoundSettingsModal} />
    </>
  );
};
