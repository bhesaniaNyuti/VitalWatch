import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <aside>
            <ul>
                <li><Link to="/patient-view">Patient View</Link></li>
                <li><Link to="/doctor-view">Doctor View</Link></li>
            </ul>
        </aside>
    );
};

export default Sidebar;
