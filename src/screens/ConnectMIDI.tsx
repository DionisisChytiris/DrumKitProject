import React from 'react';
import { NavBarHome } from '@/components/Navigation/NavBarHome';
import './styles/ConnectMIDI.css';

const ConnectMIDI: React.FC = () => {
    return (
        <div className="connectmidi-container">
            <div className="connectmidi-background"></div>
            <div className="connectmidi-content">
                <NavBarHome />
                <div className='connectmidi-title'>connectmidi </div>
            </div>
        </div>
    )
}

export default ConnectMIDI;