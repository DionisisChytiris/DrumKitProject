import React from 'react';
import { NavBarHome } from '@/components/Navigation/NavBarHome';
import './styles/Progress.css';

const Progress: React.FC = () => {
    return (
        <div className="progress-container">
            <div className="progress-background"></div>
            <div className="progress-content">
                <NavBarHome />
                <div className='progress-title'>Progress </div>
            </div>
        </div>
    )
}

export default Progress;