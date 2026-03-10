import React from 'react';
import { NavBarHome } from '@/components/Navigation/NavBarHome';
import './styles/About.css';

const About: React.FC = () => {
    return (
        <div className="about-container">
            <div className="about-background"></div>
            <div className="about-content">
                <NavBarHome />
                <div className='about-title'>About </div>
            </div>
        </div>
    )
}

export default About;