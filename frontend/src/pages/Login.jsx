import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Simple validation
        if (!formData.username || !formData.password) {
            setError('Please enter both username and password');
            return;
        }

        // TODO: Replace with actual API call
        // For now, just navigate to dashboard
        console.log('Login attempt:', formData);
        navigate('/doctor-view');
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    {/* Logo and Title */}
                    <div className="login-header">
                        <div className="login-logo">❤️</div>
                        <h1 className="login-title">Medico</h1>
                        <p className="login-subtitle">Doctor & Nurse Login</p>
                    </div>

                    {/* Login Form */}
                    <form className="login-form" onSubmit={handleSubmit}>
                        {error && (
                            <div className="error-message">
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="username" className="form-label">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                className="form-input"
                                placeholder="Enter your username"
                                value={formData.username}
                                onChange={handleChange}
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                className="form-input"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-login">
                            Login to Dashboard
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="login-footer">
                        <p className="footer-text">
                            Don't have an account?{' '}
                            <Link to="/register" className="footer-link">
                                Sign up here
                            </Link>
                        </p>
                        <Link to="/" className="back-link">
                            ← Back to Home
                        </Link>
                    </div>
                </div>

                {/* Side Info */}
                <div className="login-info">
                    <div className="info-content">
                        <h2>Welcome Back!</h2>
                        <p>Access the patient monitoring dashboard to track real-time blood pressure data from IoT devices.</p>

                        <div className="info-features">
                            <div className="info-feature">
                                <span className="feature-icon">📊</span>
                                <span>Real-time Monitoring</span>
                            </div>
                            <div className="info-feature">
                                <span className="feature-icon">🔔</span>
                                <span>Instant Alerts</span>
                            </div>
                            <div className="info-feature">
                                <span className="feature-icon">👥</span>
                                <span>Multi-Patient View</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
