import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'doctor'
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error for this field when user starts typing
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.username) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            // TODO: Replace with actual API call
            console.log('Registration attempt:', formData);
            // Navigate to login page after successful registration
            navigate('/login');
        }
    };

    return (
        <div className="login-page">
            <div className="login-container register-container">
                <div className="login-card">
                    {/* Logo and Title */}
                    <div className="login-header">
                        <div className="login-logo">❤️</div>
                        <h1 className="login-title">Create Account</h1>
                        <p className="login-subtitle">Register as Doctor or Nurse</p>
                    </div>

                    {/* Registration Form */}
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className={`form-input ${errors.email ? 'input-error' : ''}`}
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                            />
                            {errors.email && (
                                <span className="error-text">{errors.email}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="username" className="form-label">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                className={`form-input ${errors.username ? 'input-error' : ''}`}
                                placeholder="Choose a username"
                                value={formData.username}
                                onChange={handleChange}
                                autoComplete="username"
                            />
                            {errors.username && (
                                <span className="error-text">{errors.username}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                className={`form-input ${errors.password ? 'input-error' : ''}`}
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                            />
                            {errors.password && (
                                <span className="error-text">{errors.password}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                            />
                            {errors.confirmPassword && (
                                <span className="error-text">{errors.confirmPassword}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="role" className="form-label">
                                Role
                            </label>
                            <select
                                id="role"
                                name="role"
                                className="form-input form-select"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="doctor">Doctor</option>
                                <option value="nurse">Nurse</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary btn-login">
                            Create Account
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="login-footer">
                        <p className="footer-text">
                            Already have an account?{' '}
                            <Link to="/login" className="footer-link">
                                Login here
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
                        <h2>Join Medico</h2>
                        <p>Create your account to access the patient monitoring dashboard and start tracking real-time vital signs.</p>

                        <div className="info-features">
                            <div className="info-feature">
                                <span className="feature-icon">🔒</span>
                                <span>Secure & HIPAA Compliant</span>
                            </div>
                            <div className="info-feature">
                                <span className="feature-icon">⚡</span>
                                <span>Instant Setup</span>
                            </div>
                            <div className="info-feature">
                                <span className="feature-icon">🏥</span>
                                <span>Professional Tools</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
