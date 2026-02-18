import React from 'react';
import { NavBarHome } from '@/components/Navigation/NavBarHome';
import './styles/Exercises.css';

const Exercises: React.FC = () => {
    return (
        <div className="exercises-container">
            <div className="exercises-background"></div>
            <div className="exercises-content">
                <NavBarHome />
                <div className='exercises-title'>exercises </div>
            </div>
        </div>
    )
}

export default Exercises;