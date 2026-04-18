import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    return (
        <div className="home-page">
            {/* Navbar */}
            <nav className="home-navbar">
                <div className="container">
                    <div className="navbar-content">
                        <Link to="/" className="navbar-logo">
                            <span>VitalWatch</span>
                        </Link>

                        <ul className="navbar-nav">
                            <li><a href="#dashboard">Dashboard</a></li>
                            <li><Link to="/doctor-view">Alerts</Link></li>
                            <li><a href="#about">About</a></li>
                        </ul>

                        <div className="navbar-actions">
                            <div className="notification-icon">
                                🔔
                                <span className="notification-badge">3</span>
                            </div>
                            <Link to="/doctor-view" className="user-avatar">👤</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <div className="hero-content fade-in-up">
                        <div className="hero-badge">
                            <span className="badge badge-red">
                                ⚡ Blue-white live monitoring
                            </span>
                        </div>

                        <h1 className="hero-title">
                            Welcome to <span className="highlight">CHARUSAT HOSPITAL</span>
                        </h1>

                        <p className="hero-subtitle">
                            Monitoring Patient Blood Pressure in Real-Time with live IoT readings, instant alerts, and clear patient trends.
                        </p>

                        <div className="hero-actions">
                            <Link to="/doctor-view" className="btn btn-primary btn-lg">
                                Access Dashboard
                                <span className="arrow-icon">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-icon icon-container-red">
                                ❤️
                            </div>
                            <div className="stat-value">500+</div>
                            <div className="stat-label">Patients Monitored</div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-icon icon-container-yellow">
                                ⚡
                            </div>
                            <div className="stat-value">&lt;1s</div>
                            <div className="stat-label">Alert Response Time</div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-icon icon-container-green">
                                🛡️
                            </div>
                            <div className="stat-value">99.9%</div>
                            <div className="stat-label">Uptime Reliability</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Powerful Features for Healthcare Professionals</h2>
                        <p className="section-subtitle">
                            Everything you need to monitor and manage patient blood pressure data effectively.
                        </p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon icon-container-red">
                                📊
                            </div>
                            <h3 className="feature-title">Real-Time Monitoring</h3>
                            <p className="feature-description">
                                Track blood pressure readings in real-time with live data streaming from IoT devices.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon icon-container-red">
                                🔔
                            </div>
                            <h3 className="feature-title">Instant Alerts</h3>
                            <p className="feature-description">
                                Receive immediate notifications when BP readings fall outside normal ranges.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon icon-container-red">
                                👥
                            </div>
                            <h3 className="feature-title">Multi-Patient Dashboard</h3>
                            <p className="feature-description">
                                Monitor multiple patients simultaneously with an intuitive dashboard interface.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon icon-container-red">
                                📡
                            </div>
                            <h3 className="feature-title">IoT Integration</h3>
                            <p className="feature-description">
                                Seamless connectivity with IoT blood pressure monitoring devices.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon icon-container-red">
                                🛡️
                            </div>
                            <h3 className="feature-title">HIPAA Compliant</h3>
                            <p className="feature-description">
                                Enterprise-grade security ensuring patient data privacy and compliance.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon icon-container-red">
                                📈
                            </div>
                            <h3 className="feature-title">Historical Trends</h3>
                            <p className="feature-description">
                                Analyze patient BP trends over time with comprehensive historical data.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dashboard Preview Section */}
            <section id="dashboard" className="dashboard-preview-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Live Dashboard Preview</h2>
                        <p className="section-subtitle">
                            Experience real-time patient monitoring with simulated live data updates.
                        </p>
                    </div>

                    <div className="preview-content">
                        {/* Stats Cards */}
                        <div className="preview-stats">
                            <div className="preview-stat-card">
                                <div className="stat-card-header">
                                    <div>
                                        <div className="stat-card-label">Total Patients</div>
                                        <div className="stat-card-value">
                                            24
                                            <span className="stat-card-change positive">+12%</span>
                                        </div>
                                        <div className="stat-card-subtitle">Active monitoring</div>
                                    </div>
                                    <div className="stat-card-icon icon-container-red">
                                        👥
                                    </div>
                                </div>
                            </div>

                            <div className="preview-stat-card">
                                <div className="stat-card-header">
                                    <div>
                                        <div className="stat-card-label">Critical Alerts</div>
                                        <div className="stat-card-value">3</div>
                                        <div className="stat-card-subtitle">Require attention</div>
                                    </div>
                                    <div className="stat-card-icon icon-container-red">
                                        ⚠️
                                    </div>
                                </div>
                            </div>

                            <div className="preview-stat-card">
                                <div className="stat-card-header">
                                    <div>
                                        <div className="stat-card-label">Avg. Systolic</div>
                                        <div className="stat-card-value">122</div>
                                        <div className="stat-card-subtitle">mmHg across all patients</div>
                                    </div>
                                    <div className="stat-card-icon icon-container-green">
                                        📊
                                    </div>
                                </div>
                            </div>

                            <div className="preview-stat-card">
                                <div className="stat-card-header">
                                    <div>
                                        <div className="stat-card-label">Avg. Heart Rate</div>
                                        <div className="stat-card-value">
                                            78
                                            <span className="stat-card-change negative">-3%</span>
                                        </div>
                                        <div className="stat-card-subtitle">BPM average</div>
                                    </div>
                                    <div className="stat-card-icon icon-container-yellow">
                                        ❤️
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dashboard Grid */}
                        <div className="dashboard-grid">
                            {/* Patient Overview */}
                            <div className="patient-overview-section">
                                <h3>Patient Overview</h3>
                                <div className="patients-grid">
                                    {/* Patient 1 - Normal */}
                                    <div className="patient-card status-normal">
                                        <div className="patient-header">
                                            <div className="patient-info">
                                                <div className="patient-avatar">👤</div>
                                                <div>
                                                    <div className="patient-name">John Smith</div>
                                                    <div className="patient-id">ID: P-001</div>
                                                </div>
                                            </div>
                                            <span className="badge badge-normal">Normal</span>
                                        </div>

                                        <div className="bp-reading">
                                            <span className="bp-value">118</span>
                                            <span className="bp-separator">/</span>
                                            <span className="bp-value">76</span>
                                        </div>

                                        <div className="bp-meta">
                                            <span>mmHg</span>
                                            <span className="heart-rate">❤️ 72 BPM</span>
                                        </div>

                                        <div className="bp-chart">
                                            <div className="chart-bar" style={{ height: '40%' }}></div>
                                            <div className="chart-bar" style={{ height: '55%' }}></div>
                                            <div className="chart-bar" style={{ height: '50%' }}></div>
                                            <div className="chart-bar" style={{ height: '65%' }}></div>
                                            <div className="chart-bar" style={{ height: '45%' }}></div>
                                            <div className="chart-bar" style={{ height: '70%' }}></div>
                                            <div className="chart-bar" style={{ height: '60%' }}></div>
                                            <div className="chart-bar" style={{ height: '55%' }}></div>
                                            <div className="chart-bar" style={{ height: '75%' }}></div>
                                            <div className="chart-bar" style={{ height: '65%' }}></div>
                                        </div>

                                        <div className="patient-details-grid">
                                            <div className="patient-detail"><span className="patient-detail-label">Age</span><span className="patient-detail-value">57</span></div>
                                            <div className="patient-detail"><span className="patient-detail-label">Room</span><span className="patient-detail-value">B-204</span></div>
                                            <div className="patient-detail"><span className="patient-detail-label">Condition</span><span className="patient-detail-value">Stable</span></div>
                                            <div className="patient-detail"><span className="patient-detail-label">Last Check</span><span className="patient-detail-value">08:42 AM</span></div>
                                        </div>

                                        <div className="patient-doctor-row">
                                            <span className="patient-doctor-label">Checked By</span>
                                            <span className="patient-doctor-badge">Dr. Meera Iyer</span>
                                        </div>

                                        <div className="bp-meta" style={{ marginTop: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem' }}>Updated 1s ago</span>
                                        </div>
                                    </div>

                                    {/* Patient 2 - Normal */}
                                    <div className="patient-card status-normal">
                                        <div className="patient-header">
                                            <div className="patient-info">
                                                <div className="patient-avatar">👤</div>
                                                <div>
                                                    <div className="patient-name">Emily Davis</div>
                                                    <div className="patient-id">ID: P-002</div>
                                                </div>
                                            </div>
                                            <span className="badge badge-normal">Normal</span>
                                        </div>

                                        <div className="bp-reading">
                                            <span className="bp-value">116</span>
                                            <span className="bp-separator">/</span>
                                            <span className="bp-value">74</span>
                                        </div>

                                        <div className="bp-meta">
                                            <span>mmHg</span>
                                            <span className="heart-rate">❤️ 70 BPM</span>
                                        </div>

                                        <div className="bp-chart">
                                            <div className="chart-bar" style={{ height: '45%' }}></div>
                                            <div className="chart-bar" style={{ height: '60%' }}></div>
                                            <div className="chart-bar" style={{ height: '55%' }}></div>
                                            <div className="chart-bar" style={{ height: '70%' }}></div>
                                            <div className="chart-bar" style={{ height: '65%' }}></div>
                                            <div className="chart-bar" style={{ height: '75%' }}></div>
                                            <div className="chart-bar" style={{ height: '70%' }}></div>
                                            <div className="chart-bar" style={{ height: '80%' }}></div>
                                            <div className="chart-bar" style={{ height: '75%' }}></div>
                                            <div className="chart-bar" style={{ height: '70%' }}></div>
                                        </div>

                                        <div className="patient-details-grid">
                                            <div className="patient-detail"><span className="patient-detail-label">Age</span><span className="patient-detail-value">43</span></div>
                                            <div className="patient-detail"><span className="patient-detail-label">Room</span><span className="patient-detail-value">A-118</span></div>
                                            <div className="patient-detail"><span className="patient-detail-label">Condition</span><span className="patient-detail-value">Under Observation</span></div>
                                            <div className="patient-detail"><span className="patient-detail-label">Last Check</span><span className="patient-detail-value">08:40 AM</span></div>
                                        </div>

                                        <div className="patient-doctor-row">
                                            <span className="patient-doctor-label">Checked By</span>
                                            <span className="patient-doctor-badge">Dr. Rohan Shah</span>
                                        </div>

                                        <div className="bp-meta" style={{ marginTop: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem' }}>Updated 1s ago</span>
                                        </div>
                                    </div>

                                    {/* Patient 3 - Highly Critical */}
                                    <div className="patient-card status-critical">
                                        <div className="patient-header">
                                            <div className="patient-info">
                                                <div className="patient-avatar">👤</div>
                                                <div>
                                                    <div className="patient-name">Michael Johnson</div>
                                                    <div className="patient-id">ID: P-003</div>
                                                </div>
                                            </div>
                                            <span className="badge badge-critical">Highly Critical</span>
                                        </div>

                                        <div className="bp-reading">
                                            <span className="bp-value">198</span>
                                            <span className="bp-separator">/</span>
                                            <span className="bp-value">124</span>
                                        </div>

                                        <div className="bp-meta">
                                            <span>mmHg</span>
                                            <span className="heart-rate">❤️ 108 BPM</span>
                                        </div>

                                        <div className="bp-chart">
                                            <div className="chart-bar" style={{ height: '35%' }}></div>
                                            <div className="chart-bar" style={{ height: '50%' }}></div>
                                            <div className="chart-bar" style={{ height: '45%' }}></div>
                                            <div className="chart-bar" style={{ height: '60%' }}></div>
                                            <div className="chart-bar" style={{ height: '55%' }}></div>
                                            <div className="chart-bar" style={{ height: '65%' }}></div>
                                            <div className="chart-bar" style={{ height: '70%' }}></div>
                                            <div className="chart-bar" style={{ height: '60%' }}></div>
                                            <div className="chart-bar" style={{ height: '75%' }}></div>
                                            <div className="chart-bar" style={{ height: '80%' }}></div>
                                        </div>

                                        <div className="patient-details-grid">
                                            <div className="patient-detail"><span className="patient-detail-label">Age</span><span className="patient-detail-value">66</span></div>
                                            <div className="patient-detail"><span className="patient-detail-label">Room</span><span className="patient-detail-value">ICU-03</span></div>
                                            <div className="patient-detail"><span className="patient-detail-label">Condition</span><span className="patient-detail-value">Critical</span></div>
                                            <div className="patient-detail"><span className="patient-detail-label">Last Check</span><span className="patient-detail-value">08:44 AM</span></div>
                                        </div>

                                        <div className="patient-doctor-row">
                                            <span className="patient-doctor-label">Checked By</span>
                                            <span className="patient-doctor-badge">Dr. Priya Nair</span>
                                        </div>

                                        <div className="bp-meta" style={{ marginTop: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem' }}>Updated 1s ago</span>
                                        </div>
                                    </div>

                                    {/* Patient 4 - Normal */}
                                    <div className="patient-card status-normal">
                                        <div className="patient-header">
                                            <div className="patient-info">
                                                <div className="patient-avatar">👤</div>
                                                <div>
                                                    <div className="patient-name">Sarah Wilson</div>
                                                    <div className="patient-id">ID: P-004</div>
                                                </div>
                                            </div>
                                            <span className="badge badge-normal">Normal</span>
                                        </div>

                                        <div className="bp-reading">
                                            <span className="bp-value">120</span>
                                            <span className="bp-separator">/</span>
                                            <span className="bp-value">78</span>
                                        </div>

                                        <div className="bp-meta">
                                            <span>mmHg</span>
                                            <span className="heart-rate">❤️ 74 BPM</span>
                                        </div>

                                        <div className="bp-chart">
                                            <div className="chart-bar" style={{ height: '50%' }}></div>
                                            <div className="chart-bar" style={{ height: '65%' }}></div>
                                            <div className="chart-bar" style={{ height: '60%' }}></div>
                                            <div className="chart-bar" style={{ height: '70%' }}></div>
                                            <div className="chart-bar" style={{ height: '75%' }}></div>
                                            <div className="chart-bar" style={{ height: '80%' }}></div>
                                            <div className="chart-bar" style={{ height: '70%' }}></div>
                                            <div className="chart-bar" style={{ height: '85%' }}></div>
                                            <div className="chart-bar" style={{ height: '75%' }}></div>
                                            <div className="chart-bar" style={{ height: '80%' }}></div>
                                        </div>

                                        <div className="patient-details-grid">
                                            <div className="patient-detail"><span className="patient-detail-label">Age</span><span className="patient-detail-value">51</span></div>
                                            <div className="patient-detail"><span className="patient-detail-label">Room</span><span className="patient-detail-value">B-109</span></div>
                                            <div className="patient-detail"><span className="patient-detail-label">Condition</span><span className="patient-detail-value">Stable</span></div>
                                            <div className="patient-detail"><span className="patient-detail-label">Last Check</span><span className="patient-detail-value">08:39 AM</span></div>
                                        </div>

                                        <div className="patient-doctor-row">
                                            <span className="patient-doctor-label">Checked By</span>
                                            <span className="patient-doctor-badge">Dr. Kavya Patel</span>
                                        </div>

                                        <div className="bp-meta" style={{ marginTop: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem' }}>Updated 1s ago</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Alerts */}
                            <div className="recent-alerts-section">
                                <h3>Recent Alerts</h3>
                                <div className="alerts-list">
                                    <div className="alert-card high-bp">
                                        <div className="alert-header">
                                            <div className="alert-icon icon-container-red">
                                                📈
                                            </div>
                                            <div className="alert-content">
                                                <div className="alert-title">Highly Critical BP Alert</div>
                                                <div className="alert-patient">Michael Johnson (ID: P-003)</div>
                                            </div>
                                        </div>
                                        <div className="alert-details">
                                            <div className="alert-bp">
                                                ⚠️ 198/124 mmHg
                                            </div>
                                            <div className="alert-time">
                                                🕐 Just now
                                            </div>
                                        </div>
                                        <button className="alert-close">✕</button>
                                    </div>

                                    <div className="alert-card low-bp">
                                        <div className="alert-header">
                                            <div className="alert-icon icon-container-yellow">
                                                📉
                                            </div>
                                            <div className="alert-content">
                                                <div className="alert-title">Normal Monitoring</div>
                                                <div className="alert-patient">Sarah Wilson (ID: P-004)</div>
                                            </div>
                                        </div>
                                        <div className="alert-details">
                                            <div className="alert-bp">
                                                ⚠️ 120/78 mmHg
                                            </div>
                                            <div className="alert-time">
                                                🕐 2 min ago
                                            </div>
                                        </div>
                                        <button className="alert-close">✕</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="container">
                    <div className="footer-content">
                        <div>
                            <div className="footer-brand">
                                <span>VitalWatch</span>
                            </div>
                            <p className="footer-description">
                                Advanced IoT-powered blood pressure monitoring platform for healthcare professionals. Monitor, analyze, and respond to patient vitals in real-time.
                            </p>
                        </div>

                        <div className="footer-section">
                            <h4>Product</h4>
                            <ul className="footer-links">
                                <li><a href="#features">Features</a></li>
                                <li><a href="#dashboard">Dashboard</a></li>
                                <li><a href="#pricing">Pricing</a></li>
                                <li><a href="#demo">Demo</a></li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h4>Company</h4>
                            <ul className="footer-links">
                                <li><a href="#about">About Us</a></li>
                                <li><a href="#contact">Contact</a></li>
                                <li><a href="#careers">Careers</a></li>
                                <li><a href="#blog">Blog</a></li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h4>Legal</h4>
                            <ul className="footer-links">
                                <li><a href="#privacy">Privacy Policy</a></li>
                                <li><a href="#terms">Terms of Service</a></li>
                                <li><a href="#hipaa">HIPAA Compliance</a></li>
                                <li><a href="#security">Security</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>&copy; 2026 CHARUSAT HOSPITAL. All rights reserved. Built for healthcare professionals.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
