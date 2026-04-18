import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Login.css';

const REGISTER_ROLES = ['doctor', 'nurse'];

const roleLabel = (role) => `${role.charAt(0).toUpperCase()}${role.slice(1)}`;

const Register = ({ defaultRole = null }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const routeRole = useMemo(() => {
        if (location.pathname.includes('/doctor/')) return 'doctor';
        if (location.pathname.includes('/nurse/')) return 'nurse';
        return null;
    }, [location.pathname]);
    const fixedRole = defaultRole || routeRole;
    const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
    const [selectedRole, setSelectedRole] = useState(fixedRole || 'doctor');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: '' }));
        setServerError('');
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!formData.email) nextErrors.email = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) nextErrors.email = 'Enter a valid email address.';

        if (!formData.password) nextErrors.password = 'Password is required.';
        else if (formData.password.length < 6) nextErrors.password = 'Use at least 6 characters.';

        if (!formData.confirmPassword) nextErrors.confirmPassword = 'Confirm your password.';
        else if (formData.confirmPassword !== formData.password) nextErrors.confirmPassword = 'Passwords do not match.';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setServerError('');
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            const derivedName = String(formData.email).split('@')[0] || 'user';
            await authService.register({
                name: derivedName,
                email: formData.email,
                password: formData.password,
                role: fixedRole || selectedRole,
            });
            navigate(fixedRole ? `/${fixedRole}/login` : '/login');
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Registration failed.';
            setServerError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <img src="/charusat-hospital-logo.svg" alt="CHARUSAT Hospital logo" className="auth-logo" />
                <h1>{fixedRole ? `${roleLabel(fixedRole)} Signup` : 'Create account'}</h1>
                <p className="auth-subtitle">Join the CHARUSAT Hospital monitoring dashboard.</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {serverError && <div className="auth-error">{serverError}</div>}

                    {!fixedRole && (
                        <label className="auth-field">
                            <span>Register as</span>
                            <select
                                name="role"
                                value={selectedRole}
                                onChange={(event) => setSelectedRole(event.target.value)}
                            >
                                {REGISTER_ROLES.map((role) => (
                                    <option key={role} value={role}>
                                        {roleLabel(role)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    <label className="auth-field">
                        <span>Email</span>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="doctor@charusat.com"
                            autoComplete="email"
                        />
                    </label>
                    {errors.email && <div className="auth-error">{errors.email}</div>}

                    <label className="auth-field">
                        <span>Password</span>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            autoComplete="new-password"
                        />
                    </label>
                    {errors.password && <div className="auth-error">{errors.password}</div>}

                    <label className="auth-field">
                        <span>Confirm password</span>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repeat the password"
                            autoComplete="new-password"
                        />
                    </label>
                    {errors.confirmPassword && <div className="auth-error">{errors.confirmPassword}</div>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Register'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to={fixedRole ? `/${fixedRole}/login` : '/login'}>Login</Link>
                </p>
                {!fixedRole && (
                    <p className="auth-switch">
                        Quick links: <Link to="/doctor/signup">Doctor Signup</Link> | <Link to="/nurse/signup">Nurse Signup</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Register;