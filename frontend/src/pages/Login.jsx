import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const LOGIN_ROLES = ['doctor', 'nurse'];

const roleLabel = (role) => `${role.charAt(0).toUpperCase()}${role.slice(1)}`;

const Login = ({ defaultRole = null }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const routeRole = useMemo(() => {
        if (location.pathname.includes('/doctor/')) return 'doctor';
        if (location.pathname.includes('/nurse/')) return 'nurse';
        return null;
    }, [location.pathname]);
    const fixedRole = defaultRole || routeRole;
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [selectedRole, setSelectedRole] = useState(fixedRole || 'doctor');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setFormData((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.email || !formData.password) {
            setError('Please enter both email and password.');
            setLoading(false);
            return;
        }

        try {
            const userRole = fixedRole || selectedRole;
            const userData = await authService.login(formData.email, formData.password, userRole);
            login(userData);
            navigate('/doctor-view');
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Login failed.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <img src="/charusat-hospital-logo.svg" alt="CHARUSAT Hospital logo" className="auth-logo" />
                <h1>{fixedRole ? `${roleLabel(fixedRole)} Login` : 'Login'}</h1>
                <p className="auth-subtitle">Access the CHARUSAT Hospital monitoring dashboard.</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}

                    {!fixedRole && (
                        <label className="auth-field">
                            <span>Login as</span>
                            <select
                                name="role"
                                value={selectedRole}
                                onChange={(event) => setSelectedRole(event.target.value)}
                            >
                                {LOGIN_ROLES.map((role) => (
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

                    <label className="auth-field">
                        <span>Password</span>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                        />
                    </label>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Login'}
                    </button>
                </form>

                <p className="auth-switch">
                    New here? <Link to={fixedRole ? `/${fixedRole}/signup` : '/register'}>Create an account</Link>
                </p>
                {!fixedRole && (
                    <p className="auth-switch">
                        Quick links: <Link to="/doctor/login">Doctor Login</Link> | <Link to="/nurse/login">Nurse Login</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;