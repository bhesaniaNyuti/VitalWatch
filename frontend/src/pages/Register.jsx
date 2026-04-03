import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Login.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
        setServerError(''); // Clear server error on input change
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirm password is required';
        } else if (formData.confirmPassword !== formData.password) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        setLoading(true);

        if (validateForm()) {
            try {
                const derivedName = String(formData.email).split('@')[0] || 'user';
                await authService.register({
                    name: derivedName,
                    email: formData.email,
                    password: formData.password,
                });
                navigate('/login');
            } catch (err) {
                const message = err.response && err.response.data && err.response.data.message
                    ? err.response.data.message
                    : err.message;
                setServerError(message);
            } finally {
                setLoading(false);
            }
        } else {
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
                            <Link to="/login" className="auth-tab">Login</Link>
                            <Link to="/register" className="auth-tab auth-tab-active">Register</Link>
                        </div>

                        <p className="auth-caption">Create account using email and password</p>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            {serverError && <div className="auth-error">{serverError}</div>}

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
                            {errors.email && <div className="auth-error">{errors.email}</div>}

                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">🔒</span>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="Your Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />
                                <span className="auth-input-eye">👁</span>
                            </div>
                            {errors.password && <div className="auth-error">{errors.password}</div>}

                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">🔒</span>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />
                                <span className="auth-input-eye">👁</span>
                            </div>
                            {errors.confirmPassword && <div className="auth-error">{errors.confirmPassword}</div>}

                            <button type="submit" disabled={loading}>
                                {loading ? 'Creating...' : 'Register'}
                            </button>
                        </form>

                        <div className="auth-links">
                            <span>
                                Already have an account? <Link to="/login">Login</Link>
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

export default Register;