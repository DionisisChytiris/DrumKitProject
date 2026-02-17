import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CustomizeModal } from '../../Modals/CustomizeModal';
import './NavBarHome.css';
import { PracticeSoundSettingsModal } from '@/Modals/PracticeSoundSettings';
import {MixerModal} from '../../Modals/MixerModal'
import {SequencerModal} from '../../Modals/SequencerModal'

export const NavBarHome: React.FC = () => {
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
          <div 
            className='nav-link1' 
            onClick={handleMixerClick}
            onMouseEnter={handleCloseAllModals}
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
          <div 
            className='nav-link1' 
            onClick={handlePracticeSoundClick}
            onMouseEnter={handleCloseAllModals}
          >
            Settings
          </div>

          <div className='nav-link2'></div>
        </div>
      </nav>
      <MixerModal isOpen={isMixerModalOpen} onClose={handleMixerCloseModal}/>
      <CustomizeModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <SequencerModal isOpen={isSequencerModalOpen} onClose={handleSequencerCloseModal}/>
      <PracticeSoundSettingsModal isOpen={isPracticeSoundSettingsModalOpen} onClose={handleClosePracticeSoundSettingsModal}/>
    </>
  );
};
