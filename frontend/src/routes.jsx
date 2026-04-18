import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import PatientView from './pages/PatientView';
import DoctorView from './pages/DoctorView';
import CriticalAlerts from './pages/CriticalAlerts';
import Register from './pages/Register';
import AddPatientScreen from './pages/AddPatientScreen';

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/doctor/login" element={<Login defaultRole="doctor" />} />
                <Route path="/doctor/signup" element={<Register defaultRole="doctor" />} />
                <Route path="/nurse/login" element={<Login defaultRole="nurse" />} />
                <Route path="/nurse/signup" element={<Register defaultRole="nurse" />} />
                <Route path="/dashboard" element={<DoctorView />} />
                <Route path="/doctor-view/add-patient" element={<AddPatientScreen />} />
                <Route path="/patient-view" element={<PatientView />} />
                <Route path="/doctor-view" element={<DoctorView />} />
                <Route path="/critical-alerts" element={<CriticalAlerts />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;
