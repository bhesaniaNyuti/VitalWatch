import api from './api';

class AuthService {
    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    }

    async register(userInfo) {
        return api.post('/auth/register', userInfo);
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
