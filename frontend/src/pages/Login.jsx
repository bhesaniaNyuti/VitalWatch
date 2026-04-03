import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
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
        <div className="auth-page">
            <div className="auth-shell">
                <header className="auth-header">
                    <img
                        src="/charusat-hospital-logo.svg"
                        alt="Charusat Hospital Logo"
                        className="auth-logo-image"
                    />
                    <div className="auth-menu">☰</div>
                </header>

                <div className="auth-body">
                    <section className="auth-visual">
                        <img
                            src="/doctor-illustration.svg"
                            alt="Doctor illustration"
                            className="auth-visual-image"
                        />
                        <p>Realtime patient insights with calm, clear workflows.</p>
                    </section>

                    <section className="auth-panel">
                        <div className="auth-tabs">
                            <Link to="/login" className="auth-tab auth-tab-active">Login</Link>
                            <Link to="/register" className="auth-tab">Register</Link>
                        </div>

                        <p className="auth-caption">Please enter your email and password</p>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            {error && <div className="auth-error">{error}</div>}

                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">🔒</span>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="Your Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                />
                            </div>

                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">🔒</span>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="Your Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                />
                                <span className="auth-input-eye">👁</span>
                            </div>

                            <button type="submit" disabled={loading}>
                                {loading ? 'Signing in...' : 'Login'}
                            </button>
                        </form>

                        <div className="auth-links">
                            <span>
                                Don&apos;t have an account? <Link to="/register">Register</Link>
                            </span>
                            <a href="#">Forgot Password?</a>
                        </div>

                        <div className="auth-or"><span>or</span></div>
                        <a className="auth-forgot" href="#">Forgot Password?</a>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Login;