import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth(); // Use the login function from AuthContext
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.email || !formData.password) {
            setError('Please enter both email and password');
            setLoading(false);
            return;
        }

        try {
            const userData = await authService.login(formData.email, formData.password);
            login(userData); // Update AuthContext with user data
            navigate('/doctor-view');
        } catch (err) {
            const message = err.response && err.response.data && err.response.data.message
                ? err.response.data.message
                : err.message;
            setError(message);
        } finally {
            setLoading(false);
        }
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
                            <label htmlFor="email" className="form-label">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="form-input"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
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

                        <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login to Dashboard'}
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