import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService'; // Import authService
import './Register.css'; // Import Register.css instead of Login.css

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        name: '', // Changed from username to name
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(''); // For API errors
    const [loading, setLoading] = useState(false); // Loading state

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

        if (!formData.name) { // Changed from username to name
            newErrors.name = 'Username is required';
        } else if (formData.name.length < 3) {
            newErrors.name = 'Username must be at least 3 characters';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        setLoading(true);

        if (validateForm()) {
            try {
                // The backend expects 'name', 'email', 'password'
                await authService.register({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                });
                navigate('/login'); // Navigate to login page after successful registration
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
                        {serverError && (
                            <div className="error-message">
                                ⚠️ {serverError}
                            </div>
                        )}

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
                            <label htmlFor="name" className="form-label"> {/* Changed htmlFor and name to 'name' */}
                                Username
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className={`form-input ${errors.name ? 'input-error' : ''}`}
                                placeholder="Choose a username"
                                value={formData.name}
                                onChange={handleChange}
                                autoComplete="username"
                            />
                            {errors.name && (
                                <span className="error-text">{errors.name}</span>
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

                        {/* Removed the role select as it's not in the design */}

                        <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
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