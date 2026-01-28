import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PatientView from './pages/PatientView';
import DoctorView from './pages/DoctorView';

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/patient-view" element={<PatientView />} />
                <Route path="/doctor-view" element={<DoctorView />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;
