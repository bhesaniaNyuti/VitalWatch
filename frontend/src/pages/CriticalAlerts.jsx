import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeLiveDashboard } from '../services/liveDashboardService';
import './CriticalAlerts.css';

const isNearCritical = (patient) => {
    if (!patient) return false;

    const highRiskText = String(patient.risk || '').toLowerCase();
    return (
        patient.status === 'Warning' ||
        patient.sys >= 140 ||
        patient.dia >= 90 ||
        patient.hr >= 90 ||
        patient.spo2 <= 95 ||
        highRiskText.includes('high') ||
        highRiskText.includes('moderate')
    );
};

const severityFromPatient = (patient) => {
    if (patient.status === 'Critical' || patient.sys >= 160 || patient.dia >= 100 || patient.spo2 <= 92) {
        return 'Critical';
    }
    return 'Near Critical';
};

const CriticalAlerts = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [liveStatus, setLiveStatus] = useState('loading');

    useEffect(() => {
        const unsubscribe = subscribeLiveDashboard(
            (liveData) => {
                if (Array.isArray(liveData.patients)) {
                    setPatients(liveData.patients);
                }
                if (Array.isArray(liveData.alerts)) {
                    setAlerts(liveData.alerts);
                }
            },
            setLiveStatus
        );

        return () => unsubscribe();
    }, []);

    const criticalPatients = useMemo(
        () => patients.filter((patient) => patient.status === 'Critical'),
        [patients]
    );

    const nearCriticalPatients = useMemo(
        () => patients.filter((patient) => patient.status !== 'Critical' && isNearCritical(patient)),
        [patients]
    );

    const actionableAlerts = useMemo(
        () => alerts.filter((alert) => alert.type === 'critical' || alert.type === 'warning'),
        [alerts]
    );

    return (
        <div className="ca-root">
            <header className="ca-topbar">
                <button className="ca-back" type="button" onClick={() => navigate('/doctor-view')}>
                    Back to Dashboard
                </button>
                <div className="ca-status">
                    {liveStatus === 'live' ? 'Firebase Live' : liveStatus === 'error' ? 'Live Sync Error' : 'Waiting for Live Data'}
                </div>
            </header>

            <main className="ca-main">
                <div className="ca-title-row">
                    <h1 className="ca-title">Critical Monitoring Center</h1>
                    <p className="ca-subtitle">All critical and likely-to-be-critical patients in one place.</p>
                </div>

                <section className="ca-summary-grid">
                    <article className="ca-summary-card">
                        <span>Critical Patients</span>
                        <strong>{criticalPatients.length}</strong>
                    </article>
                    <article className="ca-summary-card ca-summary-warn">
                        <span>Near Critical Patients</span>
                        <strong>{nearCriticalPatients.length}</strong>
                    </article>
                    <article className="ca-summary-card ca-summary-alert">
                        <span>Actionable Alerts</span>
                        <strong>{actionableAlerts.length}</strong>
                    </article>
                </section>

                <section className="ca-card">
                    <h2>Critical Patients</h2>
                    <div className="ca-list">
                        {criticalPatients.length === 0 && <p className="ca-empty">No critical patients right now.</p>}
                        {criticalPatients.map((patient) => (
                            <article key={patient.id} className="ca-item ca-item-critical">
                                <div>
                                    <h3>{patient.name}</h3>
                                    <p>{patient.risk}</p>
                                </div>
                                <div className="ca-vitals">
                                    <span>BP {patient.bp}</span>
                                    <span>HR {patient.hr}</span>
                                    <span>SpO2 {patient.spo2}%</span>
                                    <span>{patient.upd}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="ca-card">
                    <h2>Near Critical Patients</h2>
                    <div className="ca-list">
                        {nearCriticalPatients.length === 0 && <p className="ca-empty">No near-critical patients right now.</p>}
                        {nearCriticalPatients.map((patient) => (
                            <article key={patient.id} className="ca-item ca-item-near">
                                <div>
                                    <h3>{patient.name}</h3>
                                    <p>{patient.risk}</p>
                                </div>
                                <div className="ca-vitals">
                                    <span>{severityFromPatient(patient)}</span>
                                    <span>BP {patient.bp}</span>
                                    <span>HR {patient.hr}</span>
                                    <span>SpO2 {patient.spo2}%</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="ca-card">
                    <h2>Critical and Warning Alerts</h2>
                    <div className="ca-table-wrap">
                        <table className="ca-table">
                            <thead>
                                <tr>
                                    <th>Severity</th>
                                    <th>Patient</th>
                                    <th>Message</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {actionableAlerts.map((alert) => (
                                    <tr key={alert.id}>
                                        <td>
                                            <span className={`ca-chip ${alert.type === 'critical' ? 'ca-chip-critical' : 'ca-chip-warning'}`}>
                                                {alert.type}
                                            </span>
                                        </td>
                                        <td>{alert.patient}</td>
                                        <td>{alert.msg}</td>
                                        <td>{alert.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default CriticalAlerts;
