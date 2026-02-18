import React from 'react';
import { NavBarHome } from '@/components/Navigation/NavBarHome';
import './styles/Metronome.css';

const Metronome: React.FC = () => {
    return (
        <div className="metronome-container">
            <div className="metronome-background"></div>
            <div className="metronome-content">
                <NavBarHome />
                <div className='metronome-title'>Metronome </div>
            </div>
        </div>
    )
}

export default Metronome;