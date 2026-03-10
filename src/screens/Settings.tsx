import React from 'react';
import { NavBarHome } from '@/components/Navigation/NavBarHome';
import './styles/Settings.css';

const Settings: React.FC = () => {
    return (
        <div className="settings-main-container">
            <div className="settings-main-background"></div>
            <div className="settings-main-content">
                <NavBarHome />
                <div className='settings-main-title'>Settings </div>
            </div>
        </div>
    )
}

export default Settings;