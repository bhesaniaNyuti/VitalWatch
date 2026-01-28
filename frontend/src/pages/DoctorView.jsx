import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PatientCard from '../components/PatientCard';
import NotificationPopup from '../components/NotificationPopup';
import AddPatientModal from '../components/AddPatientModal';
import './DoctorView.css';

const DoctorView = () => {
    const [patients, setPatients] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        normal: 0,
        elevated: 0,
        critical: 0
    });

    // Sample patient data (will be replaced with API calls)
    useEffect(() => {
        const samplePatients = [
            {
                id: 'P-001',
                name: 'John Doe',
                age: 65,
                room: '101',
                systolic: 105,
                diastolic: 98,
                pulse: 70,
                status: 'Elevated',
                trend: 'up',
                lastUpdate: new Date().toISOString(),
                isLive: true
            },
            {
                id: 'P-002',
                name: 'Jane Smith',
                age: 48,
                room: '102',
                systolic: 100,
                diastolic: 74,
                pulse: 84,
                status: 'Normal',
                trend: 'stable',
                lastUpdate: new Date().toISOString(),
                isLive: true
            },
            {
                id: 'P-003',
                name: 'Robert Johnson',
                age: 72,
                room: '103',
                systolic: 159,
                diastolic: 100,
                pulse: 92,
                status: 'Critical',
                trend: 'up',
                lastUpdate: new Date().toISOString(),
                isLive: true
            },
            {
                id: 'P-004',
                name: 'Mary Williams',
                age: 55,
                room: '104',
                systolic: 133,
                diastolic: 118,
                pulse: 59,
                status: 'Critical',
                trend: 'up',
                lastUpdate: new Date().toISOString(),
                isLive: true
            },
            {
                id: 'P-005',
                name: 'James Brown',
                age: 58,
                room: '105',
                systolic: 118,
                diastolic: 78,
                pulse: 75,
                status: 'Normal',
                trend: 'stable',
                lastUpdate: new Date().toISOString(),
                isLive: true
            },
            {
                id: 'P-006',
                name: 'Patricia Davis',
                age: 61,
                room: '106',
                systolic: 125,
                diastolic: 85,
                pulse: 68,
                status: 'Elevated',
                trend: 'down',
                lastUpdate: new Date().toISOString(),
                isLive: true
            }
        ];

        setPatients(samplePatients);
        calculateStats(samplePatients);

        // Simulate critical alert for demonstration
        const criticalPatients = samplePatients.filter(p => p.status === 'Critical');
        if (criticalPatients.length > 0) {
            const alert = {
                patientName: criticalPatients[0].name,
                patientId: criticalPatients[0].id,
                systolic: criticalPatients[0].systolic,
                diastolic: criticalPatients[0].diastolic,
                timestamp: new Date().toISOString(),
                type: criticalPatients[0].systolic > 140 ? 'high' : 'low'
            };
            setAlerts([alert]);
        }
    }, []);

    const calculateStats = (patientList) => {
        const stats = {
            total: patientList.length,
            normal: patientList.filter(p => p.status === 'Normal').length,
            elevated: patientList.filter(p => p.status === 'Elevated').length,
            critical: patientList.filter(p => p.status === 'Critical').length
        };
        setStats(stats);
    };

    const handleCloseAlert = (index) => {
        setAlerts(alerts.filter((_, i) => i !== index));
    };

    const handleAddPatient = (patientData) => {
        // TODO: Replace with actual API call
        const newPatient = {
            id: `P-${String(patients.length + 1).padStart(3, '0')}`,
            name: patientData.name,
            age: parseInt(patientData.age),
            room: patientData.room,
            systolic: 120,
            diastolic: 80,
            pulse: 72,
            status: 'Normal',
            trend: 'stable',
            lastUpdate: new Date().toISOString(),
            isLive: true
        };

        const updatedPatients = [...patients, newPatient];
        setPatients(updatedPatients);
        calculateStats(updatedPatients);
        setIsAddPatientModalOpen(false);
    };

    // Sort patients: Critical first, then Elevated, then Normal
    const sortedPatients = [...patients].sort((a, b) => {
        const statusOrder = { 'Critical': 0, 'Elevated': 1, 'Normal': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });

    return (
        <div className="doctor-dashboard">
            {/* Dashboard Header */}
            <header className="dashboard-header">
                <div className="container">
                    <div className="dashboard-header-content">
                        <Link to="/" className="dashboard-title-section">
                            <div className="dashboard-logo">❤️</div>
                            <div className="dashboard-title-text">
                                <h1>Medico</h1>
                                <p className="dashboard-subtitle">Patient Monitoring System</p>
                            </div>
                        </Link>

                        <div className="dashboard-header-actions">
                            <div className="system-status">
                                <span className="status-dot"></span>
                                System Online
                            </div>
                            <div className="doctor-profile">
                                <div className="doctor-avatar">👤</div>
                                <div className="doctor-info">
                                    <div className="doctor-name">Dr. Smith</div>
                                    <div className="doctor-role">Cardiologist</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Dashboard Content */}
            <main className="dashboard-content">
                <div className="container">
                    {/* Summary Statistics */}
                    <div className="summary-stats">
                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-card-info">
                                    <h3>Total Patients</h3>
                                    <div className="stat-card-value">{stats.total}</div>
                                    <div className="stat-card-label">Currently monitored</div>
                                </div>
                                <div className="stat-card-icon icon-container-red">
                                    👥
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-card-info">
                                    <h3>Normal</h3>
                                    <div className="stat-card-value">{stats.normal}</div>
                                    <div className="stat-card-label">Stable readings</div>
                                </div>
                                <div className="stat-card-icon icon-container-green">
                                    ✓
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-card-info">
                                    <h3>Elevated</h3>
                                    <div className="stat-card-value">{stats.elevated}</div>
                                    <div className="stat-card-label">Requires observation</div>
                                </div>
                                <div className="stat-card-icon icon-container-yellow">
                                    ⚠️
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-card-info">
                                    <h3>Critical</h3>
                                    <div className="stat-card-value">{stats.critical}</div>
                                    <div className="stat-card-label">Immediate attention</div>
                                </div>
                                <div className="stat-card-icon icon-container-red">
                                    🚨
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section Header */}
                    <div className="section-header-dashboard">
                        <div>
                            <h2>Live Patient Monitoring</h2>
                            <p>Real-time blood pressure data from IoT devices</p>
                        </div>
                        <div className="section-header-actions">
                            <div className="iot-badge">
                                📡 IoT Connected
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={() => setIsAddPatientModalOpen(true)}
                            >
                                + Add Patient
                            </button>
                        </div>
                    </div>

                    {/* Patient Grid */}
                    <div className="patients-grid-dashboard">
                        {sortedPatients.map((patient) => (
                            <PatientCard key={patient.id} patient={patient} />
                        ))}
                    </div>
                </div>
            </main>

            {/* Notification Popups */}
            {alerts.map((alert, index) => (
                <NotificationPopup
                    key={index}
                    alert={alert}
                    onClose={() => handleCloseAlert(index)}
                />
            ))}

            {/* Add Patient Modal */}
            <AddPatientModal
                isOpen={isAddPatientModalOpen}
                onClose={() => setIsAddPatientModalOpen(false)}
                onSubmit={handleAddPatient}
            />
        </div>
    );
};

export default DoctorView;
