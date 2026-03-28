import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import PatientView from './pages/PatientView';
import DoctorView from './pages/DoctorView';
import CriticalAlerts from './pages/CriticalAlerts';

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<DoctorView />} />
                <Route path="/patient-view" element={<PatientView />} />
                <Route path="/doctor-view" element={<DoctorView />} />
                <Route path="/critical-alerts" element={<CriticalAlerts />} />
                <Route path="*" element={<Navigate to="/doctor-view" replace />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;
