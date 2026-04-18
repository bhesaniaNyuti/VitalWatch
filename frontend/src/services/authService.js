import api from './api';

class AuthService {
    async login(email, password, role) {
        const payload = role ? { email, password, role } : { email, password };
        const response = await api.post('/auth/login', payload);
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    }

    async register(userInfo) {
        const payload = {
            ...userInfo,
            role: userInfo?.role || 'patient',
        };
        return api.post('/auth/register', payload);
    }

    logout() {
        // Implement logout logic
        localStorage.removeItem('token');
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('user'));
    }
}

export default new AuthService();
