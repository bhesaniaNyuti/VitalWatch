import api from './api';

class AuthService {
    async login(credentials) {
        return api.post('/auth/login', credentials);
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
