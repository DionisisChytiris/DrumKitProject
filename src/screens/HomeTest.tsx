import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/HomeTest.css';
import {Navigation} from '../components/Navigation'

const HomeTest: React.FC = ()=>{
    const navigate = useNavigate();

    return (
        <div className="hometest-container">
            <Navigation/>
            <div className="hometest-background">
                <div className="hometest-overlay"></div>
            </div>
            <div className="hometest-content">
                <div className="navigation-tiles">
                    <button 
                        className="nav-tile"
                        onClick={() => navigate('/practice')}
                    >
                        <span className="nav-tile-icon">▶</span>
                        <span className="nav-tile-text">Start Practice</span>
                    </button>
                    <button className="nav-tile"  onClick={() => navigate('/exercises')}>
                        <span className="nav-tile-icon">🥁</span>
                        <span className="nav-tile-text">Exercises</span>
                    </button>
                    <button className="nav-tile" onClick={() => navigate('/connectmidi')}>
                        <span className="nav-tile-icon">🎧</span>
                        <span className="nav-tile-text">Connect MIDI</span>
                    </button>
                    <button className="nav-tile" onClick={() => navigate('/metronome')}>
                        <span className="nav-tile-icon">⏱</span>
                        <span className="nav-tile-text">Metronome</span>
                    </button>
                    <button className="nav-tile" onClick={() => navigate('/progress')}>
                        <span className="nav-tile-icon">📈</span>
                        <span className="nav-tile-text">Progress</span>
                    </button>
                    <button className="nav-tile">
                        <span className="nav-tile-icon">⚙</span>
                        <span className="nav-tile-text">Settings</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default HomeTest;