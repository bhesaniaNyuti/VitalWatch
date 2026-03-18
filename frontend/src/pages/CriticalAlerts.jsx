import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeLiveDashboard } from '../services/liveDashboardService';
import './CriticalAlerts.css';

const FALLBACK_PATIENTS = [
    { id: 'P001', name: 'Rajesh Kumar', bp: '162/105', sys: 162, dia: 105, hr: 92, spo2: 94, status: 'Critical', risk: 'High - BP spike detected', upd: '2 min ago' },
    { id: 'P003', name: 'Amit Patel', bp: '145/92', sys: 145, dia: 92, hr: 88, spo2: 96, status: 'Warning', risk: 'Moderate - Blood sugar elevated', upd: '5 min ago' },
    { id: 'P005', name: 'Vikram Singh', bp: '178/110', sys: 178, dia: 110, hr: 105, spo2: 91, status: 'Critical', risk: 'Critical - Immediate intervention needed', upd: '1 min ago' },
    { id: 'P007', name: 'Mohammed Ali', bp: '140/90', sys: 140, dia: 90, hr: 84, spo2: 95, status: 'Warning', risk: 'Moderate - Weight management needed', upd: '4 min ago' },
];

const FALLBACK_ALERTS = [
    { id: 1, type: 'critical', patient: 'Vikram Singh', msg: 'Systolic BP 178 mmHg - Hypertensive Crisis', time: '2 min ago', unread: true },
    { id: 2, type: 'critical', patient: 'Rajesh Kumar', msg: 'Systolic BP 162 mmHg - Stage 2 Hypertension', time: '5 min ago', unread: true },
    { id: 3, type: 'warning', patient: 'Amit Patel', msg: 'Systolic BP 145 mmHg - Stage 1 Hypertension', time: '12 min ago', unread: false },
    { id: 4, type: 'warning', patient: 'Mohammed Ali', msg: 'Heart rate elevated - 84 bpm', time: '18 min ago', unread: false },
];

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
    const [patients, setPatients] = useState(FALLBACK_PATIENTS);
    const [alerts, setAlerts] = useState(FALLBACK_ALERTS);
    const [liveStatus, setLiveStatus] = useState('demo');

    useEffect(() => {
        const unsubscribe = subscribeLiveDashboard(
            (liveData) => {
                if (Array.isArray(liveData.patients) && liveData.patients.length > 0) {
                    setPatients(liveData.patients);
                }
                if (Array.isArray(liveData.alerts) && liveData.alerts.length > 0) {
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
                    {liveStatus === 'live' ? 'Firebase Live' : liveStatus === 'error' ? 'Live Sync Error' : 'Demo Data'}
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
