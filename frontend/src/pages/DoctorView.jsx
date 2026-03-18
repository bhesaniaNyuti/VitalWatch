import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { subscribeLiveDashboard } from '../services/liveDashboardService';
import './DoctorView.css';

/* ── Static Data ─────────────────────────────────────────── */

const BP_TREND = [
    { time: '10:43pm', sys: 120, dia: 82 },
    { time: '12:43am', sys: 116, dia: 68 },
    { time: '03:43am', sys: 125, dia: 88 },
    { time: '06:43am', sys: 122, dia: 85 },
    { time: '09:43am', sys: 132, dia: 84 },
    { time: '11:43am', sys: 130, dia: 82 },
    { time: '01:43pm', sys: 136, dia: 88 },
    { time: '04:43pm', sys: 127, dia: 87 },
    { time: '07:43pm', sys: 122, dia: 82 },
];

const PATIENTS = [
    { id: 'P001', ini: 'RK', name: 'Rajesh Kumar',  age: 58, sex: 'Male',   bg: 'O+', location: 'Room 101', bp: '162/105', sys: 162, dia: 105, hr: 92,  spo2: 94, glucose: 164, chol: 212, status: 'Critical', upd: '2 min ago', department: 'Cardiology', registered: '12 Jan, 2022', appointment: 41, bed: '#0101', medHx: 'Hypertension, Stage 2 CKD', meds: 'Amlodipine, Lisinopril, Atorvastatin', allergies: 'Penicillin, Sulfa', emergency: '+91-9876543210 (Wife)', risk: 'High - BP spike detected' },
    { id: 'P002', ini: 'PS', name: 'Priya Sharma',  age: 34, sex: 'Female', bg: 'B+', location: 'Ward A5', bp: '118/76',  sys: 118, dia: 76,  hr: 72,  spo2: 98, glucose: 97,  chol: 85,  status: 'Normal',   upd: '1 min ago', department: 'Cardiology', registered: '20 Jan, 2023', appointment: 35, bed: '#0365', medHx: 'PCOS', meds: 'Metformin, Spironolactone', allergies: 'None', emergency: '+91-9876543211 (Brother)', risk: 'Low - Stable' },
    { id: 'P003', ini: 'AP', name: 'Amit Patel',    age: 67, sex: 'Male',   bg: 'AB+', location: 'ICU-2', bp: '145/92',  sys: 145, dia: 92,  hr: 88,  spo2: 96, glucose: 149, chol: 201, status: 'Warning',  upd: '5 min ago', department: 'Endocrinology', registered: '05 Oct, 2021', appointment: 52, bed: '#0208', medHx: 'Diabetes Type 2, CAD', meds: 'Metoprolol, Aspirin, Insulin', allergies: 'Cephalosporin', emergency: '+91-9876543212 (Daughter)', risk: 'Moderate - Blood sugar elevated' },
    { id: 'P004', ini: 'SR', name: 'Sneha Reddy',   age: 45, sex: 'Female', bg: 'A+', location: 'Room 305', bp: '122/78',  sys: 122, dia: 78,  hr: 68,  spo2: 99, glucose: 92,  chol: 146, status: 'Normal',   upd: '3 min ago', department: 'Internal Medicine', registered: '18 Mar, 2023', appointment: 19, bed: '#0305', medHx: 'Thyroid (Hypothyroid)', meds: 'Levothyroxine', allergies: 'Codeine', emergency: '+91-9876543213 (Husband)', risk: 'Low - Normal range' },
    { id: 'P005', ini: 'VS', name: 'Vikram Singh',  age: 72, sex: 'Male',   bg: 'O-', location: 'CCU-1', bp: '178/110', sys: 178, dia: 110, hr: 105, spo2: 91, glucose: 176, chol: 241, status: 'Critical', upd: '1 min ago', department: 'Cardiac Care', registered: '03 Aug, 2020', appointment: 68, bed: '#CC01', medHx: 'Hypertensive Crisis, AF', meds: 'Diltiazem, Warfarin, Furosemide', allergies: 'NSAIDs', emergency: '+91-9876543214 (Son)', risk: 'Critical - Immediate intervention needed' },
    { id: 'P006', ini: 'AD', name: 'Ananya Das',    age: 29, sex: 'Female', bg: 'B-', location: 'Maternity', bp: '112/72',  sys: 112, dia: 72,  hr: 65,  spo2: 98, glucose: 89,  chol: 132, status: 'Normal',   upd: '8 min ago', department: 'Maternity', registered: '07 Jul, 2024', appointment: 9,  bed: '#M112', medHx: 'Pregnancy (28 weeks)', meds: 'Prenatal vitamins, Iron', allergies: 'Tetracycline', emergency: '+91-9876543215 (Mother)', risk: 'Low - Routine monitoring' },
    { id: 'P007', ini: 'MA', name: 'Mohammed Ali',  age: 61, sex: 'Male',   bg: 'O+', location: 'Room 401', bp: '140/90',  sys: 140, dia: 90,  hr: 84,  spo2: 95, glucose: 131, chol: 186, status: 'Warning',  upd: '4 min ago', department: 'General Medicine', registered: '11 Nov, 2021', appointment: 44, bed: '#0401', medHx: 'Hypertension, Obesity', meds: 'Chlorthalidone, Omeprazole', allergies: 'Erythromycin', emergency: '+91-9876543216 (Sister)', risk: 'Moderate - Weight management needed' },
    { id: 'P008', ini: 'KN', name: 'Kavitha Nair',  age: 52, sex: 'Female', bg: 'AB-', location: 'Ward B3', bp: '125/80',  sys: 125, dia: 80,  hr: 70,  spo2: 97, glucose: 103, chol: 165, status: 'Normal',   upd: '6 min ago', department: 'Neurology', registered: '26 Feb, 2022', appointment: 28, bed: '#B307', medHx: 'Migraine, Hyperlipidemia', meds: 'Topiramate, Rosuvastatin', allergies: 'Aspirin', emergency: '+91-9876543217 (Cousin)', risk: 'Low - Stable condition' },
];

const PATIENT_HISTORY = {
    P001: [
        { date: '08 Mar, 2026', diagnosis: 'Hypertensive Episode', severity: 'High', visits: 9, status: 'Under Treatment' },
        { date: '03 Jan, 2026', diagnosis: 'Renal Function Review', severity: 'Low', visits: 4, status: 'Monitoring' },
        { date: '12 Aug, 2025', diagnosis: 'Edema Follow-up', severity: 'High', visits: 6, status: 'Cured' },
    ],
    P002: [
        { date: '20 Jan, 2023', diagnosis: 'Palpitation Assessment', severity: 'High', visits: 2, status: 'Under Treatment' },
        { date: '12 Jan, 2022', diagnosis: 'Viral Fever', severity: 'Low', visits: 1, status: 'Cured' },
        { date: '20 Jan, 2021', diagnosis: 'COVID 19', severity: 'High', visits: 6, status: 'Cured' },
    ],
    P003: [
        { date: '16 Feb, 2026', diagnosis: 'Glucose Variability', severity: 'High', visits: 11, status: 'Under Treatment' },
        { date: '22 Nov, 2025', diagnosis: 'Chest Discomfort', severity: 'Low', visits: 2, status: 'Monitoring' },
        { date: '01 May, 2025', diagnosis: 'Post-op Follow-up', severity: 'Low', visits: 3, status: 'Cured' },
    ],
    P004: [
        { date: '04 Mar, 2026', diagnosis: 'Thyroid Panel', severity: 'Low', visits: 3, status: 'Monitoring' },
        { date: '17 Sep, 2025', diagnosis: 'Fatigue Assessment', severity: 'Low', visits: 2, status: 'Cured' },
        { date: '08 Mar, 2025', diagnosis: 'Vitamin Deficiency', severity: 'Low', visits: 1, status: 'Cured' },
    ],
    P005: [
        { date: '15 Mar, 2026', diagnosis: 'Hypertensive Crisis', severity: 'High', visits: 13, status: 'Under Treatment' },
        { date: '28 Dec, 2025', diagnosis: 'AF Episode', severity: 'High', visits: 8, status: 'Monitoring' },
        { date: '09 Jul, 2025', diagnosis: 'Breathlessness', severity: 'Low', visits: 4, status: 'Cured' },
    ],
    P006: [
        { date: '11 Mar, 2026', diagnosis: 'Routine Prenatal Check', severity: 'Low', visits: 6, status: 'Monitoring' },
        { date: '17 Jan, 2026', diagnosis: 'Anemia Screening', severity: 'Low', visits: 2, status: 'Cured' },
        { date: '01 Oct, 2025', diagnosis: 'Nausea Management', severity: 'Low', visits: 1, status: 'Cured' },
    ],
    P007: [
        { date: '09 Mar, 2026', diagnosis: 'BP Optimization', severity: 'High', visits: 7, status: 'Under Treatment' },
        { date: '11 Dec, 2025', diagnosis: 'Dietary Counseling', severity: 'Low', visits: 4, status: 'Monitoring' },
        { date: '30 Jun, 2025', diagnosis: 'Sleep Disturbance', severity: 'Low', visits: 2, status: 'Cured' },
    ],
    P008: [
        { date: '05 Mar, 2026', diagnosis: 'Migraine Follow-up', severity: 'Low', visits: 5, status: 'Monitoring' },
        { date: '08 Dec, 2025', diagnosis: 'Lipid Review', severity: 'High', visits: 6, status: 'Under Treatment' },
        { date: '03 Jun, 2025', diagnosis: 'Neck Pain', severity: 'Low', visits: 2, status: 'Cured' },
    ],
};

const ALERTS = [
    { id: 1, type: 'critical', patient: 'Vikram Singh',  msg: 'Systolic BP 178 mmHg — Hypertensive Crisis',   time: '2 min ago',  unread: true  },
    { id: 2, type: 'critical', patient: 'Rajesh Kumar',  msg: 'Systolic BP 162 mmHg — Stage 2 Hypertension', time: '5 min ago',  unread: true  },
    { id: 3, type: 'warning',  patient: 'Amit Patel',   msg: 'Systolic BP 145 mmHg — Stage 1 Hypertension', time: '12 min ago', unread: false },
    { id: 4, type: 'warning',  patient: 'Mohammed Ali', msg: 'Heart rate elevated — 84 bpm',                 time: '18 min ago', unread: false },
    { id: 5, type: 'info',     patient: 'Priya Sharma', msg: 'BP within normal range — 118/76',              time: '30 min ago', unread: false },
    { id: 6, type: 'critical', patient: 'Vikram Singh',  msg: 'SpO₂ dropped to 91% — below threshold',       time: '35 min ago', unread: false },
];

/* ── Icon SVGs ───────────────────────────────────────────── */

const PeopleIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const WaveIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);

const AlertIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const WifiIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
);

const WarnIcon = () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const InfoIcon = () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="8" /><line x1="12" y1="12" x2="12" y2="16" />
    </svg>
);

/* ── Status Badge ────────────────────────────────────────── */

const StatusBadge = ({ status }) => (
    <span className={`dv-badge dv-badge-${status.toLowerCase()}`}>
        {status === 'Critical' && <span className="dv-badge-dot" />}
        {status}
    </span>
);

/* ── BP Chart Tooltip ────────────────────────────────────── */

const BPTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="dv-bp-tooltip">
            <div className="dv-tooltip-time">{label}</div>
            {payload.map(p => (
                <div key={p.dataKey} style={{ color: p.stroke, fontSize: '0.82rem' }}>
                    {p.dataKey === 'sys' ? 'Systolic' : 'Diastolic'}: <strong>{p.value}</strong>
                </div>
            ))}
        </div>
    );
};

/* ── Animated ECG/PPG Waveform ───────────────────────────── */

const ECGWaveform = () => {
    const svgRef = useRef(null);

    useEffect(() => {
        let offset = 0;
        let raf;
        const tick = () => {
            offset = (offset + 1.5) % 160;
            if (svgRef.current) {
                svgRef.current.style.transform = `translateX(-${offset}px)`;
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    const midY = 80, h = 148, cycle = 160, n = 10;
    let linePath = `M 0,${midY}`;
    for (let i = 0; i < n; i++) {
        const x = i * cycle;
        linePath += ` C ${x + 8},${midY} ${x + 18},${midY - 35} ${x + 28},${midY - 68}`;
        linePath += ` C ${x + 38},${midY - 102} ${x + 52},${midY - 52} ${x + 62},${midY - 16}`;
        linePath += ` C ${x + 70},${midY + 10} ${x + 80},${midY - 14} ${x + 92},${midY - 10}`;
        linePath += ` C ${x + 104},${midY - 3} ${x + 126},${midY} ${x + 160},${midY}`;
    }
    const areaPath = linePath + ` L ${n * cycle},${h} L 0,${h} Z`;

    return (
        <div className="dv-ecg-wrapper">
            <svg ref={svgRef} width={n * cycle} height={h} className="dv-ecg-svg">
                <defs>
                    <linearGradient id="dvEcgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%"   stopColor="#818cf8" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#dvEcgGrad)" />
                <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
};

/* ── Main Component ──────────────────────────────────────── */

const DoctorView = () => {
    const navigate = useNavigate();
    const [selected, setSelected]     = useState(PATIENTS[0]);
    const [search, setSearch]         = useState('');
    const [physioTab, setPhysioTab]   = useState('PPG');
    const [bpTrend, setBpTrend]       = useState(BP_TREND);
    const [patients, setPatients]     = useState(PATIENTS);
    const [alerts, setAlerts]         = useState(ALERTS);
    const [patientHistory, setPatientHistory] = useState(PATIENT_HISTORY);
    const [devicesOnline, setDevicesOnline]   = useState(6);
    const [liveStatus, setLiveStatus] = useState('demo');

    useEffect(() => {
        const unsubscribe = subscribeLiveDashboard(
            (liveData) => {
                if (Array.isArray(liveData.bpTrend) && liveData.bpTrend.length > 0) {
                    setBpTrend(liveData.bpTrend);
                }

                if (Array.isArray(liveData.patients) && liveData.patients.length > 0) {
                    setPatients(liveData.patients);
                    setSelected((prevSelected) => {
                        const previousId = prevSelected?.id;
                        const matchedPatient = liveData.patients.find((patient) => patient.id === previousId);
                        return matchedPatient || liveData.patients[0];
                    });
                }

                if (Array.isArray(liveData.alerts)) {
                    setAlerts(liveData.alerts);
                }

                if (liveData.patientHistory && typeof liveData.patientHistory === 'object') {
                    setPatientHistory(liveData.patientHistory);
                }

                if (Number.isFinite(liveData.devicesOnline)) {
                    setDevicesOnline(liveData.devicesOnline);
                }
            },
            setLiveStatus
        );

        return () => unsubscribe();
    }, []);

    const filtered = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedHistory = selected ? (patientHistory[selected.id] || []) : [];
    const criticalCount = patients.filter((patient) => patient.status === 'Critical').length;
    const unreadAlerts = alerts.filter((alert) => alert.unread).length;
    const averageBp = patients.length
        ? (() => {
            const totals = patients.reduce((acc, patient) => {
                const sys = Number.isFinite(patient.sys) ? patient.sys : 120;
                const dia = Number.isFinite(patient.dia) ? patient.dia : 80;
                return { sys: acc.sys + sys, dia: acc.dia + dia };
            }, { sys: 0, dia: 0 });

            return `${Math.round(totals.sys / patients.length)}/${Math.round(totals.dia / patients.length)}`;
        })()
        : '0/0';

    return (
        <div className="dv-root">
            {/* ── Top Bar ─────────────────────────────── */}
            <header className="dv-topbar">
                <div className="dv-search-box">
                    <svg className="dv-search-svg" viewBox="0 0 20 20" fill="none">
                        <circle cx="8.5" cy="8.5" r="5.5" stroke="#94a3b8" strokeWidth="1.6" />
                        <path d="M13 13l3.5 3.5" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    <input
                        className="dv-search-input"
                        placeholder="Search patients, reports..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="dv-topbar-right">
                    <div className="dv-notif-btn">
                        <div className="dv-notif-dot" />
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div className="dv-doctor-block">
                        <div>
                            <div className="dv-doctor-name">Dr. Meera Iyer</div>
                            <div className="dv-doctor-role">Cardiologist</div>
                        </div>
                        <div className="dv-doctor-avatar">MI</div>
                    </div>
                </div>
            </header>

            {/* ── Main Content ─────────────────────────── */}
            <main className="dv-main">

                {/* Title Row */}
                <div className="dv-title-row">
                    <div>
                        <h1 className="dv-title">Dashboard</h1>
                        <p className="dv-subtitle">Welcome back, Dr. Meera — here&apos;s what&apos;s happening today.</p>
                    </div>
                    <div className="dv-online-badge">
                        <span className="dv-online-dot" />
                        {liveStatus === 'live' ? 'Firebase Live' : liveStatus === 'error' ? 'Live Sync Error' : 'Demo Data'}
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="dv-stats-grid">
                    {[
                        { label: 'Total Patients',     value: String(patients.length), sub: liveStatus === 'live' ? 'Live from Firebase' : 'Local sample data', cls: 'dv-icon-purple', icon: <PeopleIcon /> },
                        { label: 'Avg Blood Pressure', value: averageBp, sub: 'Live average',       cls: 'dv-icon-teal',   icon: <WaveIcon />,  unit: 'mmHg' },
                        { label: 'Critical Alerts',    value: String(criticalCount), sub: `${unreadAlerts} unread`, cls: 'dv-icon-red', icon: <AlertIcon /> },
                        { label: 'Online Devices',     value: String(devicesOnline), sub: liveStatus === 'live' ? 'Realtime connected' : 'Fallback mode', cls: 'dv-icon-green',  icon: <WifiIcon />  },
                    ].map(s => (
                        <div key={s.label} className="dv-stat-card">
                            <div>
                                <div className="dv-stat-label">{s.label}</div>
                                <div className="dv-stat-value">
                                    {s.value}
                                    {s.unit && <span className="dv-stat-unit">{s.unit}</span>}
                                </div>
                                <div className="dv-stat-sub">{s.sub}</div>
                            </div>
                            <div className={`dv-stat-icon ${s.cls}`}>{s.icon}</div>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="dv-two-col">
                    {/* BP Trend Chart */}
                    <div className="dv-card dv-bp-card">
                        <div className="dv-card-head">
                            <div>
                                <h2 className="dv-card-title">Blood Pressure Trend</h2>
                                <p className="dv-card-sub">Systolic &amp; Diastolic — Last 24 hours</p>
                            </div>
                            <div className="dv-legend">
                                <span className="dv-legend-item"><span className="dv-dot dv-dot-red" /> Systolic</span>
                                <span className="dv-legend-item"><span className="dv-dot dv-dot-blue" /> Diastolic</span>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={bpTrend} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                <YAxis domain={[60, 190]} ticks={[60, 95, 130, 165, 190]}
                                    tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                <Tooltip content={<BPTooltip />} />
                                <ReferenceLine y={140} stroke="#f59e0b" strokeDasharray="6 3" strokeWidth={1.5} />
                                <ReferenceLine y={90}  stroke="#f59e0b" strokeDasharray="6 3" strokeWidth={1.5} />
                                <Line type="monotone" dataKey="sys" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                                <Line type="monotone" dataKey="dia" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Physiological Signals */}
                    <div className="dv-card dv-physio-card">
                        <div className="dv-card-head">
                            <div>
                                <h2 className="dv-card-title">Physiological Signals</h2>
                                <p className="dv-card-sub">Live PPG / ECG waveform</p>
                            </div>
                            <div className="dv-tab-group">
                                {['PPG', 'ECG'].map(t => (
                                    <button key={t}
                                        className={`dv-tab ${physioTab === t ? 'dv-tab-active' : ''}`}
                                        onClick={() => setPhysioTab(t)}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <ECGWaveform key={physioTab} />
                    </div>
                </div>

                {/* Patient Table + Recent Alerts Row */}
                <div className="dv-two-col">
                    {/* Patient Table */}
                    <div className="dv-card dv-table-card">
                        <h2 className="dv-card-title">Patient Monitoring</h2>
                        <p className="dv-card-sub dv-mb1">{patients.length} patients connected</p>
                        <div className="dv-table-wrap">
                            <table className="dv-table">
                                <thead>
                                    <tr>
                                        <th>PATIENT</th>
                                        <th>BP (MMHG)</th>
                                        <th>♡ HR</th>
                                        <th>SPO₂</th>
                                        <th>STATUS</th>
                                        <th>UPDATED</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(p => (
                                        <tr key={p.id}
                                            className={`dv-tr ${selected?.id === p.id ? 'dv-tr-sel' : ''}`}
                                            onClick={() => setSelected(p)}>
                                            <td>
                                                <div className="dv-pt-cell">
                                                    <div className={`dv-avatar dv-av-${p.status.toLowerCase()}`}>{p.ini}</div>
                                                    <div>
                                                        <div className="dv-pt-name">{p.name}</div>
                                                        <div className="dv-pt-meta">{p.age}y · {p.sex}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`dv-bp-val ${p.status === 'Critical' ? 'dv-red' : p.status === 'Warning' ? 'dv-orange' : ''}`}>
                                                {p.bp}
                                            </td>
                                            <td>{p.hr} <span className="dv-muted">bpm</span></td>
                                            <td className={p.spo2 < 95 ? 'dv-red' : ''}>{p.spo2}%</td>
                                            <td><StatusBadge status={p.status} /></td>
                                            <td className="dv-muted">{p.upd}</td>
                                            <td className="dv-chevron">›</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Alerts */}
                    <div className="dv-card dv-alerts-card">
                        <div className="dv-card-head">
                            <div>
                                <h2 className="dv-card-title">Recent Alerts</h2>
                                <p className="dv-card-sub">2 unread</p>
                            </div>
                            <button className="dv-viewall" onClick={() => navigate('/critical-alerts')}>
                                View All
                            </button>
                        </div>
                        <div className="dv-alerts-list">
                            {alerts.map(a => (
                                <div key={a.id} className={`dv-alert dv-alert-${a.type} ${a.unread ? 'dv-alert-unread' : ''}`}>
                                    <div className={`dv-alert-icon dv-ai-${a.type}`}>
                                        {a.type === 'info' ? <InfoIcon /> : <WarnIcon />}
                                    </div>
                                    <div className="dv-alert-body">
                                        <div className="dv-alert-name">
                                            {a.patient}
                                            {a.unread && <span className="dv-unread-dot" />}
                                        </div>
                                        <div className="dv-alert-msg">{a.msg}</div>
                                        <div className="dv-alert-time">🕐 {a.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selected Patient Detail Card */}
                {selected && (
                    <div className="dv-detail-card">
                        <div className="dv-profile-top">
                            <div className="dv-profile-user">
                                <div className={`dv-profile-avatar dv-av-${selected.status.toLowerCase()}`}>{selected.ini}</div>
                                <div>
                                    <h3 className="dv-profile-name">{selected.name}</h3>
                                    <p className="dv-profile-email">{selected.name.toLowerCase().replace(/\s+/g, '')}@vitalwatch.com</p>
                                    <button className="dv-profile-btn" type="button">Edit Profile</button>
                                </div>
                            </div>
                            <div className="dv-profile-grid">
                                <div className="dv-profile-item"><span>Sex</span><strong>{selected.sex}</strong></div>
                                <div className="dv-profile-item"><span>Age</span><strong>{selected.age}</strong></div>
                                <div className="dv-profile-item"><span>Blood</span><strong>{selected.bg}</strong></div>
                                <div className="dv-profile-item"><span>Status</span><strong>{selected.status}</strong></div>
                                <div className="dv-profile-item"><span>Department</span><strong>{selected.department}</strong></div>
                                <div className="dv-profile-item"><span>Registered Date</span><strong>{selected.registered}</strong></div>
                                <div className="dv-profile-item"><span>Appointment</span><strong>{selected.appointment}</strong></div>
                                <div className="dv-profile-item"><span>Bed Number</span><strong>{selected.bed}</strong></div>
                            </div>
                        </div>

                        <section className="dv-vitals-section">
                            <h3 className="dv-section-title">Patient Current Vitals</h3>
                            <div className="dv-vitals-grid">
                                <article className="dv-vitals-card">
                                    <div className="dv-vitals-label">Blood Pressure</div>
                                    <div className="dv-vitals-value">{selected.bp} <span>mm/hg</span></div>
                                    <div className="dv-vitals-note dv-vitals-ok">In the norm</div>
                                </article>
                                <article className="dv-vitals-card">
                                    <div className="dv-vitals-label">Heart rate</div>
                                    <div className="dv-vitals-value">{selected.hr} <span>BPM</span></div>
                                    <div className={`dv-vitals-note ${selected.hr > 90 ? 'dv-vitals-high' : 'dv-vitals-ok'}`}>
                                        {selected.hr > 90 ? 'Above the norm' : 'In the norm'}
                                    </div>
                                </article>
                                <article className="dv-vitals-card">
                                    <div className="dv-vitals-label">Glucose</div>
                                    <div className="dv-vitals-value">{selected.glucose} <span>mg/dl</span></div>
                                    <div className={`dv-vitals-note ${selected.glucose > 126 ? 'dv-vitals-high' : 'dv-vitals-ok'}`}>
                                        {selected.glucose > 126 ? 'Above the norm' : 'In the norm'}
                                    </div>
                                </article>
                                <article className="dv-vitals-card">
                                    <div className="dv-vitals-label">Cholesterol</div>
                                    <div className="dv-vitals-value">{selected.chol} <span>mg/dl</span></div>
                                    <div className={`dv-vitals-note ${selected.chol > 200 ? 'dv-vitals-high' : 'dv-vitals-ok'}`}>
                                        {selected.chol > 200 ? 'Above the norm' : 'In the norm'}
                                    </div>
                                </article>
                            </div>
                        </section>

                        <section className="dv-history-section">
                            <div className="dv-history-head">
                                <h3 className="dv-section-title">Patient History</h3>
                                <div className="dv-history-total">Total {selectedHistory.length} Visits</div>
                            </div>
                            <div className="dv-history-table-wrap">
                                <table className="dv-history-table">
                                    <thead>
                                        <tr>
                                            <th>Date Of Visit</th>
                                            <th>Diagnosis</th>
                                            <th>Severity</th>
                                            <th>Total Visits</th>
                                            <th>Status</th>
                                            <th>Documents</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedHistory.map((item, index) => (
                                            <tr key={`${selected.id}-history-${index}`}>
                                                <td>{item.date}</td>
                                                <td>{item.diagnosis}</td>
                                                <td>
                                                    <span className={`dv-chip ${item.severity === 'High' ? 'dv-chip-high' : 'dv-chip-low'}`}>
                                                        {item.severity}
                                                    </span>
                                                </td>
                                                <td>{item.visits}</td>
                                                <td>
                                                    <span className={`dv-chip ${item.status === 'Under Treatment' ? 'dv-chip-treat' : 'dv-chip-cured'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td><button className="dv-doc-btn" type="button">Download</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}

            </main>
        </div>
    );
};

export default DoctorView;
