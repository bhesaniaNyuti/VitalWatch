import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { subscribeLiveDashboard } from '../services/liveDashboardService';
import './DoctorView.css';

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

/* ── PPG Chart Tooltip ───────────────────────────────────── */

const PPGTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="dv-bp-tooltip">
            <div className="dv-tooltip-time">Sample #{label}</div>
            <div style={{ color: '#0f5cbd', fontSize: '0.82rem' }}>
                IR: <strong>{payload[0]?.value}</strong>
            </div>
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
    const detailRef = useRef(null);
    const [selected, setSelected]     = useState(null);
    const [search, setSearch]         = useState('');
    const [physioTab, setPhysioTab]   = useState('PPG');
    const [patients, setPatients]     = useState([]);
    const [alerts, setAlerts]         = useState([]);
    const [patientHistory, setPatientHistory] = useState({});
    const [devicesOnline, setDevicesOnline]   = useState(0);
    const [liveStatus, setLiveStatus] = useState('loading');

    useEffect(() => {
        const unsubscribe = subscribeLiveDashboard(
            (liveData) => {
                if (Array.isArray(liveData.patients)) {
                    setPatients(liveData.patients);
                    setSelected((prevSelected) => {
                        if (!prevSelected?.id) return null;
                        const previousId = prevSelected?.id;
                        const matchedPatient = liveData.patients.find((patient) => patient.id === previousId);
                        return matchedPatient || null;
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

    const filtered = patients.filter((p) => {
        const query = search.toLowerCase();
        return p.name.toLowerCase().includes(query) || String(p.id).toLowerCase().includes(query);
    });

    const handleSelectPatient = (patient) => {
        setSelected(patient);
        requestAnimationFrame(() => {
            detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    const selectedHistory = selected ? (patientHistory[selected.id] || []) : [];
    const selectedSignalSeries = selected?.irSeries || [];
    const criticalCount = patients.filter((patient) => patient.status === 'Critical').length;
    const unreadAlerts = alerts.filter((alert) => alert.unread).length;
    const criticalAlerts = alerts.filter((alert) => alert.type === 'critical');
    const recentAlertsToShow = criticalAlerts.length
        ? criticalAlerts
        : patients
            .filter((patient) => patient.status === 'Critical')
            .slice(0, 1)
            .map((patient, index) => ({
                id: `auto-critical-${patient.id}-${index}`,
                type: 'critical',
                patient: patient.name,
                msg: `IR ${patient.irDisplay || 'Unavailable'} | BPM ${patient.bpmDisplay || 'Unavailable'} | SpO2 ${patient.spo2Display || 'Unavailable'}`,
                time: patient.upd,
                unread: true,
            }));
    const unreadRecentAlerts = recentAlertsToShow.filter((alert) => alert.unread).length;
    const averageBpm = patients.length
        ? (() => {
            const bpmValues = patients.map((patient) => patient.bpm).filter((bpm) => Number.isFinite(bpm));
            if (!bpmValues.length) return 'Unavailable';
            const total = bpmValues.reduce((sum, value) => sum + value, 0);
            return `${Math.round(total / bpmValues.length)}`;
        })()
        : 'Unavailable';

    return (
        <div className="dv-root">
            {/* ── Top Bar ─────────────────────────────── */}
            <header className="dv-topbar">
                <div className="dv-brand">
                    <img src="/charusat-logo.svg" alt="Charusat Hospital logo" className="dv-brand-logo" />
                    <div className="dv-brand-text">
                        <strong>Charusat Hospital</strong>
                        <span>Patient Monitoring</span>
                    </div>
                </div>
                <div className="dv-search-box dv-search-box-active">
                    <button
                        className="dv-home-btn"
                        type="button"
                        aria-label="Go to home"
                        onClick={() => navigate('/')}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                            <path d="M12 3.2l9 7.2v10.1a1 1 0 01-1 1h-5.5a1 1 0 01-1-1v-5.2h-3v5.2a1 1 0 01-1 1H4a1 1 0 01-1-1V10.4l9-7.2z" />
                        </svg>
                    </button>
                    <svg className="dv-search-svg" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <circle cx="8.5" cy="8.5" r="5.5" stroke="#94a3b8" strokeWidth="1.6" />
                        <path d="M13 13l3.5 3.5" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    <input
                        className="dv-search-input"
                        placeholder="Search patient name or ID..."
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
                        {liveStatus === 'live' ? 'Firebase Live' : liveStatus === 'error' ? 'Live Sync Error' : 'Waiting for Live Data'}
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="dv-stats-grid">
                    {[
                        { label: 'Total Patients',     value: String(patients.length), sub: liveStatus === 'live' ? 'Live from Firebase' : 'No live records yet', cls: 'dv-icon-purple', icon: <PeopleIcon /> },
                        { label: 'Avg BPM', value: averageBpm, sub: 'Live average', cls: 'dv-icon-teal', icon: <WaveIcon />, unit: averageBpm === 'Unavailable' ? '' : 'bpm' },
                        { label: 'Critical Alerts',    value: String(criticalCount), sub: `${unreadAlerts} unread`, cls: 'dv-icon-red', icon: <AlertIcon /> },
                        { label: 'Online Devices',     value: String(devicesOnline), sub: liveStatus === 'live' ? 'Realtime connected' : 'Awaiting sync', cls: 'dv-icon-green',  icon: <WifiIcon />  },
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
                                        <th>PATIENT / SESSION</th>
                                        <th>IR</th>
                                        <th>BPM</th>
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
                                            onClick={() => handleSelectPatient(p)}>
                                            <td>
                                                <div className="dv-pt-cell">
                                                    <div className={`dv-avatar dv-av-${p.status.toLowerCase()}`}>{p.ini}</div>
                                                    <div>
                                                        <div className="dv-pt-name">{p.name}</div>
                                                        <div className="dv-pt-meta">Session {p.sessionId || p.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`dv-bp-val ${p.status === 'Critical' ? 'dv-red' : ''}`}>
                                                {p.irDisplay || 'Unavailable'}
                                                <div className="dv-muted">Latest IR by max index</div>
                                            </td>
                                            <td>{p.bpmDisplay || 'Unavailable'}</td>
                                            <td className={Number.isFinite(p.spo2) && p.spo2 < 90 ? 'dv-red' : ''}>{p.spo2Display || 'Unavailable'}</td>
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
                                <p className="dv-card-sub">{unreadRecentAlerts} unread</p>
                            </div>
                            <button className="dv-viewall" onClick={() => navigate('/critical-alerts')}>
                                View All
                            </button>
                        </div>
                        <div className="dv-alerts-list">
                            {recentAlertsToShow.map(a => (
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
                    <div ref={detailRef} className="dv-detail-card">
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
                                <div className="dv-profile-item"><span>Patient ID</span><strong>{selected.id}</strong></div>
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

                        <section className="dv-detail-charts">
                            <div className="dv-card dv-bp-card">
                                <div className="dv-card-head">
                                    <div>
                                        <h2 className="dv-card-title">PPG Signal (IR Waveform)</h2>
                                        <p className="dv-card-sub">{selected.name} — Live signal from Firebase session data</p>
                                    </div>
                                    <div className="dv-legend">
                                        <span className="dv-legend-item"><span className="dv-dot dv-dot-blue" /> IR Signal</span>
                                    </div>
                                </div>
                                {selectedSignalSeries.length ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <LineChart data={selectedSignalSeries} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="sample" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                            <Tooltip content={<PPGTooltip />} />
                                            <Line type="monotone" dataKey="value" stroke="#0f5cbd" strokeWidth={2.2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="dv-select-hint" style={{ marginTop: '0.75rem' }}>
                                        No IR waveform points available for this session yet.
                                    </div>
                                )}
                            </div>

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
                        </section>

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

                {!selected && (
                    <div className="dv-select-hint">
                        Click on a patient row in Patient Monitoring to view patient details and graphs.
                    </div>
                )}

            </main>
        </div>
    );
};

export default DoctorView;
